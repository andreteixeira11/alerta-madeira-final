import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Post, PostWithCounts, Category, Comment, Ad, UserProfile, REACTION_MAP, FuelPrice, JuntaFreguesia } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpcClient } from '@/lib/trpc';

const FUEL_STORAGE_KEY = 'fuel_prices_data';



export function usePosts(category?: Category) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['posts', category],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) {
        console.log('[Posts] Fetch error:', error.message);
        throw error;
      }

      const posts = data as Post[];

      return posts.map(p => {
        const allReactions = [
          ...(p.reactions_thumbs_up ?? []),
          ...(p.reactions_heart ?? []),
          ...(p.reactions_alert ?? []),
        ];
        const userReactions: string[] = [];
        if (user?.id) {
          if ((p.reactions_thumbs_up ?? []).includes(user.id)) userReactions.push('👍');
          if ((p.reactions_heart ?? []).includes(user.id)) userReactions.push('❤️');
          if ((p.reactions_alert ?? []).includes(user.id)) userReactions.push('👎');
        }
        return {
          ...p,
          total_reactions: allReactions.length,
          user_reactions: userReactions,
        } as PostWithCounts;
      });
    },
    refetchInterval: 120000,
    staleTime: 60000,
  });
}

export function useUserPosts(userId?: string) {
  return useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
    enabled: !!userId,
  });
}

