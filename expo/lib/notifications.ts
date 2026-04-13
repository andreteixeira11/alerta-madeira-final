import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

type NotificationExtraConfig = {
  oneSignalAppId?: string;
  expoPublicOneSignalAppId?: string;
  EXPO_PUBLIC_ONESIGNAL_APP_ID?: string;
};

type NotificationDiagnostics = {
  isWeb: boolean;
  oneSignalAppIdPresent: boolean;
  oneSignalAppId: string;
  expoProjectId: string;
};

let notificationsInitialized = false;

function getNotificationExtraConfig(): NotificationExtraConfig {
  const constantsWithManifest = Constants as typeof Constants & {
    manifest?: { extra?: NotificationExtraConfig } | null;
    manifest2?: { extra?: NotificationExtraConfig } | null;
  };

  return constantsWithManifest.expoConfig?.extra
    ?? constantsWithManifest.manifest2?.extra
    ?? constantsWithManifest.manifest?.extra
    ?? {};
}

function getNotificationDiagnostics(): NotificationDiagnostics {
  const extra = getNotificationExtraConfig();
  const oneSignalAppId = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID?.trim()
    ?? extra.oneSignalAppId?.trim()
    ?? extra.expoPublicOneSignalAppId?.trim()
    ?? extra.EXPO_PUBLIC_ONESIGNAL_APP_ID?.trim()
    ?? '';
  const expoProjectId = Constants.easConfig?.projectId ?? '5d7588ad-f2e0-4179-b74b-30f2fcb4d42f';

  return {
    isWeb: Platform.OS === 'web',
    oneSignalAppIdPresent: oneSignalAppId.length > 0,
    oneSignalAppId,
    expoProjectId,
  };
}

export function initializeNotifications(): void {
  if (notificationsInitialized) {
    return;
  }

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

  const diagnostics = getNotificationDiagnostics();
  console.log('[Notifications] Runtime diagnostics:', {
    isWeb: diagnostics.isWeb,
    oneSignalAppIdPresent: diagnostics.oneSignalAppIdPresent,
    oneSignalAppIdPrefix: diagnostics.oneSignalAppId ? `${diagnostics.oneSignalAppId.slice(0, 8)}...` : 'missing',
    expoProjectId: diagnostics.expoProjectId,
  });
}

export async function registerPushToken(userId?: string): Promise<string | null> {
  const diagnostics = getNotificationDiagnostics();

  if (diagnostics.isWeb) {
    console.log('[Notifications] Web runtime detected, skipping native push registration');
    return null;
  }

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
      projectId: diagnostics.expoProjectId,
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
