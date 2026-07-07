import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { trpc, trpcClient } from '@/lib/trpc';
import Colors from '@/constants/colors';
import { initializeNotifications, loginOneSignalUser, logoutOneSignalUser } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
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
    } else if (isLoggedIn && inAuthGroup && seg !== 'reset-password') {
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
      loginOneSignalUser(user.id);
    }
    if (!isLoggedIn && pushRegistered.current) {
      pushRegistered.current = false;
      logoutOneSignalUser();
    }
  }, [isLoggedIn, user?.id]);

  return <>{children}</>;
}

function RootLayoutNav() {
  const router = useRouter();

  // Listen for deep links when the app is already open (fallback: Supabase magic link)
  useEffect(() => {
    const sub = Linking.addEventListener('url', async (event: { url: string }) => {
      console.log('[DeepLink] Received URL while app is open:', event.url);
      if (event.url?.includes('reset-password') || event.url?.includes('type=recovery')) {
        // Supabase magic link: extract fragment, establish session, then navigate.
        try {
          const fragment = event.url.includes('#') ? event.url.split('#')[1] : null;
          if (fragment) {
            const params = new URLSearchParams(fragment);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken && refreshToken) {
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (!error) {
                router.replace({ pathname: '/reset-password', params: { verified: 'true' } } as any);
                return;
              }
            }
          }
        } catch (e) {
          console.log('[DeepLink] Failed to process recovery link:', e);
        }
        // If processing failed, still navigate so the user sees an error.
        router.replace({ pathname: '/reset-password', params: {} } as any);
      }
    });

    return () => sub.remove();
  }, [router]);

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