export function usePostDetail(postId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      if (error) throw error;

      const p = data as Post;
      const allReactions = [
        ...(p.reactions_thumbs_up ?? []),
        ...(p.reactions_heart ?? []),
        ...(p.reactions_alert ?? []),
      ];
      const userReactions: string[] = [];
      if (user?.id) {
        if ((p.reactions_thumbs_up ?? []).includes(user.id)) userReactions.push('👍');
        if ((p.reactions_heart ?? []).includes(user.id)) userReactions.push('❤️');
        if ((p.reactions_alert ?? []).includes(user.id)) userReactions.push('👎');
      }

      return {
        ...p,
        total_reactions: allReactions.length,
        user_reactions: userReactions,
      } as PostWithCounts;
    },
    enabled: !!postId,
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (post: {
      title: string;
      description: string;
      image_url: string;
      video_url: string | null;
      category: Category;
      latitude: number | null;
      longitude: number | null;
      location: string;
    }) => {
      if (!user) throw new Error('Não autenticado');

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email ?? '',
          name: profile?.name ?? user.user_metadata?.username ?? 'Utilizador',
          role: 'user',
        });
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          ...post,
          user_id: user.id,
          user_name: profile?.name ?? 'Utilizador',
          user_avatar: profile?.avatar ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      title?: string;
      description?: string;
      image_url?: string;
      video_url?: string | null;
      category?: Category;
      location?: string;
    }) => {
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', data.id] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      console.log('[DeletePost] Deleting comments for post:', postId);
      const { error: commentsError } = await supabase.from('comments').delete().eq('post_id', postId);
      if (commentsError) {
        console.log('[DeletePost] Comments delete error:', commentsError.message);
      }
      
      console.log('[DeletePost] Deleting post:', postId);
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) {
        console.log('[DeletePost] Post delete error:', error.message);
        throw error;
      }
      console.log('[DeletePost] Post deleted successfully:', postId);
      return postId;
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['all-posts'] });

      queryClient.setQueriesData({ queryKey: ['posts'] }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.filter((p: any) => p.id !== postId);
      });

      queryClient.setQueriesData({ queryKey: ['all-posts'] }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.filter((p: any) => p.id !== postId);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['all-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['all-posts'] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, text }: { postId: string; text: string }) => {
      if (!user) throw new Error('Não autenticado');

      console.log('[Comments] Ensuring user exists in users table:', user.id);
      const { error: upsertError } = await supabase.from('users').upsert({
        id: user.id,
        email: user.email ?? '',
        name: profile?.name ?? user.user_metadata?.username ?? 'Utilizador',
        role: 'user',
      }, { onConflict: 'id' });

      if (upsertError) {
        console.log('[Comments] User upsert error:', upsertError.message);
      }

      console.log('[Comments] Inserting comment for post:', postId);
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          user_name: profile?.name ?? user.user_metadata?.username ?? 'Utilizador',
          user_avatar: profile?.avatar ?? null,
          text,
        })
        .select()
        .single();

      if (error) {
        console.log('[Comments] Insert error:', error.message, error.details, error.hint);
        if (error.message.includes('foreign key')) {
          console.log('[Comments] FK error - trying without user_id');
          const { data: data2, error: error2 } = await supabase
            .from('comments')
            .insert({
              post_id: postId,
              user_id: null,
              user_name: profile?.name ?? user.user_metadata?.username ?? 'Utilizador',
              user_avatar: profile?.avatar ?? null,
              text,
            })
            .select()
            .single();
          if (error2) {
            console.log('[Comments] Fallback insert also failed:', error2.message);
            throw error2;
          }
          return data2;
        }
        throw error;
      }

      try {
        const { data: postData } = await supabase
          .from('posts')
          .select('comments_count')
          .eq('id', postId)
          .single();
        if (postData) {
          await supabase
            .from('posts')
            .update({ comments_count: (postData.comments_count ?? 0) + 1 })
            .eq('id', postId);
        }
      } catch (e) {
        console.log('[Comments] Failed to increment count:', e);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, type }: { postId: string; type: string }) => {
      if (!user) throw new Error('Não autenticado');

      const column = REACTION_MAP[type];
      if (!column) throw new Error('Tipo de reação inválido');

      const allColumns = Object.values(REACTION_MAP);
      const selectCols = [...new Set(allColumns)].join(',');

      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select(selectCols)
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      const currentArray: string[] = (post as any)?.[column] ?? [];
      const hasReacted = currentArray.includes(user.id);

      const updates: Record<string, string[]> = {};

      if (hasReacted) {
        updates[column] = currentArray.filter(id => id !== user.id);
      } else {
        for (const [rType, rCol] of Object.entries(REACTION_MAP)) {
          const arr: string[] = (post as any)?.[rCol] ?? [];
          if (rCol !== column && arr.includes(user.id)) {
            updates[rCol] = arr.filter(id => id !== user.id);
          }
        }
        updates[column] = [...currentArray, user.id];
      }

      const { error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId);

      if (error) throw error;
      
      return { postId, column, newArray: updates[column], type };
    },
    onMutate: async ({ postId, type }) => {
      if (!user) return;
      
      await queryClient.cancelQueries({ queryKey: ['posts'] });
      await queryClient.cancelQueries({ queryKey: ['post', postId] });
      
      const column = REACTION_MAP[type];
      if (!column) return;

      const updatePost = (old: any) => {
        if (!old) return old;
        const currentArray: string[] = old[column] ?? [];
        const hasReacted = currentArray.includes(user.id);
        
        const updated = { ...old };

        if (hasReacted) {
          updated[column] = currentArray.filter((id: string) => id !== user.id);
          updated.user_reactions = (old.user_reactions ?? []).filter((r: string) => r !== type);
        } else {
          for (const [rType, rCol] of Object.entries(REACTION_MAP)) {
            const arr: string[] = old[rCol] ?? [];
            if (rCol !== column && arr.includes(user.id)) {
              updated[rCol] = arr.filter((id: string) => id !== user.id);
            }
          }
          updated[column] = [...currentArray, user.id];
          updated.user_reactions = [type];
        }
        
        return updated;
      };

      queryClient.setQueriesData({ queryKey: ['posts'] }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.map((p: any) => p.id === postId ? updatePost(p) : p);
      });

      queryClient.setQueryData(['post', postId], (old: any) => updatePost(old));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
  });
}

