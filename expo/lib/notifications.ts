import { Platform } from 'react-native';
import { OneSignal, LogLevel } from 'react-native-onesignal';

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
export function initializeNotifications(): void {
  if (initAttempted || Platform.OS === 'web') return;
  initAttempted = true;

  const appId = getOneSignalAppId();
  if (!appId) {
    console.warn('[Notifications] Missing EXPO_PUBLIC_ONESIGNAL_APP_ID — skipping init');
    return;
  }

  try {
    OneSignal.Debug.setLogLevel(LogLevel.Warn);
    OneSignal.initialize(appId);
    notificationsInitialized = true;

    // Request notification permission (deferred, non-blocking)
    OneSignal.Notifications.requestPermission(true)
      .then((granted: boolean) => {
        console.log('[Notifications] Permission granted:', granted);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn('[Notifications] Permission request error:', msg);
      });

    // Handle notification clicks (app opened from notification)
    OneSignal.Notifications.addEventListener('click', (event: unknown) => {
      const e = event as { result?: { url?: string } };
      console.log('[Notifications] Clicked, URL:', e?.result?.url ?? 'none');
    });

    // Display notifications when app is in foreground
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: unknown) => {
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
export function loginOneSignalUser(userId: string): void {
  if (!notificationsInitialized || Platform.OS === 'web') return;
  try {
    OneSignal.login(userId);
    console.log('[Notifications] OneSignal login:', userId);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Notifications] Login error:', msg);
  }
}

/** Logout the OneSignal user (call on app sign-out). */
export function logoutOneSignalUser(): void {
  if (!notificationsInitialized || Platform.OS === 'web') return;
  try {
    OneSignal.logout();
    console.log('[Notifications] OneSignal logout');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Notifications] Logout error:', msg);
  }
}
