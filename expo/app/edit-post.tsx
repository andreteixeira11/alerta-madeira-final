import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { MapPin, Video, Camera, ImageIcon, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { CATEGORIES, Category } from '@/types';
import { usePostDetail, useUpdatePost } from '@/hooks/usePosts';
import { translateError } from '@/utils/translateError';
import { MUNICIPALITIES } from '@/constants/municipalities';
import { uploadImageToSupabase } from '@/utils/uploadImage';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

export default function EditPostScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: post, isLoading } = usePostDetail(id ?? '');
  const updatePost = useUpdatePost();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('ocorrencias');
  const [videoUrl, setVideoUrl] = useState('');
  const [locationName, setLocationName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setDescription(post.description ?? '');
      setCategory(post.category as Category);
      setVideoUrl(post.video_url ?? '');
      setLocationName(post.location ?? '');
      setCurrentImageUrl(post.image_url || null);
    }
  }, [post]);

  const pickImage = useCallback(async (useCamera: boolean) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      };
      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permissão', 'Precisamos de acesso à câmara');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('[EditPost] Image picker error:', error);
    }
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!title.trim() || !id) {
      Alert.alert('Erro', 'Insira um título');
      return;
    }

    try {
      let newImageUrl: string | undefined;
      if (imageUri) {
        setUploadingImage(true);
        const fileName = `${user?.id}/${Date.now()}.jpg`;
        const uploaded = await uploadImageToSupabase('posts', fileName, imageUri);
        if (uploaded) {
          newImageUrl = uploaded;
        } else {
          const fallback = await uploadImageToSupabase('post-images', fileName, imageUri);
          if (fallback) newImageUrl = fallback;
        }
        setUploadingImage(false);
      }

      const updates: any = {
        id,
        title: title.trim(),
        description: description.trim(),
        category: category as Category,
        video_url: videoUrl.trim() || null,
        location: locationName.trim(),
      };
      if (newImageUrl) {
        updates.image_url = newImageUrl;
      }

      await updatePost.mutateAsync(updates);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      setUploadingImage(false);
      Alert.alert('Erro', translateError(error));
    }
  }, [id, title, description, category, videoUrl, locationName, imageUri, user, updatePost, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Editar' }} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Editar Publicação' }} />
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.label}>Foto</Text>
          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.currentImage} contentFit="cover" />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <X size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ) : currentImageUrl ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: currentImageUrl }} style={styles.currentImage} contentFit="cover" />
              <View style={styles.imageOverlayButtons}>
                <TouchableOpacity style={styles.changeImageBtn} onPress={() => pickImage(false)}>
                  <ImageIcon size={16} color={Colors.white} />
                  <Text style={styles.changeImageText}>Alterar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.changeImageBtn} onPress={() => pickImage(true)}>
                  <Camera size={16} color={Colors.white} />
                  <Text style={styles.changeImageText}>Câmara</Text>
                </TouchableOpacity>
              </View>
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
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.categoriesRow}>
            {CATEGORIES.map(cat => (
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

        <View style={styles.section}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            testID="edit-title"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            testID="edit-description"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Localização</Text>
          <View style={styles.locationInputContainer}>
            <MapPin size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.locationInput}
              placeholder="Ex: Funchal..."
              placeholderTextColor={Colors.textMuted}
              value={locationName}
              onChangeText={setLocationName}
              testID="edit-location"
            />
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
              testID="edit-video"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (updatePost.isPending || uploadingImage) && styles.submitBtnDisabled]}
          onPress={handleUpdate}
          disabled={updatePost.isPending || uploadingImage}
          activeOpacity={0.85}
          testID="edit-submit"
        >
          {(updatePost.isPending || uploadingImage) ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Guardar Alterações</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flex: 1,
    padding: 18,
  },
  currentImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  imagePreview: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative' as const,
    marginBottom: 0,
  },
  removeImageBtn: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  imageOverlayButtons: {
    position: 'absolute' as const,
    bottom: 10,
    right: 10,
    flexDirection: 'row' as const,
    gap: 8,
  },
  changeImageBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeImageText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  imageButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  imageBtn: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: Colors.primaryPale,
    borderStyle: 'dashed' as const,
  },
  imageBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
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
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
});