export function useAds() {
  return useQuery({
    queryKey: ['ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (error) {
        console.log('[Ads] Fetch error:', error.message);
        return [];
      }
      const now = new Date().toISOString();
      return (data as Ad[]).filter(ad => {
        if (ad.start_date && ad.start_date > now) return false;
        if (ad.end_date && ad.end_date < now) return false;
        return true;
      });
    },
    refetchInterval: 120000,
    staleTime: 60000,
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as UserProfile[];
    },
  });
}

export function useUserPostCounts() {
  return useQuery({
    queryKey: ['user-post-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('user_id');
      if (error) {
        console.log('[UserPostCounts] Fetch error:', error.message);
        return {} as Record<string, number>;
      }
      const counts: Record<string, number> = {};
      (data ?? []).forEach((p: { user_id: string }) => {
        counts[p.user_id] = (counts[p.user_id] ?? 0) + 1;
      });
      return counts;
    },
  });
}

export function useAllPosts() {
  return useQuery({
    queryKey: ['all-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      console.log('[DeleteUser] Starting deletion for:', userId);
      const { error: commentsErr } = await supabase.from('comments').delete().eq('user_id', userId);
      if (commentsErr) console.log('[DeleteUser] Comments delete error:', commentsErr.message);
      const { error: postsErr } = await supabase.from('posts').delete().eq('user_id', userId);
      if (postsErr) console.log('[DeleteUser] Posts delete error:', postsErr.message);
      const { error: tokensErr } = await supabase.from('push_tokens').delete().eq('user_id', userId);
      if (tokensErr) console.log('[DeleteUser] Tokens delete error:', tokensErr.message);
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) {
        console.log('[DeleteUser] User delete error:', error.message);
        throw new Error(
          'Não foi possível apagar o utilizador. Adicione esta política RLS no Supabase:\n\n' +
          'CREATE POLICY "Admins can delete users" ON users FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = \'admin\'));'
        );
      }
      console.log('[DeleteUser] User deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      queryClient.invalidateQueries({ queryKey: ['all-posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useCreateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ad: { image_url: string; link_url: string | null; title: string | null; position?: 'top' | 'rotative'; start_date?: string | null; end_date?: string | null }) => {
      const { data, error } = await supabase
        .from('advertisements')
        .insert({ ...ad, position: ad.position ?? 'rotative', active: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['all-ads'] });
    },
  });
}

export function useUpdateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; image_url?: string; link_url?: string | null; title?: string | null; position?: 'top' | 'rotative'; start_date?: string | null; end_date?: string | null; active?: boolean }) => {
      const { data, error } = await supabase
        .from('advertisements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['all-ads'] });
    },
  });
}

export function useAllAds() {
  return useQuery({
    queryKey: ['all-ads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Ad[];
    },
  });
}

export function useToggleAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('advertisements')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['all-ads'] });
    },
  });
}

export function useDeleteAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (adId: string) => {
      const { error } = await supabase.from('advertisements').delete().eq('id', adId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      queryClient.invalidateQueries({ queryKey: ['all-ads'] });
    },
  });
}

export function useProfileStats(userId?: string) {
  return useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: async () => {
      if (!userId) return { postsCount: 0, reactionsReceived: 0, commentsReceived: 0 };

      const { data: posts } = await supabase
        .from('posts')
        .select('id, reactions_thumbs_up, reactions_heart, reactions_alert, comments_count')
        .eq('user_id', userId);

      if (!posts || posts.length === 0) return { postsCount: 0, reactionsReceived: 0, commentsReceived: 0 };

      let reactionsReceived = 0;
      let commentsReceived = 0;
      posts.forEach(p => {
        reactionsReceived +=
          (p.reactions_thumbs_up?.length ?? 0) +
          (p.reactions_heart?.length ?? 0) +
          (p.reactions_alert?.length ?? 0);
        commentsReceived += p.comments_count ?? 0;
      });

      return {
        postsCount: posts.length,
        reactionsReceived,
        commentsReceived,
      };
    },
    enabled: !!userId,
  });
}

