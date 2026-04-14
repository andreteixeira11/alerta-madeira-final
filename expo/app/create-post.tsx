import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera, ImageIcon, MapPin, Video, X, Navigation, ChevronDown, Send, CheckCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Category } from '@/types';
import { useCreatePost, useJuntas } from '@/hooks/usePosts';
import { useAuth } from '@/contexts/AuthContext';
import { uploadImageToSupabase } from '@/utils/uploadImage';
import { translateError } from '@/utils/translateError';
import { MUNICIPALITIES } from '@/constants/municipalities';
import { CONCELHOS } from '@/constants/freguesias';
import { trpc } from '@/lib/trpc';
import * as Haptics from 'expo-haptics';

const CATEGORY_CONFIG: Record<Category, { title: string; placeholder: string }> = {
  ocorrencias: { title: 'Nova Ocorrência', placeholder: 'Descreva a ocorrência...' },
  opstop: { title: 'Nova Op. Stop', placeholder: 'Descreva a operação stop...' },
  anomalias: { title: 'Registar Anomalia', placeholder: 'Descreva a anomalia...' },
  perdidos: { title: 'Registar Perdidos e Achados', placeholder: 'Descreva o animal/objeto perdido...' },
};



export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { user, profile } = useAuth();
  const createPost = useCreatePost();

  const fixedCategory = useMemo(() => {
    const c = params.category as Category | undefined;
    if (c && ['ocorrencias', 'opstop', 'anomalias', 'perdidos'].includes(c)) return c;
    return null;
  }, [params.category]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(fixedCategory ?? 'ocorrencias');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [locationName, setLocationName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedFreguesia, setSelectedFreguesia] = useState<string | null>(null);
  const [showFreguesiaPicker, setShowFreguesiaPicker] = useState(false);
  const [expandedConcelho, setExpandedConcelho] = useState<string | null>(null);
  const [sendingToJunta, setSendingToJunta] = useState(false);
  const [sentToJunta, setSentToJunta] = useState(false);
  const [showJuntaSuccess, setShowJuntaSuccess] = useState(false);

  const sendEmailMutation = trpc.email.sendNotification.useMutation();
  const { data: juntas } = useJuntas();

  const isAnomalias = (fixedCategory ?? category) === 'anomalias';

  const juntaForFreguesia = useMemo(() => {
    if (!selectedFreguesia || !juntas) return null;
    return juntas.find(j => j.freguesia === selectedFreguesia && j.emails.length > 0) ?? null;
  }, [selectedFreguesia, juntas]);

  const screenTitle = useMemo(() => {
    const cat = fixedCategory ?? category;
    return CATEGORY_CONFIG[cat]?.title ?? 'Nova Publicação';
  }, [fixedCategory, category]);

  const descPlaceholder = useMemo(() => {
    const cat = fixedCategory ?? category;
    return CATEGORY_CONFIG[cat]?.placeholder ?? 'Descreva...';
  }, [fixedCategory, category]);

  const getGPSLocation = useCallback(async () => {
    try {
      setGpsLoading(true);
      if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão de localização',
            'Permita o acesso à localização para associar a sua posição atual à ocorrência que está a submeter.'
          );
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLatitude(loc.coords.latitude);
        setLongitude(loc.coords.longitude);
        const [addr] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (addr) {
          const name = addr.city || addr.subregion || addr.region || '';
          if (name) setLocationName(name);
        }
      } else {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLatitude(pos.coords.latitude);
              setLongitude(pos.coords.longitude);
              setLocationName('Localização GPS');
              setGpsLoading(false);
            },
            () => {
              Alert.alert('Erro', 'Não foi possível obter a localização');
              setGpsLoading(false);
            }
          );
          return;
        }
      }
    } catch (error) {
      console.log('[CreatePost] GPS error:', error);
      Alert.alert('Erro', 'Não foi possível obter a localização');
    } finally {
      setGpsLoading(false);
    }
  }, []);

  const pickImage = useCallback(async (useCamera: boolean) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      };

      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permissão de câmara',
            'Permita o acesso à câmara para tirar fotografias das ocorrências antes de as submeter.'
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permissão de fototeca',
            'Permita o acesso à fototeca para escolher fotografias das ocorrências antes de as submeter.'
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('[CreatePost] Image picker error:', error);
    }
  }, []);

  const uploadImage = useCallback(async (uri: string): Promise<string | null> => {
    const fileName = `${user?.id}/${Date.now()}.jpg`;
    const result = await uploadImageToSupabase('posts', fileName, uri);
    if (!result) {
      console.log('[CreatePost] Upload to posts bucket failed, trying post-images');
      return await uploadImageToSupabase('post-images', fileName, uri);
    }
    return result;
  }, [user]);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Insira um título');
      return;
    }

    const effectiveCategory = fixedCategory ?? category;

    if (effectiveCategory === 'anomalias' && !selectedFreguesia) {
      Alert.alert('Erro', 'Selecione a freguesia onde se encontra a anomalia');
      return;
    }

    setUploading(true);
    try {
      let imageUrl = '';
      if (imageUri) {
        const uploaded = await uploadImage(imageUri);
        imageUrl = uploaded ?? '';
      }

      const locationValue = effectiveCategory === 'anomalias' && selectedFreguesia
        ? selectedFreguesia
        : locationName.trim();

      await createPost.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl,
        video_url: videoUrl.trim() || null,
        category: effectiveCategory,
        latitude,
        longitude,
        location: locationValue,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      Alert.alert('Erro', translateError(error));
    } finally {
      setUploading(false);
    }
  }, [title, description, category, fixedCategory, imageUri, videoUrl, locationName, selectedFreguesia, createPost, uploadImage, router, latitude, longitude]);

  const handleSendToJunta = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Insira um título antes de enviar para a Junta');
      return;
    }
    if (!selectedFreguesia) {
      Alert.alert('Erro', 'Selecione a freguesia antes de enviar para a Junta');
      return;
    }

    setSendingToJunta(true);
    try {
      const emails = juntaForFreguesia?.emails ?? [];
      if (emails.length === 0) {
        Alert.alert('Erro', 'Não existem emails configurados para esta junta de freguesia.');
        setSendingToJunta(false);
        return;
      }
      const message = `Anomalia reportada na freguesia de ${selectedFreguesia}.\n\nTítulo: ${title.trim()}\n\nDescrição: ${description.trim() || 'Sem descrição'}\n\nReportado por: ${profile?.name ?? 'Utilizador'}\nData: ${new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

      await sendEmailMutation.mutateAsync({
        to: emails,
        subject: `APP ALERTA MADEIRA - Protege a comunidade! - Anomalia em ${selectedFreguesia}`,
        message,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSentToJunta(true);
      setShowJuntaSuccess(true);
    } catch (error: any) {
      console.log('[CreatePost] Send to Junta error:', error);
      Alert.alert('Erro', 'Não foi possível enviar para a Junta. Tente novamente.');
    } finally {
      setSendingToJunta(false);
    }
  }, [title, description, selectedFreguesia, profile, sendEmailMutation]);

  const handleSelectFreguesia = useCallback((freguesia: string) => {
    setSelectedFreguesia(freguesia);
    setShowFreguesiaPicker(false);
    setExpandedConcelho(null);
    if (!locationName.trim()) {
      setLocationName(freguesia);
    }
  }, [locationName]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: screenTitle }} />
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!fixedCategory && (
          <View style={styles.section}>
            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoriesRow}>
              {([
                { key: 'ocorrencias' as const, label: 'Ocorrências' },
                { key: 'opstop' as const, label: 'Op. Stop' },
                { key: 'anomalias' as const, label: 'Anomalias' },
                { key: 'perdidos' as const, label: 'Perdidos e Achados' },
              ]).map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, category === cat.key && styles.categoryChipActive]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text style={[styles.categoryChipText, category === cat.key && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isAnomalias && (
          <View style={styles.section}>
            <Text style={styles.label}>Freguesia *</Text>
            <TouchableOpacity
              style={styles.freguesiaTrigger}
              onPress={() => setShowFreguesiaPicker(true)}
              activeOpacity={0.7}
            >
              <MapPin size={16} color={selectedFreguesia ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.freguesiaTriggerText, selectedFreguesia && styles.freguesiaTriggerTextSelected]} numberOfLines={1}>
                {selectedFreguesia ?? 'Selecionar freguesia'}
              </Text>
              <ChevronDown size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Foto</Text>
          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <X size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageBtn} onPress={() => pickImage(true)}>
                <Camera size={22} color={Colors.primary} />
                <Text style={styles.imageBtnText}>Câmara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageBtn} onPress={() => pickImage(false)}>
                <ImageIcon size={22} color={Colors.primary} />
                <Text style={styles.imageBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Título da publicação"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            testID="create-title"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={descPlaceholder}
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            testID="create-description"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Vídeo (opcional)</Text>
          <View style={styles.locationInputContainer}>
            <Video size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.locationInput}
              placeholder="Link YouTube ou rede social"
              placeholderTextColor={Colors.textMuted}
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              testID="create-video"
            />
          </View>
        </View>

        {!isAnomalias && (
          <View style={styles.section}>
            <Text style={styles.label}>Localização</Text>
            <View style={styles.locationInputContainer}>
              <MapPin size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.locationInput}
                placeholder="Ex: Funchal, Santa Cruz..."
                placeholderTextColor={Colors.textMuted}
                value={locationName}
                onChangeText={setLocationName}
                testID="create-location"
              />
              <TouchableOpacity onPress={getGPSLocation} disabled={gpsLoading} style={styles.gpsBtn}>
                {gpsLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Navigation size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickLocations}>
              {MUNICIPALITIES.map(m => (
                <TouchableOpacity
                  key={m.name}
                  style={[styles.quickLocationChip, locationName === m.name && styles.quickLocationActive]}
                  onPress={() => setLocationName(m.name)}
                >
                  <Text style={[styles.quickLocationText, locationName === m.name && styles.quickLocationTextActive]}>
                    {m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.buttonsSection}>
          <TouchableOpacity
            style={[styles.submitBtn, uploading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={uploading || sendingToJunta}
            activeOpacity={0.85}
            testID="create-submit"
          >
            {uploading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Publicar</Text>
            )}
          </TouchableOpacity>

          {isAnomalias && !!juntaForFreguesia && (
            <TouchableOpacity
              style={[styles.juntaBtn, (sendingToJunta || sentToJunta) && styles.juntaBtnDisabled]}
              onPress={handleSendToJunta}
              disabled={sendingToJunta || sentToJunta || uploading}
              activeOpacity={0.85}
            >
              {sendingToJunta ? (
                <ActivityIndicator color={Colors.white} />
              ) : sentToJunta ? (
                <>
                  <CheckCircle size={18} color={Colors.white} />
                  <Text style={styles.juntaBtnText}>Enviado para a Junta</Text>
                </>
              ) : (
                <>
                  <Send size={18} color={Colors.white} />
                  <Text style={styles.juntaBtnText}>Enviar para a Junta</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showFreguesiaPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFreguesiaPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecionar Freguesia</Text>
              <TouchableOpacity onPress={() => setShowFreguesiaPicker(false)}>
                <X size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator style={styles.modalScroll}>
              {CONCELHOS.map(concelho => (
                <View key={concelho.name}>
                  <TouchableOpacity
                    style={styles.concelhoRow}
                    onPress={() => setExpandedConcelho(expandedConcelho === concelho.name ? null : concelho.name)}
                  >
                    <Text style={styles.concelhoName}>{concelho.name}</Text>
                    <ChevronDown
                      size={14}
                      color={Colors.textMuted}
                      style={{ transform: [{ rotate: expandedConcelho === concelho.name ? '180deg' : '0deg' }] }}
                    />
                  </TouchableOpacity>
                  {expandedConcelho === concelho.name && (
                    <View style={styles.freguesiasList}>
                      {concelho.freguesias.map(f => (
                        <TouchableOpacity
                          key={f}
                          style={[
                            styles.freguesiaItem,
                            selectedFreguesia === f && styles.freguesiaItemActive,
                          ]}
                          onPress={() => handleSelectFreguesia(f)}
                        >
                          <Text style={[
                            styles.freguesiaItemText,
                            selectedFreguesia === f && styles.freguesiaItemTextActive,
                          ]}>
                            {f}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showJuntaSuccess}
        animationType="fade"
        transparent
        onRequestClose={() => setShowJuntaSuccess(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <CheckCircle size={48} color={Colors.success} />
            <Text style={styles.successTitle}>Enviado com sucesso!</Text>
            <Text style={styles.successText}>
              A anomalia foi enviada para a Junta de Freguesia.{'\n'}Deseja também publicar na app?
            </Text>
            <View style={styles.successButtons}>
              <TouchableOpacity
                style={styles.successPublishBtn}
                onPress={() => {
                  setShowJuntaSuccess(false);
                  handleSubmit();
                }}
              >
                <Text style={styles.successPublishBtnText}>Publicar na App</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.successCloseBtn}
                onPress={() => setShowJuntaSuccess(false)}
              >
                <Text style={styles.successCloseBtnText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flex: 1,
    padding: 18,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  freguesiaTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  freguesiaTriggerText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textMuted,
  },
  freguesiaTriggerTextSelected: {
    color: Colors.text,
    fontWeight: '600' as const,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: Colors.primaryPale,
    borderStyle: 'dashed',
  },
  imageBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  imagePreview: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
  },
  gpsBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryPale,
  },
  quickLocations: {
    marginTop: 8,
  },
  quickLocationChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: 6,
  },
  quickLocationActive: {
    backgroundColor: Colors.primaryPale,
    borderColor: Colors.primarySoft,
  },
  quickLocationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  quickLocationTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  buttonsSection: {
    gap: 12,
    marginTop: 8,
  },
  submitBtn: {
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
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  juntaBtn: {
    backgroundColor: '#2563EB',
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  juntaBtnDisabled: {
    opacity: 0.7,
  },
  juntaBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalScroll: {
    paddingHorizontal: 12,
  },
  concelhoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
    gap: 6,
  },
  concelhoName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  concelhoCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  freguesiasList: {
    paddingLeft: 16,
    backgroundColor: '#FAFAFA',
  },
  freguesiaItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  freguesiaItemActive: {
    backgroundColor: Colors.primaryPale,
  },
  freguesiaItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  freguesiaItemTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  successModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 8,
  },
  successText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successButtons: {
    width: '100%',
    gap: 10,
    marginTop: 12,
  },
  successPublishBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successPublishBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  successCloseBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F1F5',
  },
  successCloseBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
});
