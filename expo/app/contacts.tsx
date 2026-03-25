import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Mail, Globe, Phone, MessageCircle, Send } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { translateError } from '@/utils/translateError';
import * as Haptics from 'expo-haptics';
import { trpc } from '@/lib/trpc';

export default function ContactsScreen() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const sendEmail = trpc.email.sendNotification.useMutation();

  const handleSubmit = useCallback(async () => {
    if (!subject.trim() || !email.trim() || !content.trim()) {
      Alert.alert('Erro', 'Preencha os campos obrigatórios: assunto, email e conteúdo');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Erro', 'Insira um email válido');
      return;
    }

    setSending(true);
    try {
      const messageBody = `Assunto: ${subject.trim()}\nTelemóvel: ${phone.trim() || 'Não indicado'}\nEmail: ${email.trim()}\n\nConteúdo:\n${content.trim()}`;

      await sendEmail.mutateAsync({
        to: ['geral@alertamadeira.com'],
        subject: `Contacto App - ${subject.trim()}`,
        message: messageBody,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'A sua mensagem foi enviada com sucesso! Entraremos em contacto brevemente.');
      setSubject('');
      setPhone('');
      setEmail('');
      setContent('');
    } catch (error: any) {
      console.log('[Contacts] Send error:', error.message);
      Alert.alert('Erro', translateError(error));
    } finally {
      setSending(false);
    }
  }, [subject, phone, email, content, sendEmail]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <MessageCircle size={20} color={Colors.white} />
          </View>
          <Text style={styles.headerTitle}>Contactos</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Canais de Contacto</Text>

        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              import('react-native').then(({ Linking }) =>
                Linking.openURL('mailto:geral@alertamadeira.com')
              );
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#E74C3C15' }]}>
              <Mail size={20} color="#E74C3C" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>geral@alertamadeira.com</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              import('react-native').then(({ Linking }) =>
                Linking.openURL('https://www.alertamadeira.com')
              );
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: '#3498DB15' }]}>
              <Globe size={20} color="#3498DB" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValue}>www.alertamadeira.com</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Formulário de Contacto</Text>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Assunto *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Escreva o assunto"
              placeholderTextColor={Colors.textMuted}
              value={subject}
              onChangeText={setSubject}
              testID="contact-subject"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Telemóvel</Text>
            <TextInput
              style={styles.formInput}
              placeholder="+351 900 000 000"
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              testID="contact-phone"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="seuemail@exemplo.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="contact-email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Conteúdo *</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="Escreva a sua mensagem..."
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              testID="contact-content"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, sending && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={sending}
            activeOpacity={0.85}
            testID="contact-submit"
          >
            {sending ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Send size={16} color={Colors.white} />
                <Text style={styles.submitBtnText}>Enviar Mensagem</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Phone size={16} color={Colors.primary} />
          <Text style={styles.infoText}>
            Para emergências utilize sempre o número europeu de emergência 112. A aplicação Alerta Madeira serve para partilha de informação comunitária e não substitui os serviços de emergência.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 18,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 14,
  },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  heroDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginTop: 4,
  },
  contactRow: {
    gap: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  formInput: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
});