export function useAdminNotifications() {
  return useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as import('@/types').AdminNotification[];
    },
  });
}

export function useFuelPrices() {
  return useQuery({
    queryKey: ['fuel-prices'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('fuel_prices')
          .select('*')
          .order('id');
        if (!error && data && data.length > 0) {
          console.log('[FuelPrices] Loaded from Supabase:', data.length);
          await AsyncStorage.setItem(FUEL_STORAGE_KEY, JSON.stringify(data));
          return data as FuelPrice[];
        }
        if (error) {
          console.log('[FuelPrices] Supabase read error:', error.message);
        }
      } catch (e: any) {
        console.log('[FuelPrices] Supabase exception:', e.message);
      }
      try {
        const stored = await AsyncStorage.getItem(FUEL_STORAGE_KEY);
        if (stored) {
          console.log('[FuelPrices] Loaded from AsyncStorage fallback');
          return JSON.parse(stored) as FuelPrice[];
        }
      } catch (e) {
        console.log('[FuelPrices] AsyncStorage read error:', e);
      }
      return [] as FuelPrice[];
    },
    refetchInterval: 120000,
    staleTime: 60000,
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notifId: string) => {
      const { error } = await supabase.from('admin_notifications').delete().eq('id', notifId);
      if (error) throw error;
      return notifId;
    },
    onMutate: async (notifId: string) => {
      await queryClient.cancelQueries({ queryKey: ['admin-notifications'] });
      queryClient.setQueryData(['admin-notifications'], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.filter((n: any) => n.id !== notifId);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });
}

export function useSaveFuelPrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fuels: FuelPrice[]) => {
      let currentPrices: FuelPrice[] = [];
      try {
        const { data } = await supabase.from('fuel_prices').select('*').order('id');
        if (data) currentPrices = data as FuelPrice[];
      } catch (e) {
        console.log('[FuelPrices] Failed to fetch current prices for comparison');
      }

      const updated = fuels.map(f => {
        const current = currentPrices.find(c => c.id === f.id);
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (current) {
          const oldPrice = parseFloat(current.price);
          const newPrice = parseFloat(f.price);
          if (!isNaN(oldPrice) && !isNaN(newPrice)) {
            if (newPrice > oldPrice) trend = 'up';
            else if (newPrice < oldPrice) trend = 'down';
          }
        }
        return { ...f, trend, updated_at: new Date().toISOString() };
      });
      let supabaseSaved = false;
      try {
        for (const fuel of updated) {
          const { error } = await supabase
            .from('fuel_prices')
            .upsert({
              id: fuel.id,
              fuel_type: fuel.fuel_type,
              price: fuel.price,
              trend: fuel.trend,
              updated_at: fuel.updated_at,
            }, { onConflict: 'id' });
          if (error) {
            console.log('[FuelPrices] Supabase upsert error:', error.message);
            break;
          }
        }
        supabaseSaved = true;
        console.log('[FuelPrices] Saved to Supabase');
      } catch (e: any) {
        console.log('[FuelPrices] Supabase save exception:', e.message);
      }
      await AsyncStorage.setItem(FUEL_STORAGE_KEY, JSON.stringify(updated));
      console.log('[FuelPrices] Saved to AsyncStorage', supabaseSaved ? '(+ Supabase)' : '(Supabase failed)');
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
    },
  });
}

