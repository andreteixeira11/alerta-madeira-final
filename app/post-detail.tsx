import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Share, Linking,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Send, MapPin, Clock, Share2, Play, MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { usePostDetail, useComments, useAddComment, useToggleReaction } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { translateError } from '@/utils/translateError';
import { REACTION_TYPES } from '@/types';
import * as Haptics from 'expo-haptics';

const CATEGORY_LABELS: Record<string, string> = {
  ocorrencias: 'Ocorrência',
  opstop: 'Op. Stop',
  anomalias: 'Anomalia',
  perdidos: 'Perdidos e Achados',
};

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

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: post, isLoading } = usePostDetail(id ?? '');
  const { data: comments, isLoading: commentsLoading } = useComments(id ?? '');
  const addComment = useAddComment();
  const toggleReaction = useToggleReaction();
  const [commentText, setCommentText] = useState('');
  const insets = useSafeAreaInsets();

  const handleSendComment = useCallback(async () => {
    if (!commentText.trim() || !id) return;
    try {
      await addComment.mutateAsync({ postId: id, text: commentText.trim() });
      setCommentText('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error: any) {
      Alert.alert('Erro', translateError(error));
    }
  }, [commentText, id, addComment]);

  const handleReaction = useCallback(async (type: string) => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleReaction.mutate({ postId: id, type });
  }, [id, toggleReaction]);

  const handleShare = useCallback(async () => {
    if (!post) return;
    try {
      const shareContent: { message: string; url?: string; title?: string } = {
        message: `\u{1F6A8} ${post.title}${post.description ? `\n\n${post.description}` : ''}${post.location ? `\n\n\u{1F4CD} ${post.location}` : ''}\n\nInstale a App Alerta Madeira\nhttps://www.alertamadeira.com/`,
        title: post.title,
      };
      if (post.image_url && post.image_url.length > 0) {
        shareContent.url = post.image_url;
      }
      await Share.share(shareContent);
    } catch (e) {
      console.log('[Share] Error:', e);
    }
  }, [post]);

  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  if (isLoading || !post) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Publicação' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          title: CATEGORY_LABELS[post.category] ?? post.category,
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={{ padding: 4 }}>
              <Share2 size={20} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {post.image_url && post.image_url.length > 0 ? (
          <Image
            source={{ uri: post.image_url }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
          />
        ) : post.video_url ? (
          <TouchableOpacity
            style={styles.videoThumbContainer}
            onPress={() => Linking.openURL(post.video_url!)}
            activeOpacity={0.85}
          >
            {getVideoThumbnail(post.video_url) ? (
              <>
                <Image
                  source={{ uri: getVideoThumbnail(post.video_url)! }}
                  style={styles.videoThumbImage}
                  contentFit="cover"
                />
                <View style={styles.videoThumbOverlay}>
                  <View style={styles.videoPlayCircle}>
                    <Play size={32} color={Colors.white} />
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.videoThumbInner}>
                <View style={styles.videoPlayCircle}>
                  <Play size={32} color={Colors.white} />
                </View>
                <Text style={styles.videoThumbLabel}>
                  {post.video_url.includes('youtube') || post.video_url.includes('youtu.be') ? 'YouTube' :
                   post.video_url.includes('facebook') || post.video_url.includes('fb.watch') ? 'Facebook' :
                   post.video_url.includes('vimeo') ? 'Vimeo' : 'Vídeo'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : null}

        <View style={styles.content}>
          <View style={styles.authorRow}>
            {post.user_avatar ? (
              <Image source={{ uri: post.user_avatar }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(post.user_name ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.user_name ?? 'Utilizador'}</Text>
              <View style={styles.metaRow}>
                <Clock size={11} color={Colors.textMuted} />
                <Text style={styles.metaText}>{formatDate(post.created_at)}</Text>
              </View>
            </View>
          </View>

          {post.location ? (
            <View style={styles.locationRow}>
              <MapPin size={14} color={Colors.primary} />
              <Text style={styles.locationText}>{post.location}</Text>
            </View>
          ) : null}

          <Text style={styles.title}>{post.title}</Text>
          {post.description ? (
            <Text style={styles.description}>{post.description}</Text>
          ) : null}

          {post.video_url && post.image_url && post.image_url.length > 0 ? (
            <TouchableOpacity
              style={styles.videoLink}
              onPress={() => Linking.openURL(post.video_url!)}
            >
              <Play size={16} color={Colors.primary} />
              <Text style={styles.videoLinkText}>Ver vídeo</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.reactionsSection}>
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
                  >
                    <Text style={styles.reactionEmoji}>{type}</Text>
                    {count > 0 && <Text style={styles.reactionCountInline}>{count}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.commentsSectionHeader}>
            <MessageCircle size={18} color={Colors.text} />
            <Text style={styles.commentsTitle}>
              Comentários {comments ? `(${comments.length})` : ''}
            </Text>
          </View>

          {commentsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
          ) : (
            (comments ?? []).map(comment => (
              <View key={comment.id} style={styles.commentItem}>
                {comment.user_avatar ? (
                  <Image source={{ uri: comment.user_avatar }} style={styles.commentAvatarImage} contentFit="cover" />
                ) : (
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {(comment.user_name ?? 'U')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{comment.user_name ?? 'Utilizador'}</Text>
                    <Text style={styles.commentDate}>{formatDate(comment.created_at)}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              </View>
            ))
          )}

          {(comments ?? []).length === 0 && !commentsLoading && (
            <Text style={styles.noComments}>Seja o primeiro a comentar!</Text>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={[styles.commentInputContainer, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
        <TextInput
          style={styles.commentInput}
          placeholder="Escreva um comentário..."
          placeholderTextColor={Colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
          testID="comment-input"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
          onPress={handleSendComment}
          disabled={!commentText.trim() || addComment.isPending}
          testID="send-comment-btn"
        >
          {addComment.isPending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Send size={18} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.borderLight,
  },
  content: {
    padding: 18,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  locationText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  videoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  videoLinkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  reactionsSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
  },
  reactionActive: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primarySoft,
  },
  reactionEmoji: {
    fontSize: 20,
  },
  reactionCountInline: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 14,
  },
  commentsTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    marginTop: 2,
  },
  commentAvatarText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  commentContent: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  commentDate: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  commentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  noComments: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.primarySoft,
  },
  videoThumbContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#1A1A2E',
    position: 'relative',
  },
  videoThumbImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoThumbInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  videoPlayCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoThumbLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.7)',
  },
});
