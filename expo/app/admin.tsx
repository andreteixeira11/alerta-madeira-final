import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Switch, Platform, useWindowDimensions,
  Modal, Share, KeyboardAvoidingView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import {
  Users, FileText, Image as ImageIcon, Trash2, Send, Plus, Bell,
  Shield, LogOut, ChevronDown, ChevronUp, Fuel, BarChart3, Heart,
  TrendingUp, TrendingDown, Minus, Check, X, Camera,
  MessageCircle, Save, Edit3, Link, ArrowUpCircle, RotateCw,
  Eye, MousePointer, Download, Building2, Mail, PlusCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadImageToSupabase } from '@/utils/uploadImage';
import {
  useAllUsers, useAllPosts, useDeleteUser, useDeletePost,
  useAllAds, useCreateAd, useDeleteAd, useToggleAd, useUpdateAd,
  useAdminNotifications, useSendPushNotification, useDeleteNotification,
  useFuelPrices, useSaveFuelPrices,
  useAdminComments, useDeleteComment,
  useUserPostCounts,
  useJuntas, useCreateJunta, useUpdateJunta, useDeleteJunta,
} from '@/hooks/usePosts';
import { UserProfile, Post, Ad, FuelPrice, Comment, JuntaFreguesia } from '@/types';
import { CONCELHOS } from '@/constants/freguesias';
import * as Haptics from 'expo-haptics';



type Tab = 'users' | 'posts' | 'ads' | 'fuel' | 'notifications' | 'juntas' | 'stats';

