import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { KeyRound, Lock, Eye, EyeOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { translateError } from '@/utils/translateError';
import { supabase } from '@/lib/supabase';
import { t } from '@/utils/i18n';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { verified } = useLocalSearchParams<{ email: string; verified: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

    setIsUpdating(true);
    try {
      // verifyOtp({ type: 'recovery' }) already established a session on the
      // previous screen. We just update the user's password with that session.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.log('[ResetPassword] No active recovery session:', sessionError?.message);
        Alert.alert(t('common.error'), t('auth.invalidResetLink'));
        setIsUpdating(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        console.log('[ResetPassword] updateUser error:', updateError.message);
        Alert.alert(t('common.error'), translateError(updateError));
        setIsUpdating(false);
        return;
      }

      // Sign out so the user logs in with the new password.
      await supabase.auth.signOut();

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(t('common.success'), t('auth.resetPasswordSuccess'), [
        { text: t('common.ok'), onPress: () => router.replace('/login' as any) },
      ]);
    } catch (err: any) {
      console.log('[ResetPassword] Exception:', err?.message);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('common.error'), translateError(err));
    } finally {
      setIsUpdating(false);
    }
  }, [password, confirmPassword, router]);

  // If the user lands here without a verified recovery session, send them back.
  if (!verified) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centeredContent}>
          <View style={styles.errorCircle}>
            <KeyRound size={32} color={Colors.primary} />
          </View>
          <Text style={styles.errorTitle}>{t('common.error')}</Text>
          <Text style={styles.errorMessage}>{t('auth.invalidResetLink')}</Text>
          <TouchableOpacity
            style={styles.backToForgotBtn}
            onPress={() => router.replace('/forgot-password' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.backToForgotText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/login' as any)}>
          <KeyRound size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <KeyRound size={28} color={Colors.white} />
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
            style={[styles.resetBtn, isUpdating && styles.btnDisabled]}
            onPress={handleReset}
            disabled={isUpdating}
            activeOpacity={0.85}
            testID="reset-submit"
          >
            {isUpdating ? (
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
  centeredContent: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 24,
    lineHeight: 20,
  },
  backToForgotBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToForgotText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
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
