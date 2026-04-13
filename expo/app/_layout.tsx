import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { trpc, trpcClient } from '@/lib/trpc';
import Colors from '@/constants/colors';
import { initializeNotifications, registerPushToken } from '@/lib/notifications';
import { t } from '@/utils/i18n';

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
    initializeNotifications();
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
