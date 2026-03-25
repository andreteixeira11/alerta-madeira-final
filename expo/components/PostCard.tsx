import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Animated, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MessageCircle, Share2, MapPin, Clock, Edit3, Trash2, Play } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { PostWithCounts, REACTION_TYPES, Category } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToggleReaction, useDeletePost } from '@/hooks/usePosts';
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';

const CATEGORY_LABELS: Record<string, string> = {
  ocorrencias: 'Ocorrência',
  opstop: 'Op. Stop',
  anomalias: 'Anomalia',
  perdidos: 'Perdidos e Achados',
};

const CATEGORY_COLORS: Record<string, string> = {
  ocorrencias: '#E74C3C',
  opstop: '#E67E22',
  anomalias: '#F1C40F',
  perdidos: '#3498DB',
};

const CATEGORY_BG: Record<string, string> = {
  ocorrencias: '#FDEDEC',
  opstop: '#FDF2E9',
  anomalias: '#FEF9E7',
  perdidos: '#EBF5FB',
};

function getVideoPlatform(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
  if (url.includes('vimeo.com')) return 'Vimeo';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'X';
  return 'Vídeo';
}

function getVideoThumbnail(url: string): string | null {
  if (url.includes('youtube.com/watch')) {
    const match = url.match(/v=([^&]+)/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  if (url.includes('youtu.be/')) {
    const match = url.match(/youtu\.be\/([^?]+)/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  if (url.includes('youtube.com/shorts/')) {
    const match = url.match(/shorts\/([^?]+)/);
    if (match) return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  if (url.includes('instagram.com')) {
    const match = url.match(/\/(p|reel|reels)\/([^/?]+)/);
    if (match) return `https://www.instagram.com/p/${match[2]}/media/?size=l`;
  }
  return null;
}

function getPlatformBrandColor(url: string): string {
  if (url.includes('facebook.com') || url.includes('fb.watch')) return '#1877F2';
  if (url.includes('tiktok.com')) return '#010101';
  if (url.includes('instagram.com')) return '#C13584';
  if (url.includes('twitter.com') || url.includes('x.com')) return '#000000';
  if (url.includes('vimeo.com')) return '#1AB7EA';
  return '#1A1A2E';
}

function getPlatformIcon(platform: string): string {
  if (platform === 'Facebook') return 'f';
  if (platform === 'TikTok') return '♪';
  if (platform === 'Instagram') return '✦';
  if (platform === 'X') return '𝕏';
  if (platform === 'Vimeo') return 'v';
  return '▶';
}

interface PostCardProps {
  post: PostWithCounts;
  onPress?: () => void;
}

export default React.memo(function PostCard({ post, onPress }: PostCardProps) {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const toggleReaction = useToggleReaction();
  const deletePost = useDeletePost();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isOwner = user?.id === post.user_id;

  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  }, []);

  const handleReaction = useCallback((type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleReaction.mutate({ postId: post.id, type });
  }, [post.id, toggleReaction]);

  const handleShare = useCallback(async () => {
    try {
      const shareContent: { message: string; url?: string; title?: string } = {
        message: `🚨 ${post.title}${post.description ? `\n\n${post.description}` : ''}${post.location ? `\n\n📍 ${post.location}` : ''}\n\nInstale a App Alerta Madeira\nhttps://www.alertamadeira.com/`,
        title: post.title,
      };
      if (post.image_url && post.image_url.length > 0) {
        shareContent.url = post.image_url;
      }
      await Share.share(shareContent);
    } catch (e) {
      console.log('[Share] Error:', e);
    }
  }, [post.title, post.description, post.image_url, post.location]);

  const handleDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deletePost.mutate(post.id);
  }, [post.id, deletePost]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const catColor = CATEGORY_COLORS[post.category] ?? '#999';
  const catBg = CATEGORY_BG[post.category] ?? '#F5F5F5';

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => router.push(`/post-detail?id=${post.id}` as any)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID="post-card"
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {post.user_avatar ? (
              <Image source={{ uri: post.user_avatar }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(post.user_name ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.username}>{post.user_name ?? 'Utilizador'}</Text>
              <View style={styles.metaRow}>
                <Clock size={11} color={Colors.textMuted} />
                <Text style={styles.metaText}>{formatDate(post.created_at)}</Text>
                {post.location ? (
                  <>
                    <MapPin size={11} color={Colors.textMuted} />
                    <Text style={styles.metaText} numberOfLines={1}>{post.location}</Text>
                  </>
                ) : null}
              </View>
            </View>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: catBg }]}>
            <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
            <Text style={[styles.categoryText, { color: catColor }]}>
              {CATEGORY_LABELS[post.category] ?? post.category}
            </Text>
          </View>
        </View>

        {post.image_url && post.image_url.length > 0 ? (
          <>
            <Image
              source={{ uri: post.image_url }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
            {post.video_url ? (
              <TouchableOpacity
                style={styles.videoOverlay}
                onPress={() => Linking.openURL(post.video_url!)}
                activeOpacity={0.85}
              >
                <View style={styles.videoPlaySmall}>
                  <Play size={14} color={Colors.white} />
                </View>
              </TouchableOpacity>
            ) : null}
          </>
        ) : post.video_url ? (
          <TouchableOpacity
            style={styles.videoThumbContainer}
            onPress={() => Linking.openURL(post.video_url!)}
            activeOpacity={0.85}
          >
            {getVideoThumbnail(post.video_url!) ? (
              <>
                <Image
                  source={{ uri: getVideoThumbnail(post.video_url!)! }}
                  style={styles.videoThumbImage}
                  contentFit="cover"
                />
                <View style={styles.videoThumbOverlay}>
                  <View style={styles.videoPlayCircle}>
                    <Play size={28} color={Colors.white} />
                  </View>
                  <Text style={styles.videoThumbLabel} numberOfLines={1}>
                    {getVideoPlatform(post.video_url!)}
                  </Text>
                </View>
              </>
            ) : (
              <View style={[styles.videoThumbInner, { backgroundColor: getPlatformBrandColor(post.video_url!) }]}>
                <View style={styles.platformBrandRow}>
                  <Text style={styles.platformLetter}>{getPlatformIcon(getVideoPlatform(post.video_url!))}</Text>
                </View>
                <View style={styles.videoPlayCircleWhite}>
                  <Play size={26} color={getPlatformBrandColor(post.video_url!)} fill={getPlatformBrandColor(post.video_url!)} />
                </View>
                <Text style={styles.videoThumbLabel} numberOfLines={1}>
                  {getVideoPlatform(post.video_url!)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : null}

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
          {post.description ? (
            <Text style={styles.description} numberOfLines={3}>{post.description}</Text>
          ) : null}

        </View>

        <View style={styles.actions}>
          <View style={styles.reactionsRow}>
            {REACTION_TYPES.map(type => {
              const reactionKey = type === '👍' ? 'reactions_thumbs_up' : type === '❤️' ? 'reactions_heart' : 'reactions_alert';
              const count = (post[reactionKey] ?? []).length;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.reactionBtn,
                    post.user_reactions.includes(type) && styles.reactionActive,
                  ]}
                  onPress={() => handleReaction(type)}
                  testID={`reaction-${type}`}
                >
                  <Text style={styles.reactionEmoji}>{type}</Text>
                  {count > 0 && <Text style={styles.reactionCountInline}>{count}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/post-detail?id=${post.id}` as any)}>
              <MessageCircle size={18} color={Colors.textSecondary} />
              {post.comments_count > 0 && (
                <Text style={styles.actionCount}>{post.comments_count}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Share2 size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            {(isOwner || isAdmin) && (
              <>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push(`/edit-post?id=${post.id}` as any)}
                >
                  <Edit3 size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
                  <Trash2 size={16} color={Colors.danger} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  username: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginRight: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.borderLight,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 24,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.background,
    gap: 2,
    minHeight: 32,
  },
  reactionActive: {
    backgroundColor: Colors.primaryPale,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCountInline: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    marginLeft: 2,
  },
  videoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  videoLinkText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 3,
  },
  actionCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  videoThumbContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#1A1A2E',
    position: 'relative',
  },
  videoThumbImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  videoThumbInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  videoPlayCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayCircleWhite: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformBrandRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  platformLetter: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: -1,
  },
  videoThumbLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
  videoOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    top: 74,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
  },
  videoPlaySmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoOverlayText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
