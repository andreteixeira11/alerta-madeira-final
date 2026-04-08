import { translateError } from '@/utils/translateError';
import { checkSupabaseConnection, supabase } from '@/lib/supabase';
import { t } from '@/utils/i18n';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

const LOGIN_RETRY_DELAYS_MS = [900, 1600] as const;

const NETWORK_ERROR_SNIPPETS = [
  'network request failed',
  'failed to fetch',
  'fetch failed',
  'networkerror',
  'load failed',
  'connection error',
  'request timed out',
  'timeout',
] as const;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isTransientAuthError(error: unknown): boolean {
  const errorMessage = (error as { message?: unknown })?.message;
  const message = typeof error === 'string'
    ? error
    : typeof errorMessage === 'string'
      ? errorMessage
      : '';

  const normalizedMessage = message.toLowerCase();

  return NETWORK_ERROR_SNIPPETS.some((snippet) => normalizedMessage.includes(snippet));
}

async function clearStaleSessionIfNeeded(): Promise<void> {
  try {
    const sessionResult = await supabase.auth.getSession();
    const sessionErrorMessage = sessionResult.error?.message?.toLowerCase() ?? '';

    if (
      sessionErrorMessage.includes('refresh token') ||
      sessionErrorMessage.includes('refresh_token') ||
      sessionErrorMessage.includes('invalid_grant') ||
      sessionErrorMessage.includes('token is expired')
    ) {
      console.log('[Auth] Clearing stale local session before login');
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('[Auth] getSession failed before login, clearing local session:', message);
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  }
}

function buildAppleDisplayName(credential: AppleAuthentication.AppleAuthenticationCredential): string | null {
  const nameParts = [
    credential.fullName?.givenName,
    credential.fullName?.middleName,
    credential.fullName?.familyName,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  if (nameParts.length > 0) {
    return nameParts.join(' ');
  }

  return null;
}

async function syncAppleUserProfile(params: {
  userId: string;
  email: string | null;
  name: string | null;
}): Promise<void> {
  const { userId, email, name } = params;

  const safeEmail = email ?? '';
  const safeName = name ?? safeEmail.split('@')[0] ?? t('common.user');

  const { error } = await supabase.from('users').upsert({
    id: userId,
    email: safeEmail,
    name: safeName,
    role: 'user',
  }, { onConflict: 'id' });

  if (error) {
    console.log('[Auth] Apple user profile upsert error:', error.message);
  }
}

export async function signInWithAppleNative() {
  if (Platform.OS !== 'ios') {
    throw new Error(t('auth.appleOnlyOnIOS'));
  }

  const isAvailable = await AppleAuthentication.isAvailableAsync();
  console.log('[Auth] Apple sign in availability:', isAvailable);

  if (!isAvailable) {
    throw new Error(t('auth.appleUnavailable'));
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('[Auth] Apple credential received for user:', credential.user);

    if (!credential.identityToken) {
      throw new Error(t('auth.appleMissingToken'));
    }

    const result = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (result.error) {
      console.log('[Auth] Supabase Apple sign in error:', result.error.message);
      throw result.error;
    }

    const userId = result.data.user?.id;
    const email = credential.email ?? result.data.user?.email ?? null;
    const name = buildAppleDisplayName(credential)
      ?? ((result.data.user?.user_metadata?.full_name as string | undefined) ?? null)
      ?? ((result.data.user?.user_metadata?.name as string | undefined) ?? null);

    if (userId) {
      await syncAppleUserProfile({ userId, email, name });
    }

    if (name && userId) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          name,
        },
      });

      if (updateError) {
        console.log('[Auth] Apple auth metadata update error:', updateError.message);
      }
    }

    return result.data;
  } catch (error: unknown) {
    const errorCode = (error as { code?: unknown })?.code;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log('[Auth] Apple sign in failed:', errorCode, errorMessage);

    if (errorCode === 'ERR_REQUEST_CANCELED') {
      throw new Error(t('auth.appleCanceled'));
    }

    throw new Error(translateError(error));
  }
}

export async function signInWithRetry(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  console.log('[Auth] Login attempt started for:', normalizedEmail);
  await clearStaleSessionIfNeeded();

  for (let attemptIndex = 0; attemptIndex <= LOGIN_RETRY_DELAYS_MS.length; attemptIndex += 1) {
    const attemptNumber = attemptIndex + 1;
    console.log(`[Auth] signInWithPassword attempt ${attemptNumber} started`);

    const result = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (!result.error) {
      console.log(`[Auth] Login attempt ${attemptNumber} succeeded`);
      return result.data;
    }

    console.log(`[Auth] Login attempt ${attemptNumber} failed:`, result.error.message);

    if (!isTransientAuthError(result.error)) {
      throw new Error(translateError(result.error));
    }

    if (attemptIndex < LOGIN_RETRY_DELAYS_MS.length) {
      const delayMs = LOGIN_RETRY_DELAYS_MS[attemptIndex];
      console.log(`[Auth] Retrying sign in after ${delayMs}ms due to transient auth error`);
      await wait(delayMs);
      continue;
    }

    const serviceReachable = await checkSupabaseConnection();
    console.log('[Auth] Supabase reachability after transient auth errors:', serviceReachable);

    throw new Error(serviceReachable ? t('auth.loginTemporarilyUnavailable') : t('auth.loginConnectionIssue'));
  }

  throw new Error(t('auth.loginTemporarilyUnavailable'));
}
