import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert, Animated, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { translateError } from '@/utils/translateError';
import { supabase } from '@/lib/supabase';
import { normalizeEmail, signInWithRetry } from '@/utils/auth';
import * as Haptics from 'expo-haptics';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const adminLoginMutation = useMutation({
    mutationFn: async ({ email: currentEmail, password: currentPassword }: { email: string; password: string }) => {
      const data = await signInWithRetry(currentEmail, currentPassword);
      const userId = data.user?.id;

      if (!userId) {
        throw new Error('Utilizador não encontrado');
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error('Erro ao verificar permissões');
      }

      if (userProfile?.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Esta conta não tem permissões de administrador.');
      }

      return data;
    },
  });

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleAdminLogin = useCallback(async () => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password.trim()) {
      setStatusMessage('Preencha o email e a palavra-passe para continuar.');
      shake();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setStatusMessage('A validar permissões de administrador...');

    try {
      await adminLoginMutation.mutateAsync({ email: normalizedEmail, password });
      setStatusMessage('Acesso de administrador confirmado.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/admin' as any);
    } catch (error: unknown) {
      const translatedError = translateError(error);
      setStatusMessage(translatedError);
      shake();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', translatedError);
    }
  }, [adminLoginMutation, email, password, router, shake]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.shieldOuter}>
              <View style={styles.shieldInner}>
                <ShieldCheck size={40} color={Colors.white} />
              </View>
            </View>
          </View>
          <Text style={styles.appName}>Administração</Text>
          <Text style={styles.subtitle}>Alerta Madeira · Backoffice</Text>
        </View>

        <Animated.View style={[styles.formSection, { transform: [{ translateX: shakeAnim }] }]}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Login de Administrador</Text>
            <Text style={styles.cardDesc}>
              Apenas contas com permissões de administrador podem aceder ao painel.
            </Text>

            <View style={styles.inputContainer}>
              <Mail size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email do administrador"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (statusMessage) {
                    setStatusMessage('');
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="admin-email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Palavra-passe"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (statusMessage) {
                    setStatusMessage('');
                  }
                }}
                secureTextEntry={!showPassword}
                testID="admin-password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? (
                  <EyeOff size={18} color={Colors.textMuted} />
                ) : (
                  <Eye size={18} color={Colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>

            {!!statusMessage && (
              <View style={styles.statusBanner} testID="admin-status-banner">
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginBtn, adminLoginMutation.isPending && styles.loginBtnDisabled]}
              onPress={() => {
                void handleAdminLogin();
              }}
              disabled={adminLoginMutation.isPending}
              activeOpacity={0.85}
              testID="admin-submit"
            >
              {adminLoginMutation.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <ShieldCheck size={18} color={Colors.white} />
                  <Text style={styles.loginBtnText}>Entrar como Admin</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.securityNote}>
            <View style={styles.securityDot} />
            <Text style={styles.securityText}>
              Acesso seguro · Apenas administradores autorizados
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    paddingTop: 60,
    paddingBottom: 10,
    alignSelf: 'flex-start',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 20,
  },
  logoContainer: {
    marginBottom: 18,
  },
  shieldOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(192, 57, 43, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  formSection: {
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 18,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.white,
  },
  eyeBtn: {
    padding: 4,
  },
  statusBanner: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  loginBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#27AE60',
  },
  securityText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
});
