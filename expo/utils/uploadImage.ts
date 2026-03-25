import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

function decodeBase64(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleanBase64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const len = cleanBase64.length;
  const bufferLength = Math.floor(len * 3 / 4) - (cleanBase64[len - 1] === '=' ? 1 : 0) - (cleanBase64[len - 2] === '=' ? 1 : 0);
  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const a = chars.indexOf(cleanBase64[i]);
    const b = chars.indexOf(cleanBase64[i + 1]);
    const c = chars.indexOf(cleanBase64[i + 2]);
    const d = chars.indexOf(cleanBase64[i + 3]);
    bytes[p++] = (a << 2) | (b >> 4);
    if (c !== -1 && cleanBase64[i + 2] !== '=') bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (d !== -1 && cleanBase64[i + 3] !== '=') bytes[p++] = ((c & 3) << 6) | (d & 63);
  }
  return bytes;
}

export async function uploadImageToSupabase(
  bucket: string,
  filePath: string,
  uri: string,
  base64?: string | null,
): Promise<string | null> {
  try {
    console.log(`[Upload] Starting upload to bucket="${bucket}", path="${filePath}"`);

    if (base64) {
      console.log('[Upload] Using base64 method, length:', base64.length);
      const bytes = decodeBase64(base64);
      console.log('[Upload] Decoded bytes length:', bytes.length);

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, bytes, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.log('[Upload] Base64 upload error:', error.message);
        const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
        const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        const { error: retryError } = await supabase.storage
          .from(bucket)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (retryError) {
          console.log('[Upload] Retry upload error:', retryError.message);
          return null;
        }
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      console.log('[Upload] Success, URL:', urlData.publicUrl);
      return urlData.publicUrl;
    }

    if (Platform.OS === 'web') {
      console.log('[Upload] Using web fetch+blob method');
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.log('[Upload] Web blob upload error:', error.message);
        return null;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      console.log('[Upload] Web upload success, URL:', urlData.publicUrl);
      return urlData.publicUrl;
    }

    console.log('[Upload] Using native FormData method');
    const formData = new FormData();
    const fileName = filePath.split('/').pop() ?? 'image.jpg';
    formData.append('', {
      uri,
      name: fileName,
      type: 'image/jpeg',
    } as any);

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, formData, {
        contentType: 'multipart/form-data',
        upsert: true,
      });

    if (error) {
      console.log('[Upload] FormData upload error:', error.message, '- falling back to fetch+blob');

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: blobError } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (blobError) {
        console.log('[Upload] Blob fallback error:', blobError.message);
        return null;
      }
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    console.log('[Upload] Native upload success, URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    console.log('[Upload] Exception:', error.message);
    return null;
  }
}
