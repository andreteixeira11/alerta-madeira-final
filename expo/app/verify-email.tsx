import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ShieldCheck, ArrowLeft, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { translateError } from '@/utils/translateError';
import { trpc } from '@/lib/trpc';
import { t } from '@/utils/i18n';

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email, type } = useLocalSearchParams<{ email: string; type: 'email_verification' | 'password_reset' }>();
  const verificationType = type || 'email_verification';

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const verifyMutation = trpc.email.verifyCode.useMutation();
  const sendCodeMutation = trpc.email.sendVerificationCode.useMutation();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleCodeChange = useCallback((text: string, index: number) => {
    const newCode = [...code];

    if (text.length > 1) {
      const pasted = text.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
      for (let i = 0; i < CODE_LENGTH; i++) {
        newCode[i] = pasted[i] || '';
      }
      setCode(newCode);
      const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const digit = text.replace(/[^0-9]/g, '');
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [code]);

  const handleKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  }, [code]);

  const handleVerify = useCallback(async () => {
    const fullCode = code.join('');
    if (fullCode.length !== CODE_LENGTH) {
      Alert.alert(t('common.error'), t('auth.enterFullCode'));
      return;
    }

    setIsVerifying(true);
    try {
      await verifyMutation.mutateAsync({
        email: email || '',
        code: fullCode,
        type: verificationType,
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (verificationType === 'password_reset') {
        router.replace({
          pathname: '/reset-password',
          params: { email, verified: 'true', code: fullCode },
        } as any);
      } else {
        Alert.alert(t('common.success'), t('auth.emailVerifiedSuccess'), [
          { text: t('common.continue'), onPress: () => router.replace('/' as any) },
        ]);
      }
    } catch (error: any) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shake();
      Alert.alert(t('common.error'), translateError(error));
    } finally {
      setIsVerifying(false);
    }
  }, [code, email, verificationType, verifyMutation, router, shake]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;

    try {
      await sendCodeMutation.mutateAsync({
        email: email || '',
        type: verificationType,
      });
      setResendCooldown(60);
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('auth.codeSentTitle'), t('auth.codeSentBody'));
    } catch (error: any) {
      Alert.alert(t('common.error'), translateError(error));
    }
  }, [resendCooldown, email, verificationType, sendCodeMutation]);

  const isPasswordReset = verificationType === 'password_reset';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={30} color={Colors.white} />
          </View>
          <Text style={styles.title}>{t('auth.verifyCode')}</Text>
          <Text style={styles.subtitle}>
            {isPasswordReset
              ? t('auth.verifyResetSubtitle')
              : t('auth.verifyCodeSubtitle')}
          </Text>
          <View style={styles.emailBadge}>
            <Text style={styles.emailBadgeText}>{email}</Text>
          </View>
        </View>

        <Animated.View style={[styles.codeContainer, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: CODE_LENGTH }).map((_, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.codeInput,
                code[index] ? styles.codeInputFilled : null,
              ]}
              value={code[index]}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? CODE_LENGTH : 1}
              selectTextOnFocus
              testID={`code-input-${index}`}
            />
          ))}
        </Animated.View>

        <TouchableOpacity
          style={[styles.verifyBtn, isVerifying && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={isVerifying}
          activeOpacity={0.85}
          testID="verify-submit"
        >
          {isVerifying ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.verifyBtnText}>{t('auth.verifyCode')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resendBtn, resendCooldown > 0 && styles.resendBtnDisabled]}
          onPress={handleResend}
          disabled={resendCooldown > 0 || sendCodeMutation.isPending}
          activeOpacity={0.7}
        >
          <RotateCcw size={16} color={resendCooldown > 0 ? Colors.textMuted : Colors.primary} />
          <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
            {sendCodeMutation.isPending
              ? t('auth.sending')
              : resendCooldown > 0
                ? t('auth.resendCodeIn', { seconds: resendCooldown })
                : t('auth.resendCode')}
          </Text>
        </TouchableOpacity>
      </Animated.View>
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
    marginBottom: 36,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  emailBadge: {
    marginTop: 12,
    backgroundColor: Colors.primaryPale,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  emailBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  codeInput: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryPale,
  },
  verifyBtn: {
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
  verifyBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
    paddingVertical: 10,
  },
  resendBtnDisabled: {
    opacity: 0.6,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  resendTextDisabled: {
    color: Colors.textMuted,
  },
});
