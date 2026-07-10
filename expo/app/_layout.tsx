import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
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
      void loginOneSignalUser(user.id);
    }
    if (!isLoggedIn && pushRegistered.current) {
      pushRegistered.current = false;
      void logoutOneSignalUser();
    }
  }, [isLoggedIn, user?.id]);

  return <>{children}</>;
}

/**
 * Process a Supabase recovery/verification deep link.
 * Handles both fragment-based (#access_token=...) and query-based (?code=...)
 * URL formats. Returns true if the link was handled.
 */
async function handleAuthDeepLink(url: string, router: ReturnType<typeof useRouter>): Promise<boolean> {
  if (!url) return false;

  console.log('[DeepLink] Processing URL:', url);

  const isRecovery = url.includes('reset-password') ||
    url.includes('type=recovery') ||
    url.includes('type=signup') ||
    url.includes('access_token');

  if (!isRecovery) return false;

  try {
    // Extract tokens from fragment (#access_token=...&refresh_token=...) or query (?...)
    const fragment = url.includes('#') ? url.split('#')[1] : null;
    const query = url.includes('?') ? url.split('?')[1] : null;
    const paramsStr = fragment || query;

    if (paramsStr) {
      const params = new URLSearchParams(paramsStr);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          console.log('[DeepLink] Session established, navigating to reset-password');
          router.replace({ pathname: '/reset-password', params: { verified: 'true' } } as any);
          return true;
        }
        console.log('[DeepLink] setSession error:', error.message);
      }

      // PKCE flow: Supabase may pass a code instead of tokens
      const code = params.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          console.log('[DeepLink] Code exchanged, navigating to reset-password');
          router.replace({ pathname: '/reset-password', params: { verified: 'true' } } as any);
          return true;
        }
        console.log('[DeepLink] exchangeCode error:', exchangeError.message);
      }
    }
  } catch (e) {
    console.log('[DeepLink] Failed to process auth link:', e);
  }

  // If we got here but it was a recovery link, still navigate so user sees error
  if (url.includes('reset-password') || url.includes('type=recovery')) {
    router.replace({ pathname: '/reset-password', params: {} } as any);
    return true;
  }

  return false;
}

function RootLayoutNav() {
  const router = useRouter();

  // Handle cold-start deep link (app opened by clicking the email link)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && mounted) {
          console.log('[DeepLink] Initial URL on cold start:', initialUrl);
          await handleAuthDeepLink(initialUrl, router);
        }
      } catch (e) {
        console.log('[DeepLink] Failed to get initial URL:', e);
      }
    })();

    return () => { mounted = false; };
  }, [router]);

  // Listen for deep links when the app is already open
  useEffect(() => {
    const sub = Linking.addEventListener('url', async (event: { url: string }) => {
      console.log('[DeepLink] Received URL while app is open:', event.url);
      await handleAuthDeepLink(event.url, router);
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
    void initializeNotifications();
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AuthGate>
            <RootLayoutNav />
          </AuthGate>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
