import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { trpc, trpcClient } from '@/lib/trpc';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';
import { t } from '@/utils/i18n';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerPushToken(userId?: string) {
  if (Platform.OS === 'web') return;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted');
      return;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '5d7588ad-f2e0-4179-b74b-30f2fcb4d42f',
    });
    console.log('[Push] Token:', tokenData.data);
    if (userId && tokenData.data) {
      await supabase.from('push_tokens').upsert({
        user_id: userId,
        token: tokenData.data,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'token' });
      console.log('[Push] Token saved to Supabase');
    }
  } catch (e: any) {
    console.log('[Push] Registration error:', e.message);
  }
}

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAdmin, initializing, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pushRegistered = useRef(false);

  useEffect(() => {
    if (initializing) return;

    const seg = segments[0] as string;
    const inAuthGroup = seg === 'login' || seg === 'register' || seg === 'forgot-password' || seg === 'verify-email' || seg === 'reset-password';
    const inAdminGroup = seg === 'admin-login' || seg === 'admin';
    const inPublicGroup = seg === 'privacy-policy' || seg === 'contacts';

    if (!isLoggedIn && !inAuthGroup && !inAdminGroup && !inPublicGroup) {
      router.replace('/login' as any);
    } else if (isLoggedIn && inAuthGroup) {
      if (isAdmin) {
        router.replace('/admin' as any);
      } else {
        router.replace('/');
      }
    } else if (isLoggedIn && isAdmin && seg === '(tabs)') {
      router.replace('/admin' as any);
    }
  }, [isLoggedIn, isAdmin, initializing, segments, router]);

  useEffect(() => {
    if (isLoggedIn && user?.id && !pushRegistered.current) {
      pushRegistered.current = true;
      void registerPushToken(user.id);
    }
    if (!isLoggedIn) {
      pushRegistered.current = false;
    }
  }, [isLoggedIn, user?.id]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: t('nav.back'),
        headerStyle: { backgroundColor: Colors.white },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="create-post" options={{ title: t('tabs.incidents') }} />
      <Stack.Screen name="edit-post" options={{ title: t('tabs.incidents') }} />
      <Stack.Screen name="post-detail" options={{ title: t('tabs.incidents') }} />
      <Stack.Screen name="verify-email" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="admin-login" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="contacts" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <AuthGate>
              <RootLayoutNav />
            </AuthGate>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
