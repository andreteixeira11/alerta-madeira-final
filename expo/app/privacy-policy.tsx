import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';

const sections = [
  {
    icon: Database,
    title: 'Dados Recolhidos',
    content: 'Recolhemos apenas os dados necessários para o funcionamento da aplicação: nome de utilizador, endereço de email e conteúdo publicado (textos, imagens e localização das ocorrências). A localização é utilizada apenas para georreferenciar as publicações quando autorizada pelo utilizador.',
  },
  {
    icon: Lock,
    title: 'Segurança dos Dados',
    content: 'Os seus dados são armazenados de forma segura em servidores protegidos com encriptação. Utilizamos o Supabase como plataforma de base de dados, que cumpre os mais elevados padrões de segurança e proteção de dados.',
  },
  {
    icon: Eye,
    title: 'Utilização dos Dados',
    content: 'Os seus dados são utilizados exclusivamente para: autenticação na aplicação, publicação de ocorrências, interação com outros utilizadores e envio de notificações relevantes. Não partilhamos os seus dados com terceiros para fins comerciais.',
  },
  {
    icon: Bell,
    title: 'Notificações',
    content: 'Podemos enviar notificações push sobre alertas importantes na sua região. Pode desativar as notificações a qualquer momento nas definições do seu dispositivo.',
  },
  {
    icon: Trash2,
    title: 'Eliminação de Dados',
    content: 'Pode solicitar a eliminação completa da sua conta e todos os dados associados a qualquer momento, contactando-nos através do email indicado na secção de contactos. Os dados serão eliminados no prazo máximo de 30 dias.',
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <Shield size={22} color={Colors.white} />
          </View>
          <Text style={styles.headerTitle}>Política de Privacidade</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Alerta Madeira</Text>
          <Text style={styles.introText}>
            O Alerta Madeira é uma aplicação destinada à comunidade madeirense residente na Região Autónoma da Madeira. O seu objetivo é permitir que os próprios utilizadores partilhem momentos do quotidiano, criando assim uma rede de informação útil para o dia a dia de todos. Todas as informações publicadas são da exclusiva responsabilidade de cada utilizador, e o administrador reserva-se o direito de eliminar qualquer publicação ou utilizador que não cumpra as regras da comunidade.
          </Text>
          <Text style={styles.introDate}>Última atualização: Fevereiro 2026</Text>
        </View>

        {sections.map((section, index) => (
          <View key={index} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <section.icon size={18} color={Colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionText}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Consentimento</Text>
          <Text style={styles.footerText}>
            Ao utilizar a aplicação Alerta Madeira, o utilizador consente com a recolha e utilização dos seus dados conforme descrito nesta política de privacidade. Reservamo-nos o direito de atualizar esta política, sendo que quaisquer alterações serão comunicadas através da aplicação.
          </Text>
        </View>

        <View style={styles.legalNote}>
          <Text style={styles.legalText}>
            Em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD) da União Europeia.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
  introCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.primary,
    marginBottom: 10,
  },
  introText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  introDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 12,
    fontWeight: '500' as const,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  footerCard: {
    backgroundColor: Colors.primaryPale,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 21,
  },
  legalNote: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  legalText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
});
