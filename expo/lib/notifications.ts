import { Platform } from 'react-native';

// Lazy-loaded OneSignal — avoids crashing on web where the native
// module does not exist. The import only happens on native platforms.
let OneSignalModule: typeof import('react-native-onesignal') | null = null;

async function getOneSignal() {
  if (Platform.OS === 'web') return null;
  if (!OneSignalModule) {
    OneSignalModule = await import('react-native-onesignal');
  }
  return OneSignalModule;
}

let notificationsInitialized = false;
let initAttempted = false;

/** OneSignal App ID from public env. */
function getOneSignalAppId(): string {
  return process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID?.trim() ?? '';
}

/**
 * Initialize the OneSignal SDK. Safe to call on web (no-op) and
 * when the native module is unavailable (graceful fallback).
 * Idempotent — safe to call multiple times.
 */
export async function initializeNotifications(): Promise<void> {
  if (initAttempted || Platform.OS === 'web') return;
  initAttempted = true;

  const appId = getOneSignalAppId();
  if (!appId) {
    console.warn('[Notifications] Missing EXPO_PUBLIC_ONESIGNAL_APP_ID — skipping init');
    return;
  }

  try {
    const OneSignal = await getOneSignal();
    if (!OneSignal) return;

    OneSignal.OneSignal.Debug.setLogLevel(OneSignal.LogLevel.Warn);
    OneSignal.OneSignal.initialize(appId);
    notificationsInitialized = true;

    // Request notification permission (deferred, non-blocking)
    OneSignal.OneSignal.Notifications.requestPermission(true)
      .then((granted: boolean) => {
        console.log('[Notifications] Permission granted:', granted);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('[Notifications] Permission request error:', msg);
      });

    // Handle notification clicks (app opened from notification)
    OneSignal.OneSignal.Notifications.addEventListener('click', (event: unknown) => {
      const e = event as { result?: { url?: string } };
      console.log('[Notifications] Clicked, URL:', e?.result?.url ?? 'none');
    });

    // Display notifications when app is in foreground
    OneSignal.OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: unknown) => {
      const e = event as {
        preventDefault: () => void;
        getNotification: () => { display: () => void };
      };
      e.preventDefault();
      e.getNotification().display();
    });

    console.log('[Notifications] OneSignal initialized, appId:', appId);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Notifications] Initialization error:', msg);
    notificationsInitialized = false;
  }
}

/**
 * Login the OneSignal user with the Supabase user ID.
 * This enables user-centric tracking and targeting in the OneSignal dashboard.
 */
export async function loginOneSignalUser(userId: string): Promise<void> {
  if (!notificationsInitialized || Platform.OS === 'web') return;
  try {
    const OneSignal = await getOneSignal();
    if (!OneSignal) return;
    OneSignal.OneSignal.login(userId);
    console.log('[Notifications] OneSignal login:', userId);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Notifications] Login error:', msg);
  }
}

/** Logout the OneSignal user (call on app sign-out). */
export async function logoutOneSignalUser(): Promise<void> {
  if (!notificationsInitialized || Platform.OS === 'web') return;
  try {
    const OneSignal = await getOneSignal();
    if (!OneSignal) return;
    OneSignal.OneSignal.logout();
    console.log('[Notifications] OneSignal logout');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Notifications] Logout error:', msg);
  }
}
