import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';

/**
 * Invoke a Supabase Edge Function with the current user's access token.
 * Returns parsed JSON or throws an Error with a user-friendly message.
 */
export async function invokeEdgeFunction<T = unknown>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Não autenticado.');
  }

  if (!SUPABASE_URL) {
    throw new Error('Supabase URL não configurado.');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    const msg = result?.error ?? `Erro ${response.status}`;
    console.log(`[EdgeFunction:${name}] Error:`, msg);
    throw new Error(msg);
  }

  return result as T;
}
