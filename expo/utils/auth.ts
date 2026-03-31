import { translateError } from '@/utils/translateError';
import { checkSupabaseConnection, supabase } from '@/lib/supabase';

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

  const firstAttempt = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (!firstAttempt.error) {
    console.log('[Auth] Login attempt succeeded on first try');
    return firstAttempt.data;
  }

  console.log('[Auth] Login first attempt failed:', firstAttempt.error.message);

  if (!isTransientAuthError(firstAttempt.error)) {
    throw new Error(translateError(firstAttempt.error));
  }

  const connectionOk = await checkSupabaseConnection();
  console.log('[Auth] Connection check before retry:', connectionOk ? 'reachable' : 'unreachable');

  await wait(connectionOk ? 900 : 1600);

  const secondAttempt = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (!secondAttempt.error) {
    console.log('[Auth] Login attempt succeeded on retry');
    return secondAttempt.data;
  }

  console.log('[Auth] Login retry failed:', secondAttempt.error.message);

  if (isTransientAuthError(secondAttempt.error)) {
    const secondConnectionOk = await checkSupabaseConnection();
    console.log('[Auth] Connection check after retry:', secondConnectionOk ? 'reachable' : 'unreachable');

    if (!secondConnectionOk) {
      throw new Error('Sem ligação ao servidor. Verifique a internet e tente novamente.');
    }

    throw new Error('Não foi possível concluir o login agora. Tente novamente dentro de instantes.');
  }

  throw new Error(translateError(secondAttempt.error));
}
