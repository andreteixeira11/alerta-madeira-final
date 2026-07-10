import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';

/**
 * Notification system using expo-notifications + OneSignal REST API.
 *
 * The native react-native-onesignal TurboModule crashes on iOS 26 + RN 0.81
 * (Hermes heap corruption from NSException in performVoidMethodInvocation).
 * This module replaces it: expo-notifications gets the native push token,
 * and a Supabase Edge Function registers the device with OneSignal via REST API.
 * The OneSignal dashboard and send-notification edge function continue to work.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let notificationsInitialized = false;
let initAttempted = false;
let currentPushToken: string | null = null;

// --- Foreground notification handler ---
// Must be set at module level (before any await) so it's active immediately.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Initialise push notifications: request permission, get push token,
 * and register the device with OneSignal via a Supabase Edge Function.
 * Safe to call on web (no-op). Idempotent.
 */
export async function initializeNotifications(): Promise<void> {
  if (initAttempted || Platform.OS === 'web') return;
  initAttempted = true;

  try {
    // Android: create a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelGroupAsync('default', {
        name: 'Alerta Madeira',
        description: 'Notificações da app Alerta Madeira',
      });
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Alerta Madeira',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission not granted — skipping registration');
      return;
    }

    // Get the native push token (APNs on iOS, FCM on Android)
    // Android requires google-services.json + Firebase configured in app.config.ts
    console.log('[Notifications] Getting push token... Platform:', Platform.OS);
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    const pushToken = tokenResponse.data;
    if (!pushToken) {
      console.warn('[Notifications] No push token returned. Response:', JSON.stringify(tokenResponse));
      if (Platform.OS === 'android') {
        console.warn('[Notifications] Android: Ensure google-services.json is in the project root and Firebase is configured.');
      }
      return;
    }

    currentPushToken = pushToken;
    console.log('[Notifications] Push token obtained:', pushToken.substring(0, 30) + '...', 'Platform:', Platform.OS);

    // Register the device with OneSignal via Supabase Edge Function
    await registerWithOneSignal(pushToken);

    notificationsInitialized = true;
    console.log('[Notifications] Initialised successfully');

    // Listen for token refresh
    Notifications.addPushTokenListener(async (newToken) => {
      if (newToken.data && newToken.data !== currentPushToken) {
        currentPushToken = newToken.data;
        console.log('[Notifications] Token refreshed, re-registering');
        await registerWithOneSignal(newToken.data);
      }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Notifications] Init error:', msg);
  }
}

/**
 * Register (or update) a device with OneSignal via the register-device
 * Supabase Edge Function. The edge function calls the OneSignal REST API.
 */
async function registerWithOneSignal(pushToken: string): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken ?? ''}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        pushToken,
        deviceType: Platform.OS === 'ios' ? 0 : 1,
        userId: sessionData.session?.user?.id ?? null,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn('[Notifications] Register-device error:', response.status, text);
      return;
    }

    const result = await response.json();
    console.log('[Notifications] Registered with OneSignal, player_id:', result.playerId ?? 'unknown');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Notifications] Registration failed:', msg);
  }
}

/**
 * Set the OneSignal external_user_id (Supabase user ID) so the user
 * can be targeted from the OneSignal dashboard. Called on login.
 */
/**
 * Set the OneSignal external_user_id (Supabase user ID) so the user
 * can be targeted from the OneSignal dashboard. Called on login.
 * If notifications haven't finished initializing, retry with a delay.
 */
export async function loginOneSignalUser(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  // If not initialized yet, wait briefly and retry (init may still be running)
  if (!notificationsInitialized || !currentPushToken) {
    console.log('[Notifications] Not yet initialized, retrying login in 3s...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    if (!notificationsInitialized || !currentPushToken) {
      console.warn('[Notifications] Still not initialized after retry, skipping login');
      return;
    }
  }

  try {
    await registerWithOneSignal(currentPushToken);
    console.log('[Notifications] OneSignal user login:', userId);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Notifications] Login error:', msg);
  }
}

/**
 * Clear the OneSignal external_user_id. Called on logout.
 */
export async function logoutOneSignalUser(): Promise<void> {
  if (!currentPushToken || Platform.OS === 'web') return;
  try {
    // Re-register without a userId to clear the external_user_id
    const { data: sessionData } = await supabase.auth.getSession();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token ?? ''}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        pushToken: currentPushToken,
        deviceType: Platform.OS === 'ios' ? 0 : 1,
        userId: null,
      }),
    });
    if (response.ok) {
      console.log('[Notifications] OneSignal user logout');
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Notifications] Logout error:', msg);
  }
}
