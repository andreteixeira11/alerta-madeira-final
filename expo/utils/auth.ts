import { translateError } from '@/utils/translateError';
import { checkSupabaseConnection, supabase } from '@/lib/supabase';
import { t } from '@/utils/i18n';
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
