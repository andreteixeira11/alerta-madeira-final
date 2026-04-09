import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

type SupabaseConfigDiagnostics = {
  url: string;
  keyPrefix: string;
  isUrlValid: boolean;
  isKeyPresent: boolean;
  isKeyJwtLike: boolean;
  jwtRole: string | null;
};

function decodeBase64UrlSegment(segment: string): string | null {
  try {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const bytes: number[] = [];

    for (let index = 0; index < padded.length; index += 4) {
      const chunk = padded.slice(index, index + 4);
      const values = chunk.split('').map((char) => (char === '=' ? 64 : alphabet.indexOf(char)));

      if (values.some((value) => value < 0)) {
        return null;
      }

      const combined = (values[0] << 18) | (values[1] << 12) | ((values[2] & 63) << 6) | (values[3] & 63);
      bytes.push((combined >> 16) & 255);

      if (chunk[2] !== '=') {
        bytes.push((combined >> 8) & 255);
      }

      if (chunk[3] !== '=') {
        bytes.push(combined & 255);
      }
    }

    return String.fromCharCode(...bytes);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('[Supabase] Failed to decode JWT segment:', message);
    return null;
  }
}

function getJwtRole(token: string): string | null {
  const tokenParts = token.split('.');

  if (tokenParts.length !== 3) {
    return null;
  }

  const payload = decodeBase64UrlSegment(tokenParts[1]);

  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(payload) as { role?: unknown };
    return typeof parsed.role === 'string' ? parsed.role : null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('[Supabase] Failed to parse anon key payload:', message);
    return null;
  }
}

function maskKey(value: string): string {
  if (!value) {
    return 'missing';
  }

  if (value.length <= 10) {
    return `${value.slice(0, 3)}***`;
  }

  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function getValidatedSupabaseConfig(): { url: string; anonKey: string; diagnostics: SupabaseConfigDiagnostics } {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  const jwtRole = getJwtRole(anonKey);
  const isUrlValid = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
  const isKeyJwtLike = anonKey.split('.').length === 3;

  const diagnostics: SupabaseConfigDiagnostics = {
    url,
    keyPrefix: maskKey(anonKey),
    isUrlValid,
    isKeyPresent: anonKey.length > 0,
    isKeyJwtLike,
    jwtRole,
  };

  console.log('[Supabase] Runtime config diagnostics:', diagnostics);

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public environment variables.');
  }

  if (!isUrlValid) {
    throw new Error('Invalid Supabase project URL.');
  }

  if (anonKey.startsWith('sb_temp_')) {
    throw new Error('Temporary Supabase keys are not supported in production.');
  }

  if (!isKeyJwtLike) {
    throw new Error('Invalid Supabase anon public key format.');
  }

  if (jwtRole === 'service_role') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must never be used on the client.');
  }

  if (jwtRole !== null && jwtRole !== 'anon') {
    throw new Error(`Unexpected Supabase client key role: ${jwtRole}`);
  }

  return { url, anonKey, diagnostics };
}

const validatedSupabaseConfig = getValidatedSupabaseConfig();

export const supabaseUrl = validatedSupabaseConfig.url;
export const supabaseAnonKey = validatedSupabaseConfig.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function checkSupabaseConnection(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 6000);

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      signal: controller.signal,
    });

    console.log('[Supabase] Connection check status:', response.status);
    return response.ok;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('[Supabase] Connection check failed:', message);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function getSupabaseConfigDiagnostics(): SupabaseConfigDiagnostics {
  return validatedSupabaseConfig.diagnostics;
}
