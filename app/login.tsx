import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert, Animated, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, FileText, MessageCircle } from 'lucide-react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { translateError } from '@/utils/translateError';
import * as Haptics from 'expo-haptics';

const REMEMBER_KEY = 'remember_email';
const REMEMBER_PASS_KEY = 'remember_pass';

export default function LoginScreen() {
  const router = useRouter();
  const { loginMutation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    AsyncStorage.getItem(REMEMBER_KEY).then(saved => {
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
        AsyncStorage.getItem(REMEMBER_PASS_KEY).then(pass => {
          if (pass) setPassword(pass);
        });
      }
    });
  }, []);

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      await loginMutation.mutateAsync({ email: email.trim(), password });
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_KEY, email.trim());
        await AsyncStorage.setItem(REMEMBER_PASS_KEY, password);
      } else {
        await AsyncStorage.removeItem(REMEMBER_KEY);
        await AsyncStorage.removeItem(REMEMBER_PASS_KEY);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      shake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', translateError(error));
    }
  }, [email, password, rememberMe, loginMutation, shake]);

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
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
          <Text style={styles.appName}>Alerta Madeira</Text>
          <Text style={styles.subtitle}>Proteje a Comunidade! Publica já!</Text>
        </View>

        <Animated.View style={[styles.formSection, { transform: [{ translateX: shakeAnim }] }]}>
          <View style={styles.inputContainer}>
            <Mail size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="login-email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Palavra-passe"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              testID="login-password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              {showPassword ? <EyeOff size={18} color={Colors.textMuted} /> : <Eye size={18} color={Colors.textMuted} />}
            </TouchableOpacity>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Memorizar dados</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/forgot-password' as any)}>
              <Text style={styles.forgotText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loginMutation.isPending && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
            activeOpacity={0.85}
            testID="login-submit"
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.loginBtnText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/register' as any)}>
              <Text style={styles.registerLink}>Criar conta</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.adminLoginRow}
            onPress={() => router.push('/admin-login' as any)}
          >
            <ShieldCheck size={14} color={Colors.textMuted} />
            <Text style={styles.adminLoginText}>Acesso Administração</Text>
          </TouchableOpacity>

          <View style={styles.publicLinksRow}>
            <TouchableOpacity
              style={styles.publicLink}
              onPress={() => router.push('/privacy-policy' as any)}
            >
              <FileText size={13} color={Colors.textMuted} />
              <Text style={styles.publicLinkText}>Política de Privacidade</Text>
            </TouchableOpacity>
            <View style={styles.linkDivider} />
            <TouchableOpacity
              style={styles.publicLink}
              onPress={() => router.push('/contacts' as any)}
            >
              <MessageCircle size={13} color={Colors.textMuted} />
              <Text style={styles.publicLinkText}>Contactos</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 60,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  formSection: {
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  rememberText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  loginBtn: {
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
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  registerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700' as const,
  },
  adminLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  adminLoginText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  publicLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  publicLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  publicLinkText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  linkDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
  },
});
