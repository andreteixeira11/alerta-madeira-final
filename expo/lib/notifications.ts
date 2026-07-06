import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

let notificationsInitialized = false;

/** EAS project ID — required by expo-notifications to mint push tokens. */
function getProjectId(): string {
  return (
    Constants.easConfig?.projectId ??
    'c54bf538-c087-47a3-a011-28d949d86587'
  );
}

export function initializeNotifications(): void {
  if (notificationsInitialized) return;
  notificationsInitialized = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  console.log('[Notifications] Initialized — Expo Push, projectId:', getProjectId());
}

export async function registerPushToken(userId?: string): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const currentPermissions = await Notifications.getPermissionsAsync();
    let finalStatus = currentPermissions.status;

    if (finalStatus !== 'granted') {
      const requestedPermissions = await Notifications.requestPermissionsAsync();
      finalStatus = requestedPermissions.status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: getProjectId(),
    });
    const pushToken = tokenResponse.data?.trim() ?? '';

    if (!pushToken) {
      console.log('[Notifications] Empty Expo push token received');
      return null;
    }

    console.log('[Notifications] Expo push token acquired:', pushToken);

    if (userId) {
      const { error } = await supabase.from('push_tokens').upsert({
        user_id: userId,
        token: pushToken,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'token' });

      if (error) {
        console.log('[Notifications] Failed to save push token:', error.message);
      } else {
        console.log('[Notifications] Push token saved to Supabase');
      }
    }

    return pushToken;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('[Notifications] Registration error:', message);
    return null;
  }
}