export function useSendPushNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, body, sentBy, linkUrl }: { title: string; body: string; sentBy: string; linkUrl?: string }) => {
      let recipientsCount = 0;

      try {
        console.log('[Push] Sending via OneSignal...');
        const onesignalResult = await trpcClient.onesignal.sendNotification.mutate({
          title,
          body,
          url: linkUrl || undefined,
        });
        recipientsCount = onesignalResult.recipients ?? 0;
        console.log('[Push] OneSignal sent to', recipientsCount, 'recipients');
      } catch (onesignalErr: any) {
        console.log('[Push] OneSignal error:', onesignalErr.message);
        console.log('[Push] Falling back to Expo push...');
        try {
          const { data: tokens } = await supabase
            .from('push_tokens')
            .select('token');
          recipientsCount = tokens?.length ?? 0;
          if (tokens && tokens.length > 0) {
            const messages = tokens.map(t => ({
              to: t.token,
              sound: 'default' as const,
              title,
              body,
              data: { type: 'admin_notification', url: linkUrl || null },
            }));
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(messages),
            });
            const result = await response.json();
            console.log('[Push] Expo fallback result:', JSON.stringify(result));
          }
        } catch (expoErr: any) {
          console.log('[Push] Expo fallback error:', expoErr.message);
        }
      }

      const { error } = await supabase
        .from('admin_notifications')
        .insert({
          title,
          body,
          link_url: linkUrl || null,
          sent_by: sentBy,
          recipients_count: recipientsCount,
        });

      if (error) {
        console.log('[Push] Log notification error:', error.message);
      }

      return { sent: recipientsCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });
}

export function useAdminComments(postId: string) {
  return useQuery({
    queryKey: ['admin-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!postId,
  });
}

export function useTrackAdClick() {
  return useMutation({
    mutationFn: async (adId: string) => {
      try {
        const { data } = await supabase
          .from('advertisements')
          .select('clicks_count')
          .eq('id', adId)
          .single();
        const current = data?.clicks_count ?? 0;
        await supabase
          .from('advertisements')
          .update({ clicks_count: current + 1 })
          .eq('id', adId);
        console.log('[AdTrack] Click tracked for ad:', adId);
      } catch (e: any) {
        console.log('[AdTrack] Click track error:', e.message);
      }
    },
  });
}

export function useTrackAdImpression() {
  return useMutation({
    mutationFn: async (adId: string) => {
      try {
        const { data } = await supabase
          .from('advertisements')
          .select('impressions_count')
          .eq('id', adId)
          .single();
        const current = data?.impressions_count ?? 0;
        await supabase
          .from('advertisements')
          .update({ impressions_count: current + 1 })
          .eq('id', adId);
      } catch (e: any) {
        console.log('[AdTrack] Impression track error:', e.message);
      }
    },
  });
}

export function useJuntas() {
  return useQuery({
    queryKey: ['juntas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('juntas')
        .select('*')
        .order('concelho', { ascending: true });
      if (error) {
        console.log('[Juntas] Fetch error:', error.message);
        return [] as JuntaFreguesia[];
      }
      return (data ?? []).map((j: any) => ({
        ...j,
        emails: Array.isArray(j.emails) ? j.emails : (j.emails ? [j.emails] : []),
      })) as JuntaFreguesia[];
    },
    staleTime: 60000,
  });
}

export function useJuntaByFreguesia(freguesia: string | null) {
  const { data: juntas } = useJuntas();
  return juntas?.find(j => j.freguesia === freguesia) ?? null;
}

export function useCreateJunta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (junta: { freguesia: string; concelho: string; emails: string[] }) => {
      const { data, error } = await supabase
        .from('juntas')
        .insert({
          freguesia: junta.freguesia,
          concelho: junta.concelho,
          emails: junta.emails,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juntas'] });
    },
  });
}

export function useUpdateJunta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, emails }: { id: string; emails: string[] }) => {
      const { data, error } = await supabase
        .from('juntas')
        .update({ emails, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juntas'] });
    },
  });
}

export function useDeleteJunta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('juntas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juntas'] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;

      try {
        const { data: postData } = await supabase
          .from('posts')
          .select('comments_count')
          .eq('id', postId)
          .single();
        if (postData) {
          await supabase
            .from('posts')
            .update({ comments_count: Math.max(0, (postData.comments_count ?? 1) - 1) })
            .eq('id', postId);
        }
      } catch {
        console.log('[Comments] Failed to decrement count');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['all-posts'] });
    },
  });
}
