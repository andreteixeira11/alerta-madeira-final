import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { translateError } from '@/utils/translateError';
import { supabase } from '@/lib/supabase';
import { t } from '@/utils/i18n';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendCode = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('auth.enterEmail'));
      return;
    }

    setIsSending(true);
    try {
      // Supabase native: sends a 6-digit recovery code to the user's email.
      // Works in production — no custom backend needed.
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());

      if (error) {
        console.log('[ForgotPassword] Supabase reset error:', error.message);
        Alert.alert(t('common.error'), translateError(error));
        return;
      }

      console.log('[ForgotPassword] Recovery email sent to:', email.trim());
      // Navigate to the verification screen with the password_reset type.
      router.replace({
        pathname: '/verify-email',
        params: { email: email.trim(), type: 'password_reset' },
      } as any);
    } catch (err: any) {
      console.log('[ForgotPassword] Send error:', err?.message);
      Alert.alert(t('common.error'), translateError(err));
    } finally {
      setIsSending(false);
    }
  }, [email, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <KeyRound size={28} color={Colors.white} />
          </View>
          <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.forgotPasswordSubtitle')}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Mail size={18} color={Colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.email')}
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="forgot-email"
          />
        </View>

        <TouchableOpacity
          style={[styles.resetBtn, isSending && styles.btnDisabled]}
          onPress={handleSendCode}
          disabled={isSending}
          activeOpacity={0.85}
          testID="forgot-submit"
        >
          {isSending ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.resetBtnText}>{t('auth.sendCode')}</Text>
          )}
        </TouchableOpacity>
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
    marginBottom: 14,
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
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
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
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  resetBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