function PostComments({ postId }: { postId: string }) {
  const { data: comments, isLoading } = useAdminComments(postId);
  const deleteComment = useDeleteComment();

  const handleDeleteComment = useCallback((comment: Comment) => {
    Alert.alert('Remover Comentário', `Remover comentário de ${comment.user_name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteComment.mutate({ commentId: comment.id, postId });
        },
      },
    ]);
  }, [deleteComment, postId]);

  if (isLoading) {
    return <ActivityIndicator color={Colors.primary} size="small" style={{ marginVertical: 8 }} />;
  }

  if (!comments || comments.length === 0) {
    return <Text style={styles.noCommentsText}>Sem comentários</Text>;
  }

  return (
    <View style={styles.commentsContainer}>
      {comments.map(comment => (
        <View key={comment.id} style={styles.commentRow}>
          <View style={styles.commentInfo}>
            <Text style={styles.commentAuthor}>{comment.user_name}</Text>
            <Text style={styles.commentText} numberOfLines={2}>{comment.text}</Text>
            <Text style={styles.commentDate}>
              {new Date(comment.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.commentDeleteBtn}
            onPress={() => handleDeleteComment(comment)}
          >
            <Trash2 size={13} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

export default function AdminScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isAdmin, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [newAdImageUrl, setNewAdImageUrl] = useState('');
  const [newAdLinkUrl, setNewAdLinkUrl] = useState('');
  const [newAdTitle, setNewAdTitle] = useState('');
  const [newAdStartDate, setNewAdStartDate] = useState('');
  const [newAdEndDate, setNewAdEndDate] = useState('');
  const [newAdPosition, setNewAdPosition] = useState<'top' | 'rotative'>('rotative');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifLinkUrl, setNotifLinkUrl] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [showNewAdForm, setShowNewAdForm] = useState(false);
  const [viewingAdStats, setViewingAdStats] = useState<Ad | null>(null);
  const [viewingNotifStats, setViewingNotifStats] = useState<import('@/types').AdminNotification | null>(null);
  const [datePickerTarget, setDatePickerTarget] = useState<string | null>(null);
  const [datePickerYear, setDatePickerYear] = useState(new Date().getFullYear());
  const [datePickerMonth, setDatePickerMonth] = useState(new Date().getMonth());
  const [datePickerDay, setDatePickerDay] = useState(new Date().getDate());

  const [fuelEdits, setFuelEdits] = useState<FuelPrice[]>([]);
  const [fuelDirty, setFuelDirty] = useState(false);

  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: posts, isLoading: postsLoading } = useAllPosts();
  const { data: userPostCounts } = useUserPostCounts();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { data: ads, isLoading: adsLoading } = useAllAds();
  const { data: notifications } = useAdminNotifications();
  const deleteUser = useDeleteUser();
  const deletePost = useDeletePost();
  const createAd = useCreateAd();
  const deleteAd = useDeleteAd();
  const toggleAd = useToggleAd();
  const updateAd = useUpdateAd();
  const sendNotification = useSendPushNotification();
  const deleteNotification = useDeleteNotification();
  const { data: fuelPrices, isLoading: fuelLoading } = useFuelPrices();
  const saveFuelPrices = useSaveFuelPrices();
  const { data: juntas, isLoading: juntasLoading } = useJuntas();
  const createJunta = useCreateJunta();
  const updateJunta = useUpdateJunta();
  const deleteJunta = useDeleteJunta();

  const [editingJunta, setEditingJunta] = useState<JuntaFreguesia | null>(null);
  const [juntaNewEmail, setJuntaNewEmail] = useState('');
  const [showAddJunta, setShowAddJunta] = useState(false);
  const [newJuntaConcelho, setNewJuntaConcelho] = useState<string | null>(null);
  const [newJuntaFreguesia, setNewJuntaFreguesia] = useState<string | null>(null);
  const [newJuntaEmails, setNewJuntaEmails] = useState<string[]>([]);
  const [newJuntaEmailInput, setNewJuntaEmailInput] = useState('');
  const [expandedJuntaConcelho, setExpandedJuntaConcelho] = useState<string | null>(null);

  const isCompact = width < 380;

  const showDatePickerFor = useCallback((target: string, existingDate?: string | null) => {
    let d = new Date();
    if (existingDate) {
      const parsed = new Date(existingDate);
      if (!isNaN(parsed.getTime())) d = parsed;
    }
    setDatePickerYear(d.getFullYear());
    setDatePickerMonth(d.getMonth());
    setDatePickerDay(d.getDate());
    setDatePickerTarget(target);
  }, []);

  const handleDatePickerConfirm = useCallback(() => {
    const dateStr = `${datePickerYear}-${String(datePickerMonth + 1).padStart(2, '0')}-${String(datePickerDay).padStart(2, '0')}`;
    if (datePickerTarget === 'newStart') setNewAdStartDate(dateStr);
    else if (datePickerTarget === 'newEnd') setNewAdEndDate(dateStr);
    else if (datePickerTarget === 'editStart' && editingAd) setEditingAd({ ...editingAd, start_date: dateStr });
    else if (datePickerTarget === 'editEnd' && editingAd) setEditingAd({ ...editingAd, end_date: dateStr });
    setDatePickerTarget(null);
  }, [datePickerTarget, datePickerYear, datePickerMonth, datePickerDay, editingAd]);

  const daysInMonth = useMemo(() => new Date(datePickerYear, datePickerMonth + 1, 0).getDate(), [datePickerYear, datePickerMonth]);

  const registrationsByDay = useMemo(() => {
    if (!users) return [] as { date: string; count: number }[];
    const counts: Record<string, number> = {};
    users.forEach(u => {
      const d = new Date(u.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
      counts[d] = (counts[d] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => {
        const [dA, mA, yA] = a.date.split('/');
        const [dB, mB, yB] = b.date.split('/');
        return new Date(`${yB}/${mB}/${dB}`).getTime() - new Date(`${yA}/${mA}/${dA}`).getTime();
      })
      .slice(0, 14);
  }, [users]);

  const totalReactions = useMemo(() => {
    if (!posts) return 0;
    return posts.reduce((sum, p) => {
      return sum +
        (p.reactions_thumbs_up?.length ?? 0) +
        (p.reactions_heart?.length ?? 0) +
        (p.reactions_alert?.length ?? 0);
    }, 0);
  }, [posts]);

  const totalComments = useMemo(() => {
    if (!posts) return 0;
    return posts.reduce((sum, p) => sum + (p.comments_count ?? 0), 0);
  }, [posts]);

  const categoryStats = useMemo(() => {
    if (!posts) return {} as Record<string, number>;
    const s: Record<string, number> = {};
    posts.forEach(p => {
      s[p.category] = (s[p.category] ?? 0) + 1;
    });
    return s;
  }, [posts]);

  useEffect(() => {
    if (fuelPrices && fuelPrices.length > 0 && fuelEdits.length === 0) {
      setFuelEdits(fuelPrices.map(f => ({ ...f })));
    }
  }, [fuelPrices, fuelEdits.length]);

  const updateFuelEdit = useCallback((id: string, field: 'price' | 'trend', value: string) => {
    setFuelEdits(prev => prev.map(f =>
      f.id === id ? { ...f, [field]: value } : f
    ));
    setFuelDirty(true);
  }, []);

  const handleSaveFuels = useCallback(async () => {
    try {
      await saveFuelPrices.mutateAsync(fuelEdits);
      setFuelDirty(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Preços de combustível atualizados');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  }, [fuelEdits, saveFuelPrices]);

  const handleDeleteUser = useCallback((user: UserProfile) => {
    if (user.role === 'admin') {
      Alert.alert('Erro', 'Não é possível remover um administrador');
      return;
    }
    Alert.alert(
      'Remover Utilizador',
      `Tem a certeza que deseja remover ${user.name}?\nTodos os posts e comentários serão apagados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteUser.mutate(user.id);
          },
        },
      ]
    );
  }, [deleteUser]);

  const handleDeletePost = useCallback((post: Post) => {
    Alert.alert('Remover Publicação', `Remover "${post.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          try {
            await deletePost.mutateAsync(post.id);
            console.log('[Admin] Post deleted successfully');
          } catch (error: any) {
            console.log('[Admin] Delete post error:', error.message);
            Alert.alert('Erro ao Apagar', 'Não foi possível apagar o post. Verifique as políticas RLS no Supabase.');
          }
        },
      },
    ]);
  }, [deletePost]);

  const [uploadingImage, setUploadingImage] = useState(false);

  const pickAdImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão de fototeca',
          'Permita o acesso à fototeca para escolher imagens que serão usadas em anúncios e comunicações dentro da app.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 5],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setUploadingImage(true);

      try {
        const fileName = `ad_${Date.now()}.jpg`;
        const filePath = `ads/${fileName}`;

        const publicUrl = await uploadImageToSupabase(
          'advertisements',
          filePath,
          asset.uri,
          asset.base64,
        );

        if (!publicUrl) {
          if (editingAd) {
            setEditingAd({ ...editingAd, image_url: asset.uri });
          } else {
            setNewAdImageUrl(asset.uri);
          }
          Alert.alert(
            'Aviso',
            'Erro no upload para o Supabase.\n\nVerifique se o bucket "advertisements" está público e tem políticas RLS para INSERT/SELECT.\n\nA imagem será utilizada localmente.',
          );
          setUploadingImage(false);
          return;
        }

        if (editingAd) {
          setEditingAd({ ...editingAd, image_url: publicUrl });
        } else {
          setNewAdImageUrl(publicUrl);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        console.log('[Admin] Image uploaded:', publicUrl);
      } catch (uploadErr: any) {
        console.log('[Admin] Upload exception:', uploadErr.message);
        if (editingAd) {
          setEditingAd({ ...editingAd, image_url: asset.uri });
        } else {
          setNewAdImageUrl(asset.uri);
        }
        Alert.alert('Aviso', 'Erro ao fazer upload. Use o campo URL para inserir a imagem manualmente.');
      } finally {
        setUploadingImage(false);
      }
    } catch (err: any) {
      console.log('[Admin] Image picker error:', err.message);
      Alert.alert('Erro', 'Não foi possível abrir a galeria');
      setUploadingImage(false);
    }
  }, [editingAd]);

  const handleDeleteNotification = useCallback((notifId: string, title: string) => {
    Alert.alert('Remover Notificação', `Remover "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteNotification.mutate(notifId);
        },
      },
    ]);
  }, [deleteNotification]);

  const handleCreateAd = useCallback(async () => {
    if (!newAdImageUrl.trim()) {
      Alert.alert('Erro', 'Insira o URL da imagem ou escolha da galeria');
      return;
    }
    try {
      await createAd.mutateAsync({
        image_url: newAdImageUrl.trim(),
        link_url: newAdLinkUrl.trim() || null,
        title: newAdTitle.trim() || null,
        position: newAdPosition,
        start_date: newAdStartDate.trim() || null,
        end_date: newAdEndDate.trim() || null,
      });
      setNewAdImageUrl('');
      setNewAdLinkUrl('');
      setNewAdTitle('');
      setNewAdStartDate('');
      setNewAdEndDate('');
      setNewAdPosition('rotative');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Publicidade criada com sucesso');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  }, [newAdImageUrl, newAdLinkUrl, newAdTitle, newAdStartDate, newAdEndDate, newAdPosition, createAd]);

  const handleEditAd = useCallback((ad: Ad) => {
    setEditingAd({ ...ad });
  }, []);

  const handleSaveEditAd = useCallback(async () => {
    if (!editingAd) return;
    try {
      await updateAd.mutateAsync({
        id: editingAd.id,
        image_url: editingAd.image_url,
        link_url: editingAd.link_url,
        title: editingAd.title,
        position: editingAd.position,
        start_date: editingAd.start_date,
        end_date: editingAd.end_date,
        active: editingAd.active,
      });
      setEditingAd(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Publicidade atualizada');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  }, [editingAd, updateAd]);

  const handleDeleteAd = useCallback((ad: Ad) => {
    Alert.alert('Remover Publicidade', 'Tem a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteAd.mutate(ad.id);
        },
      },
    ]);
  }, [deleteAd]);

  const handleToggleAd = useCallback((ad: Ad) => {
    toggleAd.mutate({ id: ad.id, active: !ad.active });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [toggleAd]);

  const handleSendNotification = useCallback(async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      Alert.alert('Erro', 'Preencha o título e a mensagem');
      return;
    }
    Alert.alert(
      'Enviar Notificação',
      'Enviar notificação push para todos os utilizadores?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              const result = await sendNotification.mutateAsync({
                title: notifTitle.trim(),
                body: notifBody.trim(),
                sentBy: profile?.name ?? 'Admin',
                linkUrl: notifLinkUrl.trim() || undefined,
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Sucesso', `Notificação registada para ${result.sent} dispositivos`);
              setNotifTitle('');
              setNotifBody('');
              setNotifLinkUrl('');
            } catch (error: any) {
              console.log('[Admin] Send notification error:', error.message);
              Alert.alert('Erro', error.message || 'Erro ao enviar notificação');
            }
          },
        },
      ]
    );
  }, [notifTitle, notifBody, notifLinkUrl, profile, sendNotification]);

  const generateAdStatsPdf = useCallback(async (ad: Ad) => {
    const html = `
      <html><head><meta charset="utf-8"><style>
        body { font-family: -apple-system, sans-serif; padding: 40px; }
        h1 { color: #C0392B; font-size: 24px; }
        h2 { color: #333; font-size: 18px; margin-top: 24px; }
        .stat { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
        .stat-label { color: #666; font-size: 14px; }
        .stat-value { font-weight: bold; font-size: 16px; color: #333; }
        .header { border-bottom: 2px solid #C0392B; padding-bottom: 16px; margin-bottom: 24px; }
        .footer { margin-top: 40px; color: #999; font-size: 11px; text-align: center; }
      </style></head><body>
      <div class="header">
        <h1>Alerta Madeira - Estatísticas do Anúncio</h1>
        <p style="color:#666;">Relatório gerado em ${new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <h2>${ad.title || 'Sem título'}</h2>
      <div class="stat"><span class="stat-label">Posição</span><span class="stat-value">${ad.position === 'top' ? 'Topo' : 'Rotativo'}</span></div>
      <div class="stat"><span class="stat-label">Estado</span><span class="stat-value">${ad.active ? 'Ativo' : 'Inativo'}</span></div>
      <div class="stat"><span class="stat-label">Impressões</span><span class="stat-value">${ad.impressions_count ?? 0}</span></div>
      <div class="stat"><span class="stat-label">Cliques</span><span class="stat-value">${ad.clicks_count ?? 0}</span></div>
      <div class="stat"><span class="stat-label">Taxa de Clique (CTR)</span><span class="stat-value">${(ad.impressions_count ?? 0) > 0 ? (((ad.clicks_count ?? 0) / (ad.impressions_count ?? 1)) * 100).toFixed(2) + '%' : '0%'}</span></div>
      <div class="stat"><span class="stat-label">Data Início</span><span class="stat-value">${ad.start_date ? ad.start_date.substring(0, 10) : 'N/A'}</span></div>
      <div class="stat"><span class="stat-label">Data Fim</span><span class="stat-value">${ad.end_date ? ad.end_date.substring(0, 10) : 'N/A'}</span></div>
      <div class="stat"><span class="stat-label">Link</span><span class="stat-value">${ad.link_url || 'Sem link'}</span></div>
      <div class="stat"><span class="stat-label">Criado em</span><span class="stat-value">${new Date(ad.created_at).toLocaleDateString('pt-PT')}</span></div>
      <div class="footer">Alerta Madeira · Relatório de Publicidade</div>
      </body></html>
    `;
    try {
      await Print.printAsync({ html });
    } catch (e: any) {
      console.log('[Admin] PDF export error:', e.message);
      Alert.alert('Erro', 'Não foi possível gerar o PDF');
    }
  }, []);

  const generateNotifStatsPdf = useCallback(async (notif: import('@/types').AdminNotification) => {
    const html = `
      <html><head><meta charset="utf-8"><style>
        body { font-family: -apple-system, sans-serif; padding: 40px; }
        h1 { color: #C0392B; font-size: 24px; }
        h2 { color: #333; font-size: 18px; margin-top: 24px; }
        .stat { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
        .stat-label { color: #666; font-size: 14px; }
        .stat-value { font-weight: bold; font-size: 16px; color: #333; }
        .header { border-bottom: 2px solid #C0392B; padding-bottom: 16px; margin-bottom: 24px; }
        .footer { margin-top: 40px; color: #999; font-size: 11px; text-align: center; }
      </style></head><body>
      <div class="header">
        <h1>Alerta Madeira - Estatísticas da Notificação</h1>
        <p style="color:#666;">Relatório gerado em ${new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
      <h2>${notif.title}</h2>
      <div class="stat"><span class="stat-label">Mensagem</span><span class="stat-value">${notif.body}</span></div>
      <div class="stat"><span class="stat-label">Enviado por</span><span class="stat-value">${notif.sent_by}</span></div>
      <div class="stat"><span class="stat-label">Destinatários</span><span class="stat-value">${notif.recipients_count}</span></div>
      <div class="stat"><span class="stat-label">Aberturas</span><span class="stat-value">${notif.opened_count ?? 0}</span></div>
      <div class="stat"><span class="stat-label">Link</span><span class="stat-value">${notif.link_url || 'Sem link'}</span></div>
      <div class="stat"><span class="stat-label">Data de Envio</span><span class="stat-value">${new Date(notif.sent_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
      <div class="footer">Alerta Madeira · Relatório de Notificação Push</div>
      </body></html>
    `;
    try {
      await Print.printAsync({ html });
    } catch (e: any) {
      console.log('[Admin] PDF export error:', e.message);
      Alert.alert('Erro', 'Não foi possível gerar o PDF');
    }
  }, []);

  const handleAdminLogout = useCallback(() => {
    Alert.alert('Terminar Sessão', 'Sair do painel de administração?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login' as any);
        },
      },
    ]);
  }, [logout, router]);

  if (!isAdmin) {
    return (
      <View style={styles.denied}>
        <Stack.Screen options={{ title: 'Administração', headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const tabItems: { key: Tab; label: string; shortLabel: string; icon: typeof Users; count?: number }[] = [
    { key: 'users', label: 'Utilizadores', shortLabel: 'Users', icon: Users, count: users?.length },
    { key: 'posts', label: 'Posts', shortLabel: 'Posts', icon: FileText, count: posts?.length },
    { key: 'ads', label: 'Anúncios', shortLabel: 'Ads', icon: ImageIcon, count: ads?.length },
    { key: 'fuel', label: 'Combustível', shortLabel: 'Fuel', icon: Fuel },
    { key: 'notifications', label: 'Push', shortLabel: 'Push', icon: Bell },
    { key: 'juntas', label: 'Juntas', shortLabel: 'Juntas', icon: Building2, count: juntas?.length },
    { key: 'stats', label: 'Estatísticas', shortLabel: 'Stats', icon: BarChart3 },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <View style={styles.topBarInner}>
          <View style={styles.topBarLeft}>
            <View style={styles.adminIcon}>
              <Shield size={18} color={Colors.white} />
            </View>
            <View>
              <Text style={styles.topBarTitle}>Painel Admin</Text>
              <Text style={styles.topBarSub}>{profile?.name ?? 'Administrador'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleAdminLogout}>
            <LogOut size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll} contentContainerStyle={styles.tabBarContent}>
        {tabItems.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <tab.icon
              size={14}
              color={activeTab === tab.key ? Colors.white : Colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {isCompact ? tab.shortLabel : tab.label}
            </Text>
            {tab.count !== undefined && (
              <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'users' && (
          <>
            <Text style={styles.sectionCount}>{users?.length ?? 0} utilizadores registados</Text>
            {usersLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
              (users ?? []).map(u => {
                const postCount = userPostCounts?.[u.id] ?? 0;
                const isExpanded = expandedUser === u.id;
                return (
                  <View key={u.id} style={styles.userCard}>
                    <TouchableOpacity
                      style={styles.listItem}
                      activeOpacity={0.7}
                      onPress={() => setExpandedUser(isExpanded ? null : u.id)}
                    >
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {(u.name ?? 'U')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.listItemInfo}>
                        <Text style={styles.listItemTitle} numberOfLines={1}>{u.name}</Text>
                        <Text style={styles.listItemSub} numberOfLines={1}>{u.email}</Text>
                        <View style={styles.roleRow}>
                          <View style={[
                            styles.roleBadge,
                            u.role === 'admin' && styles.roleBadgeAdmin,
                          ]}>
                            <Text style={[
                              styles.roleBadgeText,
                              u.role === 'admin' && styles.roleBadgeTextAdmin,
                            ]}>
                              {u.role === 'admin' ? 'Admin' : 'Utilizador'}
                            </Text>
                          </View>
                          <View style={styles.postCountBadge}>
                            <FileText size={10} color={Colors.textMuted} />
                            <Text style={styles.postCountText}>{postCount} posts</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.userActions}>
                        <TouchableOpacity
                          style={styles.expandBtn}
                          onPress={() => setExpandedUser(isExpanded ? null : u.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp size={14} color={Colors.textMuted} />
                          ) : (
                            <ChevronDown size={14} color={Colors.textMuted} />
                          )}
                        </TouchableOpacity>
                        {u.role !== 'admin' && (
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => handleDeleteUser(u)}
                          >
                            <Trash2 size={16} color={Colors.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={styles.userExpandedInfo}>
                        <View style={styles.userStatsRow}>
                          <View style={styles.userStatItem}>
                            <FileText size={14} color={Colors.primary} />
                            <Text style={styles.userStatValue}>{postCount}</Text>
                            <Text style={styles.userStatLabel}>Publicações</Text>
                          </View>
                          <View style={styles.userStatItem}>
                            <Users size={14} color={Colors.accent} />
                            <Text style={styles.userStatValue}>{u.role === 'admin' ? 'Admin' : 'User'}</Text>
                            <Text style={styles.userStatLabel}>Tipo</Text>
                          </View>
                          <View style={styles.userStatItem}>
                            <Bell size={14} color="#22C55E" />
                            <Text style={styles.userStatValue}>
                              {new Date(u.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </Text>
                            <Text style={styles.userStatLabel}>Registo</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}

        {activeTab === 'posts' && (
          <>
            <Text style={styles.sectionCount}>{posts?.length ?? 0} publicações</Text>
            {postsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
              (posts ?? []).map(p => {
                const catColor = p.category === 'ocorrencias' ? '#E74C3C' : p.category === 'opstop' ? '#E67E22' : p.category === 'anomalias' ? '#F1C40F' : '#3498DB';
                const catLabel = p.category === 'ocorrencias' ? 'Ocorrência' : p.category === 'opstop' ? 'Op. Stop' : p.category === 'anomalias' ? 'Anomalia' : 'Perdido';
                const rTotal = (p.reactions_thumbs_up?.length ?? 0) + (p.reactions_heart?.length ?? 0) + (p.reactions_alert?.length ?? 0);
                return (
                  <View key={p.id} style={styles.postItem}>
                    {p.image_url ? (
                      <Image source={{ uri: p.image_url }} style={styles.postCardImage} contentFit="cover" />
                    ) : null}
                    <View style={{ padding: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <View style={[styles.postCategoryBadge, { backgroundColor: catColor + '20' }]}>
                          <Text style={[styles.postCategoryText, { color: catColor }]}>{catLabel}</Text>
                        </View>
                        <Text style={styles.postCardMetaText}>
                          {new Date(p.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={styles.listItemTitle} numberOfLines={2}>{p.title}</Text>
                      {p.description ? (
                        <Text style={styles.postCardDesc} numberOfLines={2}>{p.description}</Text>
                      ) : null}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <Text style={styles.postCardMetaText}>por {p.user_name ?? 'Desconhecido'}</Text>
                        {rTotal > 0 && <Text style={styles.postCardMetaText}>❤️ {rTotal}</Text>}
                        <Text style={styles.postCardMetaText}>💬 {p.comments_count ?? 0}</Text>
                      </View>
                    </View>
                    <View style={styles.postActionsRow}>
                      <TouchableOpacity
                        style={styles.postExpandBtn}
                        onPress={() => setExpandedPost(expandedPost === p.id ? null : p.id)}
                      >
                        <MessageCircle size={13} color={Colors.textMuted} />
                        <Text style={{ fontSize: 11, color: Colors.textMuted }}>Comentários</Text>
                        {expandedPost === p.id ? (
                          <ChevronUp size={13} color={Colors.textMuted} />
                        ) : (
                          <ChevronDown size={13} color={Colors.textMuted} />
                        )}
                      </TouchableOpacity>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => router.push(`/edit-post?id=${p.id}` as any)}
                        >
                          <Edit3 size={14} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeletePost(p)}
                        >
                          <Trash2 size={16} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {expandedPost === p.id && (
                      <View style={styles.postExpanded}>
                        <View style={styles.commentsSection}>
                          <View style={styles.commentsSectionHeader}>
                            <MessageCircle size={14} color={Colors.textMuted} />
                            <Text style={styles.commentsSectionTitle}>Comentários</Text>
                          </View>
                          <PostComments postId={p.id} />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}

        {activeTab === 'ads' && (
          <>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowNewAdForm(!showNewAdForm)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.collapsibleHeaderText}>Nova Publicidade</Text>
              </View>
              {showNewAdForm ? (
                <ChevronUp size={16} color={Colors.textMuted} />
              ) : (
                <ChevronDown size={16} color={Colors.textMuted} />
              )}
            </TouchableOpacity>

            {showNewAdForm && (
              <View style={styles.formCard}>
                <Text style={styles.formHint}>
                  Dimensões recomendadas: 1200×375 px (proporção 16:5)
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Título (opcional)"
                  placeholderTextColor={Colors.textMuted}
                  value={newAdTitle}
                  onChangeText={setNewAdTitle}
                />

                <View style={styles.positionRow}>
                  <Text style={styles.positionLabel}>Posição:</Text>
                  <TouchableOpacity
                    style={[styles.positionBtn, newAdPosition === 'top' && styles.positionBtnActive]}
                    onPress={() => setNewAdPosition('top')}
                  >
                    <ArrowUpCircle size={14} color={newAdPosition === 'top' ? Colors.white : Colors.textSecondary} />
                    <Text style={[styles.positionBtnText, newAdPosition === 'top' && styles.positionBtnTextActive]}>Topo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.positionBtn, newAdPosition === 'rotative' && styles.positionBtnActive]}
                    onPress={() => setNewAdPosition('rotative')}
                  >
                    <RotateCw size={14} color={newAdPosition === 'rotative' ? Colors.white : Colors.textSecondary} />
                    <Text style={[styles.positionBtnText, newAdPosition === 'rotative' && styles.positionBtnTextActive]}>Rotativo</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.imagePickerBtn}
                  onPress={pickAdImage}
                  disabled={uploadingImage}
                  activeOpacity={0.7}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <>
                      <Camera size={20} color={Colors.primary} />
                      <Text style={styles.imagePickerText}>Escolher da Galeria</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.orDivider}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>ou</Text>
                  <View style={styles.orLine} />
                </View>

                <TextInput
                  style={styles.formInput}
                  placeholder="URL da imagem"
                  placeholderTextColor={Colors.textMuted}
                  value={newAdImageUrl}
                  onChangeText={setNewAdImageUrl}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.formInput}
                  placeholder="URL do link (opcional)"
                  placeholderTextColor={Colors.textMuted}
                  value={newAdLinkUrl}
                  onChangeText={setNewAdLinkUrl}
                  autoCapitalize="none"
                />
                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>Data início</Text>
                    <TouchableOpacity
                      style={styles.datePickerBtn}
                      onPress={() => showDatePickerFor('newStart', newAdStartDate || null)}
                    >
                      <Text style={[styles.datePickerBtnText, !newAdStartDate && { color: Colors.textMuted }]}>
                        {newAdStartDate ? newAdStartDate.substring(0, 10) : 'Selecionar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateField}>
                    <Text style={styles.dateLabel}>Data fim</Text>
                    <TouchableOpacity
                      style={styles.datePickerBtn}
                      onPress={() => showDatePickerFor('newEnd', newAdEndDate || null)}
                    >
                      <Text style={[styles.datePickerBtnText, !newAdEndDate && { color: Colors.textMuted }]}>
                        {newAdEndDate ? newAdEndDate.substring(0, 10) : 'Selecionar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {newAdImageUrl.trim() ? (
                  <View style={styles.adPreview}>
                    <Image
                      source={{ uri: newAdImageUrl.trim() }}
                      style={styles.adPreviewImage}
                      contentFit="cover"
                    />
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[styles.submitBtn, (createAd.isPending || uploadingImage) && { opacity: 0.7 }]}
                  onPress={handleCreateAd}
                  disabled={createAd.isPending || uploadingImage}
                >
                  {createAd.isPending ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <>
                      <Plus size={16} color={Colors.white} />
                      <Text style={styles.submitText}>Adicionar Publicidade</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionCount}>{ads?.length ?? 0} anúncios</Text>
            {adsLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
              (ads ?? []).map(ad => (
                <View key={ad.id} style={styles.adItem}>
                  <Image
                    source={{ uri: ad.image_url }}
                    style={styles.adItemImage}
                    contentFit="cover"
                  />
                  <View style={styles.adItemInfo}>
                    <Text style={styles.adItemTitle} numberOfLines={1}>
                      {ad.title || 'Sem título'}
                    </Text>
                    <Text style={styles.listItemSub} numberOfLines={1}>
                      {ad.link_url ? ad.link_url : 'Sem link'}
                    </Text>
                    <View style={styles.adMetaRow}>
                      <View style={[styles.positionTag, { backgroundColor: ad.position === 'top' ? '#EBF5FB' : '#FEF9E7' }]}>
                        <Text style={[styles.positionTagText, { color: ad.position === 'top' ? '#2980B9' : '#D4AC0D' }]}>
                          {ad.position === 'top' ? '⬆ Topo' : '🔄 Rotativo'}
                        </Text>
                      </View>
                      {ad.start_date && (
                        <Text style={styles.adDateText}>
                          {ad.start_date.substring(0, 10)} → {ad.end_date?.substring(0, 10) ?? '∞'}
                        </Text>
                      )}
                    </View>
                    <View style={styles.adToggleRow}>
                      <Text style={styles.adToggleLabel}>
                        {ad.active ? 'Ativo' : 'Inativo'}
                      </Text>
                      <Switch
                        value={ad.active}
                        onValueChange={() => handleToggleAd(ad)}
                        trackColor={{ false: '#E0E0E0', true: Colors.primarySoft }}
                        thumbColor={ad.active ? Colors.primary : '#ccc'}
                      />
                    </View>
                  </View>
                  <View style={styles.adActions}>
                    <TouchableOpacity
                      style={[styles.editBtn, { backgroundColor: '#EBF5FB' }]}
                      onPress={() => setViewingAdStats(ad)}
                    >
                      <BarChart3 size={14} color="#2980B9" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleEditAd(ad)}
                    >
                      <Edit3 size={14} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteAd(ad)}
                    >
                      <Trash2 size={14} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <Modal visible={!!viewingAdStats} animationType="fade" transparent onRequestClose={() => setViewingAdStats(null)}>
              <View style={styles.editModalOverlay}>
                <View style={styles.editModalContent}>
                  <View style={styles.editModalHeader}>
                    <Text style={styles.editModalTitle}>Estatísticas do Anúncio</Text>
                    <TouchableOpacity onPress={() => setViewingAdStats(null)}>
                      <X size={20} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                  {viewingAdStats && (
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 16 }}>
                        {viewingAdStats.title || 'Sem título'}
                      </Text>
                      <View style={styles.adStatsGrid}>
                        <View style={styles.adStatCard}>
                          <Eye size={20} color="#3498DB" />
                          <Text style={styles.adStatNumber}>{viewingAdStats.impressions_count ?? 0}</Text>
                          <Text style={styles.adStatLabel}>Impressões</Text>
                        </View>
                        <View style={styles.adStatCard}>
                          <MousePointer size={20} color="#E67E22" />
                          <Text style={styles.adStatNumber}>{viewingAdStats.clicks_count ?? 0}</Text>
                          <Text style={styles.adStatLabel}>Cliques</Text>
                        </View>
                        <View style={styles.adStatCard}>
                          <TrendingUp size={20} color="#27AE60" />
                          <Text style={styles.adStatNumber}>
                            {(viewingAdStats.impressions_count ?? 0) > 0
                              ? (((viewingAdStats.clicks_count ?? 0) / (viewingAdStats.impressions_count ?? 1)) * 100).toFixed(1) + '%'
                              : '0%'}
                          </Text>
                          <Text style={styles.adStatLabel}>CTR</Text>
                        </View>
                      </View>
                      <View style={{ marginTop: 12 }}>
                        <View style={styles.adStatRow}>
                          <Text style={styles.adStatRowLabel}>Posição</Text>
                          <Text style={styles.adStatRowValue}>{viewingAdStats.position === 'top' ? 'Topo' : 'Rotativo'}</Text>
                        </View>
                        <View style={styles.adStatRow}>
                          <Text style={styles.adStatRowLabel}>Estado</Text>
                          <Text style={styles.adStatRowValue}>{viewingAdStats.active ? 'Ativo' : 'Inativo'}</Text>
                        </View>
                        <View style={styles.adStatRow}>
                          <Text style={styles.adStatRowLabel}>Período</Text>
                          <Text style={styles.adStatRowValue}>
                            {viewingAdStats.start_date ? viewingAdStats.start_date.substring(0, 10) : 'N/A'} → {viewingAdStats.end_date ? viewingAdStats.end_date.substring(0, 10) : '∞'}
                          </Text>
                        </View>
                        <View style={styles.adStatRow}>
                          <Text style={styles.adStatRowLabel}>Criado em</Text>
                          <Text style={styles.adStatRowValue}>{new Date(viewingAdStats.created_at).toLocaleDateString('pt-PT')}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: '#2563EB', marginTop: 16 }]}
                        onPress={() => generateAdStatsPdf(viewingAdStats)}
                      >
                        <Download size={16} color={Colors.white} />
                        <Text style={styles.submitText}>Exportar PDF</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </Modal>

            <Modal visible={!!editingAd} animationType="fade" transparent onRequestClose={() => { if (datePickerTarget?.startsWith('edit')) { setDatePickerTarget(null); } else { setEditingAd(null); } }}>
              <View style={styles.editModalOverlay}>
                <View style={styles.editModalContent}>
                  <View style={styles.editModalHeader}>
                    <Text style={styles.editModalTitle}>Editar Anúncio</Text>
                    <TouchableOpacity onPress={() => setEditingAd(null)}>
                      <X size={20} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                  {editingAd && (
                    datePickerTarget?.startsWith('edit') ? (
                      <View>
                        <View style={styles.datePickerRow}>
                          <View style={styles.datePickerCol}>
                            <Text style={styles.datePickerColLabel}>Dia</Text>
                            <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator nestedScrollEnabled>
                              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                                <TouchableOpacity
                                  key={d}
                                  style={[styles.datePickerItem, datePickerDay === d && styles.datePickerItemActive]}
                                  onPress={() => setDatePickerDay(d)}
                                >
                                  <Text style={[styles.datePickerItemText, datePickerDay === d && styles.datePickerItemTextActive]}>{d}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                          <View style={styles.datePickerCol}>
                            <Text style={styles.datePickerColLabel}>Mês</Text>
                            <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator nestedScrollEnabled>
                              {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => (
                                <TouchableOpacity
                                  key={m}
                                  style={[styles.datePickerItem, datePickerMonth === i && styles.datePickerItemActive]}
                                  onPress={() => setDatePickerMonth(i)}
                                >
                                  <Text style={[styles.datePickerItemText, datePickerMonth === i && styles.datePickerItemTextActive]}>{m}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                          <View style={styles.datePickerCol}>
                            <Text style={styles.datePickerColLabel}>Ano</Text>
                            <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator nestedScrollEnabled>
                              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 1).map(y => (
                                <TouchableOpacity
                                  key={y}
                                  style={[styles.datePickerItem, datePickerYear === y && styles.datePickerItemActive]}
                                  onPress={() => setDatePickerYear(y)}
                                >
                                  <Text style={[styles.datePickerItemText, datePickerYear === y && styles.datePickerItemTextActive]}>{y}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        </View>
                        <Text style={styles.datePickerPreview}>
                          {`${String(datePickerDay).padStart(2, '0')}/${String(datePickerMonth + 1).padStart(2, '0')}/${datePickerYear}`}
                        </Text>
                        <TouchableOpacity
                          style={[styles.submitBtn, { backgroundColor: '#22C55E', marginTop: 8 }]}
                          onPress={handleDatePickerConfirm}
                        >
                          <Check size={16} color={Colors.white} />
                          <Text style={styles.submitText}>Confirmar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <TextInput
                        style={styles.formInput}
                        placeholder="Título"
                        placeholderTextColor={Colors.textMuted}
                        value={editingAd.title ?? ''}
                        onChangeText={(v) => setEditingAd({ ...editingAd, title: v })}
                      />
                      <View style={{ height: 8 }} />
                      <TextInput
                        style={styles.formInput}
                        placeholder="URL da imagem"
                        placeholderTextColor={Colors.textMuted}
                        value={editingAd.image_url}
                        onChangeText={(v) => setEditingAd({ ...editingAd, image_url: v })}
                        autoCapitalize="none"
                      />
                      <View style={{ height: 8 }} />
                      <TouchableOpacity style={styles.imagePickerBtn} onPress={pickAdImage} disabled={uploadingImage}>
                        {uploadingImage ? <ActivityIndicator color={Colors.primary} size="small" /> : (
                          <>
                            <Camera size={18} color={Colors.primary} />
                            <Text style={styles.imagePickerText}>Trocar Imagem</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <View style={{ height: 8 }} />
                      <Text style={styles.formHint}>Dimensões recomendadas: 1200×375 px (proporção 16:5)</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="URL do link"
                        placeholderTextColor={Colors.textMuted}
                        value={editingAd.link_url ?? ''}
                        onChangeText={(v) => setEditingAd({ ...editingAd, link_url: v })}
                        autoCapitalize="none"
                      />
                      <View style={{ height: 8 }} />
                      <View style={styles.positionRow}>
                        <Text style={styles.positionLabel}>Posição:</Text>
                        <TouchableOpacity
                          style={[styles.positionBtn, editingAd.position === 'top' && styles.positionBtnActive]}
                          onPress={() => setEditingAd({ ...editingAd, position: 'top' })}
                        >
                          <Text style={[styles.positionBtnText, editingAd.position === 'top' && styles.positionBtnTextActive]}>Topo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.positionBtn, editingAd.position === 'rotative' && styles.positionBtnActive]}
                          onPress={() => setEditingAd({ ...editingAd, position: 'rotative' })}
                        >
                          <Text style={[styles.positionBtnText, editingAd.position === 'rotative' && styles.positionBtnTextActive]}>Rotativo</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.dateRow}>
                        <View style={styles.dateField}>
                          <Text style={styles.dateLabel}>Início</Text>
                          <TouchableOpacity
                            style={styles.datePickerBtn}
                            onPress={() => showDatePickerFor('editStart', editingAd.start_date)}
                          >
                            <Text style={[styles.datePickerBtnText, !editingAd.start_date && { color: Colors.textMuted }]}>
                              {editingAd.start_date ? editingAd.start_date.substring(0, 10) : 'Selecionar'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.dateField}>
                          <Text style={styles.dateLabel}>Fim</Text>
                          <TouchableOpacity
                            style={styles.datePickerBtn}
                            onPress={() => showDatePickerFor('editEnd', editingAd.end_date)}
                          >
                            <Text style={[styles.datePickerBtnText, !editingAd.end_date && { color: Colors.textMuted }]}>
                              {editingAd.end_date ? editingAd.end_date.substring(0, 10) : 'Selecionar'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      {editingAd.image_url ? (
                        <Image source={{ uri: editingAd.image_url }} style={styles.adPreviewImage} contentFit="cover" />
                      ) : null}
                      <View style={{ height: 12 }} />
                      <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: '#22C55E' }, updateAd.isPending && { opacity: 0.7 }]}
                        onPress={handleSaveEditAd}
                        disabled={updateAd.isPending}
                      >
                        {updateAd.isPending ? (
                          <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                          <>
                            <Save size={16} color={Colors.white} />
                            <Text style={styles.submitText}>Guardar Alterações</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </ScrollView>
                    )
                  )}
                </View>
              </View>
            </Modal>
          </>
        )}

        {activeTab === 'fuel' && (
          <>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Preços de Combustível</Text>
              <Text style={styles.formHint}>
                Altere os preços e clique em Guardar para atualizar
              </Text>

              {fuelLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />
              ) : (
                fuelEdits.map(fuel => (
                  <View key={fuel.id} style={styles.fuelEditRow}>
                    <View style={styles.fuelEditIcon}>
                      <Fuel size={16} color={Colors.accent} />
                    </View>
                    <View style={styles.fuelEditContent}>
                      <Text style={styles.fuelEditLabel}>{fuel.fuel_type}</Text>
                      <View style={styles.fuelEditInputRow}>
                        <TextInput
                          style={styles.fuelPriceInput}
                          value={fuel.price}
                          onChangeText={(val) => updateFuelEdit(fuel.id, 'price', val)}
                          keyboardType="decimal-pad"
                          placeholder="0.000"
                          placeholderTextColor={Colors.textMuted}
                        />
                        <Text style={styles.fuelUnit}>€/L</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={[styles.submitBtn, styles.saveBtn, (!fuelDirty || saveFuelPrices.isPending) && { opacity: 0.5 }]}
                onPress={handleSaveFuels}
                disabled={!fuelDirty || saveFuelPrices.isPending}
              >
                {saveFuelPrices.isPending ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Save size={16} color={Colors.white} />
                    <Text style={styles.submitText}>Guardar Preços</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {activeTab === 'notifications' && (
          <>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Enviar Notificação Push</Text>
              <Text style={styles.formHint}>
                Envia uma notificação para todos os utilizadores com a app instalada
              </Text>
              <TextInput
                style={styles.formInput}
                placeholder="Título da notificação"
                placeholderTextColor={Colors.textMuted}
                value={notifTitle}
                onChangeText={setNotifTitle}
              />
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder="Mensagem"
                placeholderTextColor={Colors.textMuted}
                value={notifBody}
                onChangeText={setNotifBody}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <TextInput
                style={styles.formInput}
                placeholder="Link (opcional) - ex: https://..."
                placeholderTextColor={Colors.textMuted}
                value={notifLinkUrl}
                onChangeText={setNotifLinkUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <TouchableOpacity
                style={[styles.submitBtn, styles.pushBtn, sendNotification.isPending && { opacity: 0.7 }]}
                onPress={handleSendNotification}
                disabled={sendNotification.isPending}
              >
                {sendNotification.isPending ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Send size={16} color={Colors.white} />
                    <Text style={styles.submitText}>Enviar Notificação</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {(notifications ?? []).length > 0 && (
              <>
                <Text style={styles.sectionCount}>Histórico de notificações</Text>
                {(notifications ?? []).map(n => (
                  <View key={n.id} style={styles.listItem}>
                    <View style={styles.notifIcon}>
                      <Bell size={14} color={Colors.primary} />
                    </View>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemTitle}>{n.title}</Text>
                      <Text style={styles.listItemSub} numberOfLines={2}>{n.body}</Text>
                      {n.link_url ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Link size={10} color={Colors.primary} />
                          <Text style={{ fontSize: 10, color: Colors.primary }} numberOfLines={1}>{n.link_url}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.notifMeta}>
                        {n.recipients_count} destinatários · {n.opened_count ?? 0} aberturas · {new Date(n.sent_at).toLocaleDateString('pt-PT')}
                      </Text>
                    </View>
                    <View style={styles.adActions}>
                      <TouchableOpacity
                        style={[styles.editBtn, { backgroundColor: '#EBF5FB' }]}
                        onPress={() => setViewingNotifStats(n)}
                      >
                        <BarChart3 size={14} color="#2980B9" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteNotification(n.id, n.title)}
                      >
                        <Trash2 size={14} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            <Modal visible={!!viewingNotifStats} animationType="fade" transparent onRequestClose={() => setViewingNotifStats(null)}>
              <View style={styles.editModalOverlay}>
                <View style={styles.editModalContent}>
                  <View style={styles.editModalHeader}>
                    <Text style={styles.editModalTitle}>Estatísticas da Notificação</Text>
                    <TouchableOpacity onPress={() => setViewingNotifStats(null)}>
                      <X size={20} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                  {viewingNotifStats && (
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 16 }}>
                        {viewingNotifStats.title}
                      </Text>
                      <View style={styles.adStatsGrid}>
                        <View style={styles.adStatCard}>
                          <Send size={20} color="#3498DB" />
                          <Text style={styles.adStatNumber}>{viewingNotifStats.recipients_count}</Text>
                          <Text style={styles.adStatLabel}>Destinatários</Text>
                        </View>
                        <View style={styles.adStatCard}>
                          <Eye size={20} color="#27AE60" />
                          <Text style={styles.adStatNumber}>{viewingNotifStats.opened_count ?? 0}</Text>
                          <Text style={styles.adStatLabel}>Aberturas</Text>
                        </View>
                      </View>
                      <View style={{ marginTop: 12 }}>
                        <View style={styles.adStatRow}>
                          <Text style={styles.adStatRowLabel}>Mensagem</Text>
                          <Text style={[styles.adStatRowValue, { flex: 1 }]} numberOfLines={3}>{viewingNotifStats.body}</Text>
                        </View>
                        {viewingNotifStats.link_url ? (
                          <View style={styles.adStatRow}>
                            <Text style={styles.adStatRowLabel}>Link</Text>
                            <Text style={[styles.adStatRowValue, { color: Colors.primary }]} numberOfLines={1}>{viewingNotifStats.link_url}</Text>
                          </View>
                        ) : null}
                        <View style={styles.adStatRow}>
                          <Text style={styles.adStatRowLabel}>Data de Envio</Text>
                          <Text style={styles.adStatRowValue}>
                            {new Date(viewingNotifStats.sent_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: '#2563EB', marginTop: 16 }]}
                        onPress={() => generateNotifStatsPdf(viewingNotifStats)}
                      >
                        <Download size={16} color={Colors.white} />
                        <Text style={styles.submitText}>Exportar PDF</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </Modal>
          </>
        )}

        {activeTab === 'juntas' && (
          <>
            <TouchableOpacity
              style={styles.collapsibleHeader}
              onPress={() => setShowAddJunta(!showAddJunta)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PlusCircle size={16} color={Colors.primary} />
                <Text style={styles.collapsibleHeaderText}>Adicionar Junta</Text>
              </View>
              {showAddJunta ? (
                <ChevronUp size={16} color={Colors.textMuted} />
              ) : (
                <ChevronDown size={16} color={Colors.textMuted} />
              )}
            </TouchableOpacity>

            {showAddJunta && (
              <View style={styles.formCard}>
                <Text style={styles.formHint}>
                  Selecione o concelho e a freguesia, depois adicione os emails.
                </Text>
                <Text style={styles.dateLabel}>Concelho</Text>
                {CONCELHOS.map(c => (
                  <View key={c.name}>
                    <TouchableOpacity
                      style={[styles.juntaConcelhoRow, expandedJuntaConcelho === c.name && { backgroundColor: Colors.primaryPale }]}
                      onPress={() => setExpandedJuntaConcelho(expandedJuntaConcelho === c.name ? null : c.name)}
                    >
                      <Text style={styles.juntaConcelhoName}>{c.name}</Text>
                      <ChevronDown size={12} color={Colors.textMuted} style={{ transform: [{ rotate: expandedJuntaConcelho === c.name ? '180deg' : '0deg' }] }} />
                    </TouchableOpacity>
                    {expandedJuntaConcelho === c.name && (
                      <View style={{ paddingLeft: 12, backgroundColor: '#FAFAFA' }}>
                        {c.freguesias.map(f => {
                          const alreadyExists = juntas?.some(j => j.freguesia === f);
                          return (
                            <TouchableOpacity
                              key={f}
                              style={[styles.juntaFreguesiaItem, newJuntaFreguesia === f && { backgroundColor: Colors.primaryPale }, alreadyExists && { opacity: 0.4 }]}
                              onPress={() => {
                                if (alreadyExists) {
                                  Alert.alert('Aviso', `${f} já está registada.`);
                                  return;
                                }
                                setNewJuntaConcelho(c.name);
                                setNewJuntaFreguesia(f);
                                setExpandedJuntaConcelho(null);
                              }}
                            >
                              <Text style={[styles.juntaFreguesiaText, newJuntaFreguesia === f && { color: Colors.primary, fontWeight: '600' as const }]}>
                                {f} {alreadyExists ? '(registada)' : ''}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ))}

                {newJuntaFreguesia && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.formHint}>Freguesia selecionada: <Text style={{ fontWeight: '700' as const, color: Colors.text }}>{newJuntaFreguesia}</Text> ({newJuntaConcelho})</Text>
                    <Text style={[styles.dateLabel, { marginTop: 10 }]}>Emails</Text>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                      <TextInput
                        style={[styles.formInput, { flex: 1 }]}
                        placeholder="email@exemplo.com"
                        placeholderTextColor={Colors.textMuted}
                        value={newJuntaEmailInput}
                        onChangeText={setNewJuntaEmailInput}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <TouchableOpacity
                        style={[styles.submitBtn, { paddingHorizontal: 14, paddingVertical: 12, marginTop: 0 }]}
                        onPress={() => {
                          const email = newJuntaEmailInput.trim();
                          if (!email || !email.includes('@')) {
                            Alert.alert('Erro', 'Insira um email válido');
                            return;
                          }
                          if (newJuntaEmails.includes(email)) {
                            Alert.alert('Erro', 'Email já adicionado');
                            return;
                          }
                          setNewJuntaEmails(prev => [...prev, email]);
                          setNewJuntaEmailInput('');
                        }}
                      >
                        <Plus size={16} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                    {newJuntaEmails.map((email, idx) => (
                      <View key={idx} style={styles.juntaEmailTag}>
                        <Mail size={12} color={Colors.primary} />
                        <Text style={styles.juntaEmailTagText}>{email}</Text>
                        <TouchableOpacity onPress={() => setNewJuntaEmails(prev => prev.filter((_, i) => i !== idx))}>
                          <X size={14} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={[styles.submitBtn, { backgroundColor: '#22C55E', marginTop: 12 }, (createJunta.isPending || newJuntaEmails.length === 0) && { opacity: 0.5 }]}
                      onPress={async () => {
                        if (!newJuntaFreguesia || !newJuntaConcelho || newJuntaEmails.length === 0) {
                          Alert.alert('Erro', 'Preencha todos os campos');
                          return;
                        }
                        try {
                          await createJunta.mutateAsync({ freguesia: newJuntaFreguesia, concelho: newJuntaConcelho, emails: newJuntaEmails });
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          Alert.alert('Sucesso', `Junta de ${newJuntaFreguesia} adicionada`);
                          setNewJuntaFreguesia(null);
                          setNewJuntaConcelho(null);
                          setNewJuntaEmails([]);
                          setNewJuntaEmailInput('');
                          setShowAddJunta(false);
                        } catch (error: any) {
                          Alert.alert('Erro', error.message);
                        }
                      }}
                      disabled={createJunta.isPending || newJuntaEmails.length === 0}
                    >
                      {createJunta.isPending ? (
                        <ActivityIndicator color={Colors.white} size="small" />
                      ) : (
                        <>
                          <Save size={16} color={Colors.white} />
                          <Text style={styles.submitText}>Guardar Junta</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.sectionCount}>{juntas?.length ?? 0} juntas registadas</Text>
            {juntasLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
            ) : (
              (juntas ?? []).map(junta => (
                <View key={junta.id} style={styles.juntaCard}>
                  <View style={styles.juntaCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.juntaCardTitle}>{junta.freguesia}</Text>
                      <Text style={styles.juntaCardSubtitle}>{junta.concelho}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => {
                          setEditingJunta({ ...junta });
                          setJuntaNewEmail('');
                        }}
                      >
                        <Edit3 size={14} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => {
                          Alert.alert('Remover Junta', `Remover ${junta.freguesia}?`, [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Remover',
                              style: 'destructive',
                              onPress: () => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                deleteJunta.mutate(junta.id);
                              },
                            },
                          ]);
                        }}
                      >
                        <Trash2 size={14} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.juntaEmailsContainer}>
                    {junta.emails.length === 0 ? (
                      <Text style={{ fontSize: 11, color: Colors.textMuted, fontStyle: 'italic' as const }}>Sem emails configurados</Text>
                    ) : (
                      junta.emails.map((email, idx) => (
                        <View key={idx} style={styles.juntaEmailTag}>
                          <Mail size={11} color={Colors.primary} />
                          <Text style={styles.juntaEmailTagText}>{email}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              ))
            )}

            <Modal visible={!!editingJunta} animationType="fade" transparent onRequestClose={() => setEditingJunta(null)}>
              <KeyboardAvoidingView style={styles.editModalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.editModalContent}>
                  <View style={styles.editModalHeader}>
                    <Text style={styles.editModalTitle}>Editar Junta</Text>
                    <TouchableOpacity onPress={() => setEditingJunta(null)}>
                      <X size={20} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                  {editingJunta && (
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '700' as const, color: Colors.text }}>{editingJunta.freguesia}</Text>
                      <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 16 }}>{editingJunta.concelho}</Text>

                      <Text style={styles.dateLabel}>Emails</Text>
                      {editingJunta.emails.map((email, idx) => (
                        <View key={idx} style={[styles.juntaEmailTag, { marginBottom: 4 }]}>
                          <Mail size={12} color={Colors.primary} />
                          <Text style={[styles.juntaEmailTagText, { flex: 1 }]}>{email}</Text>
                          <TouchableOpacity onPress={() => {
                            setEditingJunta({
                              ...editingJunta,
                              emails: editingJunta.emails.filter((_, i) => i !== idx),
                            });
                          }}>
                            <X size={14} color={Colors.danger} />
                          </TouchableOpacity>
                        </View>
                      ))}

                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 8 }}>
                        <TextInput
                          style={[styles.formInput, { flex: 1 }]}
                          placeholder="Novo email"
                          placeholderTextColor={Colors.textMuted}
                          value={juntaNewEmail}
                          onChangeText={setJuntaNewEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                        <TouchableOpacity
                          style={[styles.submitBtn, { paddingHorizontal: 14, paddingVertical: 12, marginTop: 0 }]}
                          onPress={() => {
                            const email = juntaNewEmail.trim();
                            if (!email || !email.includes('@')) {
                              Alert.alert('Erro', 'Insira um email válido');
                              return;
                            }
                            if (editingJunta.emails.includes(email)) {
                              Alert.alert('Erro', 'Email já existe');
                              return;
                            }
                            setEditingJunta({ ...editingJunta, emails: [...editingJunta.emails, email] });
                            setJuntaNewEmail('');
                          }}
                        >
                          <Plus size={16} color={Colors.white} />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: '#22C55E', marginTop: 16 }, updateJunta.isPending && { opacity: 0.7 }]}
                        onPress={async () => {
                          if (!editingJunta) return;
                          try {
                            await updateJunta.mutateAsync({ id: editingJunta.id, emails: editingJunta.emails });
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Sucesso', 'Junta atualizada');
                            setEditingJunta(null);
                          } catch (error: any) {
                            Alert.alert('Erro', error.message);
                          }
                        }}
                        disabled={updateJunta.isPending}
                      >
                        {updateJunta.isPending ? (
                          <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                          <>
                            <Save size={16} color={Colors.white} />
                            <Text style={styles.submitText}>Guardar Alterações</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </KeyboardAvoidingView>
            </Modal>
          </>
        )}

        {activeTab === 'stats' && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.adminStatCard}>
                <Users size={22} color="#6366F1" />
                <Text style={styles.adminStatNumber}>{users?.length ?? 0}</Text>
                <Text style={styles.adminStatLabel}>Utilizadores</Text>
              </View>
              <View style={styles.adminStatCard}>
                <FileText size={22} color="#3B82F6" />
                <Text style={styles.adminStatNumber}>{posts?.length ?? 0}</Text>
                <Text style={styles.adminStatLabel}>Publicações</Text>
              </View>
              <View style={styles.adminStatCard}>
                <Heart size={22} color="#EF4444" />
                <Text style={styles.adminStatNumber}>{totalReactions}</Text>
                <Text style={styles.adminStatLabel}>Reações</Text>
              </View>
              <View style={styles.adminStatCard}>
                <MessageCircle size={22} color="#F59E0B" />
                <Text style={styles.adminStatNumber}>{totalComments}</Text>
                <Text style={styles.adminStatLabel}>Comentários</Text>
              </View>
            </View>

            <Text style={styles.statsSubtitle}>Publicações por Categoria</Text>
            {Object.entries(categoryStats).map(([cat, count]) => {
              const catColor = cat === 'ocorrencias' ? '#E74C3C' : cat === 'opstop' ? '#E67E22' : cat === 'anomalias' ? '#F1C40F' : '#3498DB';
              const catLabel = cat === 'ocorrencias' ? 'Ocorrências' : cat === 'opstop' ? 'Op. Stop' : cat === 'anomalias' ? 'Anomalias' : 'Perdidos';
              const pct = Math.min(100, ((count as number) / Math.max(posts?.length ?? 1, 1)) * 100);
              return (
                <View key={cat} style={styles.categoryStatRow}>
                  <View style={[styles.categoryStatDot, { backgroundColor: catColor }]} />
                  <Text style={styles.categoryStatLabel}>{catLabel}</Text>
                  <View style={styles.categoryStatBar}>
                    <View style={[styles.categoryStatBarFill, { width: `${pct}%`, backgroundColor: catColor }]} />
                  </View>
                  <Text style={styles.categoryStatCount}>{count as number}</Text>
                </View>
              );
            })}

            <Text style={[styles.statsSubtitle, { marginTop: 20 }]}>Anúncios</Text>
            <View style={styles.adsStatsCard}>
              <View style={styles.adsStatItem}>
                <Text style={styles.adsStatNumber}>{ads?.filter(a => a.active).length ?? 0}</Text>
                <Text style={styles.adsStatLabel}>Ativos</Text>
              </View>
              <View style={styles.adsStatDivider} />
              <View style={styles.adsStatItem}>
                <Text style={styles.adsStatNumber}>{ads?.filter(a => !a.active).length ?? 0}</Text>
                <Text style={styles.adsStatLabel}>Inativos</Text>
              </View>
              <View style={styles.adsStatDivider} />
              <View style={styles.adsStatItem}>
                <Text style={styles.adsStatNumber}>{ads?.length ?? 0}</Text>
                <Text style={styles.adsStatLabel}>Total</Text>
              </View>
            </View>

            <Text style={[styles.statsSubtitle, { marginTop: 20 }]}>Notificações</Text>
            <View style={styles.adsStatsCard}>
              <View style={styles.adsStatItem}>
                <Text style={styles.adsStatNumber}>{notifications?.length ?? 0}</Text>
                <Text style={styles.adsStatLabel}>Enviadas</Text>
              </View>
              <View style={styles.adsStatDivider} />
              <View style={styles.adsStatItem}>
                <Text style={styles.adsStatNumber}>
                  {notifications?.reduce((sum, n) => sum + (n.recipients_count ?? 0), 0) ?? 0}
                </Text>
                <Text style={styles.adsStatLabel}>Destinatários</Text>
              </View>
            </View>

            <Text style={[styles.statsSubtitle, { marginTop: 20 }]}>Registos por Dia</Text>
            {registrationsByDay.length > 0 ? (
              <View style={styles.registrationsList}>
                {registrationsByDay.map(item => (
                  <View key={item.date} style={styles.registrationRow}>
                    <Text style={styles.registrationDate}>{item.date}</Text>
                    <View style={styles.registrationBarContainer}>
                      <View style={[styles.registrationBar, { width: `${Math.min(100, (item.count / Math.max(...registrationsByDay.map(r => r.count), 1)) * 100)}%` }]} />
                    </View>
                    <Text style={styles.registrationCount}>{item.count}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ fontSize: 12, color: Colors.textMuted }}>Sem dados de registo</Text>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={!!datePickerTarget && !datePickerTarget.startsWith('edit')}
        animationType="fade"
        transparent
        onRequestClose={() => setDatePickerTarget(null)}
      >
        <View style={styles.editModalOverlay}>
          <View style={[styles.editModalContent, { maxHeight: '60%' }]}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Selecionar Data</Text>
              <TouchableOpacity onPress={() => setDatePickerTarget(null)}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerRow}>
              <View style={styles.datePickerCol}>
                <Text style={styles.datePickerColLabel}>Dia</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator nestedScrollEnabled>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.datePickerItem, datePickerDay === d && styles.datePickerItemActive]}
                      onPress={() => setDatePickerDay(d)}
                    >
                      <Text style={[styles.datePickerItemText, datePickerDay === d && styles.datePickerItemTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.datePickerCol}>
                <Text style={styles.datePickerColLabel}>Mês</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator nestedScrollEnabled>
                  {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.datePickerItem, datePickerMonth === i && styles.datePickerItemActive]}
                      onPress={() => setDatePickerMonth(i)}
                    >
                      <Text style={[styles.datePickerItemText, datePickerMonth === i && styles.datePickerItemTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.datePickerCol}>
                <Text style={styles.datePickerColLabel}>Ano</Text>
                <ScrollView style={styles.datePickerScroll} showsVerticalScrollIndicator nestedScrollEnabled>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 1).map(y => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.datePickerItem, datePickerYear === y && styles.datePickerItemActive]}
                      onPress={() => setDatePickerYear(y)}
                    >
                      <Text style={[styles.datePickerItemText, datePickerYear === y && styles.datePickerItemTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <Text style={styles.datePickerPreview}>
              {`${String(datePickerDay).padStart(2, '0')}/${String(datePickerMonth + 1).padStart(2, '0')}/${datePickerYear}`}
            </Text>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#22C55E', marginTop: 8 }]}
              onPress={handleDatePickerConfirm}
            >
              <Check size={16} color={Colors.white} />
              <Text style={styles.submitText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  denied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    gap: 12,
    padding: 40,
  },
  topBar: {
    backgroundColor: Colors.white,
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  adminIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  topBarSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarScroll: {
    backgroundColor: Colors.white,
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tabBarContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F0F1F5',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabBadge: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  tabBadgeTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  sectionCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500' as const,
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  listItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  listItemSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 6,
    alignItems: 'center',
  },
  postCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F0F1F5',
  },
  postCountText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  userActions: {
    alignItems: 'center',
    gap: 4,
  },
  userExpandedInfo: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  userStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
  },
  userStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  userStatValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  userStatLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F0F1F5',
  },
  roleBadgeAdmin: {
    backgroundColor: Colors.primaryPale,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  roleBadgeTextAdmin: {
    color: Colors.primary,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  postItem: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  postCardImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  postCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  postCategoryText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  postCardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  postCardMetaText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  postExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F0F1F5',
  },
  postExpanded: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  expandBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F1F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsSection: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  commentsSectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  commentsContainer: {
    gap: 6,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  commentInfo: {
    flex: 1,
    minWidth: 0,
  },
  commentAuthor: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  commentText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  commentDate: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },
  commentDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  noCommentsText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 10,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  formHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    gap: 6,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: '#22C55E',
  },
  pushBtn: {
    backgroundColor: '#2563EB',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  imagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryPale,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  orText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  positionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  positionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F0F1F5',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  positionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  positionBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  positionBtnTextActive: {
    color: Colors.white,
  },
  positionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  positionTagText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  adPreview: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  adPreviewImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
  },
  adItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  adItemImage: {
    width: 70,
    height: 50,
    borderRadius: 10,
    marginRight: 10,
  },
  adItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  adItemTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  adMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  adDateText: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  adToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  adToggleLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  adActions: {
    alignItems: 'center',
    gap: 4,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  notifMeta: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  fuelEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  fuelEditIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(230, 126, 34, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fuelEditContent: {
    flex: 1,
  },
  fuelEditLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  fuelEditInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fuelPriceInput: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.accent,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  fuelUnit: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  adminStatCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  adminStatNumber: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  adminStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  statsSubtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 10,
    marginTop: 4,
  },
  categoryStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryStatDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryStatLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    width: 90,
  },
  categoryStatBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F1F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryStatBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryStatCount: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    width: 30,
    textAlign: 'right',
  },
  adsStatsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  adsStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  adsStatNumber: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  adsStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  adsStatDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  datePickerBtn: {
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  datePickerBtnText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  datePickerCol: {
    flex: 1,
    alignItems: 'center',
  },
  datePickerColLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  datePickerScroll: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
  },
  datePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  datePickerItemActive: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  datePickerItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  datePickerItemTextActive: {
    color: Colors.white,
    fontWeight: '700' as const,
  },
  datePickerPreview: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 12,
  },
  registrationsList: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 6,
  },
  registrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registrationDate: {
    fontSize: 11,
    color: Colors.textSecondary,
    width: 75,
    fontWeight: '500' as const,
  },
  registrationBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F1F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  registrationBar: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  registrationCount: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
    width: 24,
    textAlign: 'right',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  collapsibleHeaderText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  adStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  adStatCard: {
    flex: 1,
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  adStatNumber: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  adStatLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  adStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  adStatRowLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  adStatRowValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  juntaConcelhoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 2,
  },
  juntaConcelhoName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  juntaFreguesiaItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  juntaFreguesiaText: {
    fontSize: 13,
    color: Colors.text,
  },
  juntaCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  juntaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  juntaCardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  juntaCardSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  juntaEmailsContainer: {
    gap: 4,
  },
  juntaEmailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EBF5FB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  juntaEmailTagText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500' as const,
  },
});
