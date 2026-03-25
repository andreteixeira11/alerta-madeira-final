import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
  TextInput, Switch, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  LogOut, Shield, MessageCircle, Heart, FileText, ChevronRight, Edit3,
  Bell, Settings, Save, X, Lock, Camera, ChevronDown, BookOpen,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileStats, useUserPosts } from '@/hooks/usePosts';
import PostCard from '@/components/PostCard';
import { supabase } from '@/lib/supabase';
import { uploadImageToSupabase } from '@/utils/uploadImage';
import * as Haptics from 'expo-haptics';

const NOTIF_PREFS_KEY = 'notification_preferences';

interface NotifPrefs {
  enabled: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  enabled: true,
};



export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, isAdmin, logout, refetchProfile } = useAuth();
  const { data: stats } = useProfileStats(user?.id);
  const { data: userPosts, isLoading: postsLoading } = useUserPosts(user?.id);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [showSettings, setShowSettings] = useState(false);
  const [showPosts, setShowPosts] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTIF_PREFS_KEY).then(stored => {
      if (stored) {
        try { setNotifPrefs(JSON.parse(stored)); } catch { /* ignore */ }
      }
    });
  }, []);

  const updateNotifPref = useCallback(async (key: keyof NotifPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [notifPrefs]);

  const handleEditName = useCallback(() => {
    setNewName(profile?.name ?? '');
    setEditingName(true);
  }, [profile]);

  const handleSaveName = useCallback(async () => {
    if (!newName.trim() || !user?.id) return;
    setSavingName(true);
    try {
      const { error } = await supabase.from('users').update({ name: newName.trim() }).eq('id', user.id);
      if (error) throw error;
      await supabase.from('posts').update({ user_name: newName.trim() }).eq('user_id', user.id);
      await refetchProfile();
      setEditingName(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Nome atualizado com sucesso');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao atualizar nome');
    } finally {
      setSavingName(false);
    }
  }, [newName, user, refetchProfile]);

  const handleChangePassword = useCallback(async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As palavras-passe não coincidem');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A palavra-passe deve ter pelo menos 6 caracteres');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Palavra-passe alterada com sucesso');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao alterar palavra-passe');
    } finally {
      setChangingPassword(false);
    }
  }, [newPassword, confirmPassword]);

  const handlePickAvatar = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Necessária', 'Precisamos de acesso à galeria.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setUploadingAvatar(true);

      try {
        if (!user?.id) {
          setUploadingAvatar(false);
          return;
        }

        const fileName = `avatar_${user.id}_${Date.now()}.jpg`;
        const filePath = `avatars/${fileName}`;

        const avatarUrl = await uploadImageToSupabase(
          'profilepicture',
          filePath,
          asset.uri,
          asset.base64,
        );

        if (!avatarUrl) {
          console.log('[Profile] Avatar upload failed');
          Alert.alert('Aviso', 'Erro ao fazer upload da fotografia.\n\nVerifique se o bucket "profilepicture" existe no Supabase e tem políticas RLS para INSERT/SELECT.');
          setUploadingAvatar(false);
          return;
        }

        await supabase.from('users').update({ avatar: avatarUrl }).eq('id', user.id);
        await supabase.from('posts').update({ user_avatar: avatarUrl }).eq('user_id', user.id);
        await refetchProfile();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Sucesso', 'Fotografia de perfil atualizada');
      } catch (uploadErr: any) {
        console.log('[Profile] Avatar exception:', uploadErr.message);
        Alert.alert('Erro', 'Erro ao atualizar fotografia');
      } finally {
        setUploadingAvatar(false);
      }
    } catch (err: any) {
      console.log('[Profile] Image picker error:', err.message);
      Alert.alert('Erro', 'Não foi possível abrir a galeria');
      setUploadingAvatar(false);
    }
  }, [user, refetchProfile]);

  const handleLogout = useCallback(() => {
    Alert.alert('Terminar Sessão', 'Tem a certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          logout();
        },
      },
    ]);
  }, [logout]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingAvatar} activeOpacity={0.7}>
          <View style={styles.avatarContainer}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>
                  {(profile?.name ?? 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Camera size={14} color={Colors.white} />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {editingName ? (
          <View style={styles.editNameContainer}>
            <TextInput
              style={styles.editNameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Novo nome"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            <View style={styles.editNameActions}>
              <TouchableOpacity style={styles.saveNameBtn} onPress={handleSaveName} disabled={savingName}>
                {savingName ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Save size={16} color={Colors.white} />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditingName(false)}>
                <X size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={handleEditName} style={styles.nameRow}>
            <Text style={styles.displayName}>{profile?.name ?? 'Utilizador'}</Text>
            <Edit3 size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        <Text style={styles.email}>{profile?.email ?? user?.email ?? ''}</Text>
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Shield size={12} color={Colors.white} />
            <Text style={styles.adminBadgeText}>Administrador</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <FileText size={18} color={Colors.primary} />
          <Text style={styles.statNumber}>{stats?.postsCount ?? 0}</Text>
          <Text style={styles.statLabel}>Publicações</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Heart size={18} color={Colors.danger} />
          <Text style={styles.statNumber}>{stats?.reactionsReceived ?? 0}</Text>
          <Text style={styles.statLabel}>Reações</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MessageCircle size={18} color={Colors.accent} />
          <Text style={styles.statNumber}>{stats?.commentsReceived ?? 0}</Text>
          <Text style={styles.statLabel}>Comentários</Text>
        </View>
      </View>

      {isAdmin && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => router.push('/admin' as any)}
          activeOpacity={0.8}
          testID="admin-panel-btn"
        >
          <Shield size={20} color={Colors.white} />
          <Text style={styles.adminButtonText}>Painel de Administração</Text>
          <ChevronRight size={18} color={Colors.white} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.settingsToggle}
        onPress={() => setShowSettings(!showSettings)}
        activeOpacity={0.8}
      >
        <Settings size={20} color={Colors.text} />
        <Text style={styles.settingsToggleText}>Definições</Text>
        <ChevronRight
          size={18}
          color={Colors.textMuted}
          style={{ transform: [{ rotate: showSettings ? '90deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {showSettings && (
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Notificações</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={18} color={Colors.primary} />
              <Text style={styles.settingText}>Ativar notificações</Text>
            </View>
            <Switch
              value={notifPrefs.enabled}
              onValueChange={(v) => updateNotifPref('enabled', v)}
              trackColor={{ false: '#E0E0E0', true: Colors.primarySoft }}
              thumbColor={notifPrefs.enabled ? Colors.primary : '#ccc'}
            />
          </View>

          <View style={styles.settingsDivider} />
          <Text style={styles.settingsSectionTitle}>Segurança</Text>

          <TouchableOpacity
            style={styles.settingItemBtn}
            onPress={() => setShowPasswordChange(!showPasswordChange)}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Lock size={18} color={Colors.primary} />
              <Text style={styles.settingText}>Alterar Palavra-passe</Text>
            </View>
            <ChevronDown
              size={16}
              color={Colors.textMuted}
              style={{ transform: [{ rotate: showPasswordChange ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {showPasswordChange && (
            <View style={styles.passwordInlineSection}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nova palavra-passe"
                placeholderTextColor={Colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirmar nova palavra-passe"
                placeholderTextColor={Colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.changePasswordBtn, changingPassword && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Save size={16} color={Colors.white} />
                    <Text style={styles.changePasswordBtnText}>Guardar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => router.push('/privacy-policy' as any)}
        activeOpacity={0.8}
      >
        <BookOpen size={20} color={Colors.text} />
        <Text style={styles.menuButtonText}>Regras e Política de Privacidade</Text>
        <ChevronRight size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.postsToggle}
        onPress={() => setShowPosts(!showPosts)}
        activeOpacity={0.8}
      >
        <FileText size={20} color={Colors.text} />
        <Text style={styles.postsToggleText}>As Minhas Publicações ({userPosts?.length ?? 0})</Text>
        <ChevronDown
          size={18}
          color={Colors.textMuted}
          style={{ transform: [{ rotate: showPosts ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {showPosts && (
        <View style={styles.postsSection}>
          {postsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
          ) : (userPosts ?? []).length === 0 ? (
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyText}>Ainda não publicou nada</Text>
            </View>
          ) : (
            (userPosts ?? []).map(post => (
              <PostCard
                key={post.id}
                post={{
                  ...post,
                  total_reactions:
                    (post.reactions_thumbs_up?.length ?? 0) +
                    (post.reactions_heart?.length ?? 0) +
                    (post.reactions_alert?.length ?? 0),
                  user_reactions: [],
                }}
              />
            ))
          )}
        </View>
      )}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
        testID="logout-btn"
      >
        <LogOut size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Terminar Sessão</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  editNameInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editNameActions: {
    flexDirection: 'row',
    gap: 6,
  },
  saveNameBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  email: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  adminButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  settingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingsToggleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  settingsSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 2,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 14,
  },
  settingItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  passwordInlineSection: {
    paddingTop: 10,
    gap: 10,
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  settingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  settingSubText: {
    fontSize: 14,
    color: Colors.text,
  },
  notifDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  passwordInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  changePasswordBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.danger,
  },
  postsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  postsToggleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  postsSection: {
    marginTop: 8,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
