import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { KeyRound, Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { translateError } from '@/utils/translateError';
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { t } from '@/utils/i18n';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, verified, code: resetCode } = useLocalSearchParams<{ email: string; verified: string; code: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const resetPasswordMutation = trpc.email.resetPassword.useMutation();

  const resetMutation = useMutation({
    mutationFn: async ({ userEmail, newPassword, otpCode }: { userEmail: string; newPassword: string; otpCode: string }) => {
      console.log('[ResetPassword] Resetting password for:', userEmail);
      
      try {
        await resetPasswordMutation.mutateAsync({
          email: userEmail,
          code: otpCode,
          newPassword,
        });
        return true;
      } catch (err: any) {
        console.log('[ResetPassword] Server reset error:', err.message);
        
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          return true;
        }
        
        throw new Error(err.message || t('auth.loginTemporarilyUnavailable'));
      }
    },
  });

  const handleReset = useCallback(async () => {
    if (!password.trim()) {
      Alert.alert(t('common.error'), t('auth.enterNewPassword'));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordMismatch'));
      return;
    }

    if (verified !== 'true' || !resetCode) {
      Alert.alert(t('common.error'), t('auth.verificationIncomplete'));
      return;
    }

    try {
      await resetMutation.mutateAsync({ userEmail: email || '', newPassword: password, otpCode: resetCode });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('common.success'), t('auth.passwordUpdated'), [
        { text: t('common.ok'), onPress: () => router.replace('/login' as any) },
      ]);
    } catch (error: any) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('common.error'), translateError(error));
    }
  }, [password, confirmPassword, verified, email, resetCode, resetMutation, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/login' as any)}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <KeyRound size={28} color={Colors.white} />
          </View>
          <View style={styles.verifiedBadge}>
            <CheckCircle size={14} color={Colors.success} />
            <Text style={styles.verifiedText}>{t('auth.emailVerified')}</Text>
          </View>
          <Text style={styles.title}>{t('auth.newPassword')}</Text>
          <Text style={styles.subtitle}>{t('auth.resetSubtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.newPassword')}
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              testID="reset-password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              {showPassword ? <EyeOff size={18} color={Colors.textMuted} /> : <Eye size={18} color={Colors.textMuted} />}
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.confirmPassword')}
              placeholderTextColor={Colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              testID="reset-confirm-password"
            />
          </View>

          <TouchableOpacity
            style={[styles.resetBtn, resetMutation.isPending && styles.btnDisabled]}
            onPress={handleReset}
            disabled={resetMutation.isPending}
            activeOpacity={0.85}
            testID="reset-submit"
          >
            {resetMutation.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.resetBtnText}>{t('auth.newPassword')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute' as const,
    top: 60,
    left: 28,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  form: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 54,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  eyeBtn: {
    padding: 4,
  },
  resetBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  resetBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});
