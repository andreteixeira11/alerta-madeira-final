import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import { Session } from '@supabase/supabase-js';
import { translateError } from '@/utils/translateError';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then((result: any) => {
      const s = result?.data?.session;
      const error = result?.error;
      if (error) {
        console.log('[Auth] Session error:', error.message);
        if (
          error.message?.includes('Refresh Token') ||
          error.message?.includes('refresh_token') ||
          error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('token is expired') ||
          error.message?.includes('invalid_grant')
        ) {
          console.log('[Auth] Invalid refresh token, clearing session');
          supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          setSession(null);
        }
      } else {
        console.log('[Auth] Initial session:', s?.user?.id ?? 'none');
        setSession(s);
      }
      setInitializing(false);
    }).catch((err: any) => {
      console.log('[Auth] getSession exception:', err?.message);
      supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      setSession(null);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, s: any) => {
      console.log('[Auth] State changed:', _event, s?.user?.id ?? 'none');
      if (_event === 'TOKEN_REFRESHED' && !s) {
        console.log('[Auth] Token refresh failed, signing out');
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        setSession(null);
        return;
      }
      if (_event === 'SIGNED_OUT') {
        setSession(null);
        queryClient.clear();
        return;
      }
      setSession(s);
      if (s) {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const profileQuery = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error) {
        console.log('[Auth] Profile fetch error:', error.message);
        return null;
      }
      return data as UserProfile;
    },
    enabled: !!session?.user?.id,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(translateError(error));
      return data;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, username }: { email: string; password: string; username: string }) => {
      console.log('[Auth] Starting registration for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      if (error) {
        console.log('[Auth] SignUp error:', error.message);
        throw new Error(translateError(error));
      }

      console.log('[Auth] SignUp result - user:', data?.user?.id, 'session:', !!data?.session);

      const userId = data?.user?.id;
      if (userId) {
        const { error: upsertError } = await supabase.from('users').upsert({
          id: userId,
          email,
          name: username,
          role: 'user',
        }, { onConflict: 'id' });
        if (upsertError) {
          console.log('[Auth] User upsert error:', upsertError.message);
        }
      }

      if (data?.session) {
        console.log('[Auth] Session received from signUp, user is logged in');
        return data;
      }

      console.log('[Auth] No session after signUp, attempting signIn...');
      await new Promise(resolve => setTimeout(resolve, 500));
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) {
        console.log('[Auth] Auto-login after register failed:', loginError.message);
        throw new Error('Conta criada com sucesso! Por favor, faça login com as suas credenciais.');
      }
      console.log('[Auth] Auto-login after register succeeded');
      return loginData;
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw new Error(translateError(error));
    },
  });

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  }, [queryClient]);

  return {
    session,
    user: session?.user ?? null,
    profile: profileQuery.data ?? null,
    isAdmin: profileQuery.data?.role === 'admin',
    initializing,
    isLoggedIn: !!session?.user,
    loginMutation,
    registerMutation,
    resetPasswordMutation,
    logout,
    refetchProfile: profileQuery.refetch,
  };
});
