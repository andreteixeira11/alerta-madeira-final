import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { Ad } from '@/types';
import { useTrackAdClick, useTrackAdImpression } from '@/hooks/usePosts';

interface AdBannerProps {
  ad: Ad;
  isRotative?: boolean;
}

export default React.memo(function AdBanner({ ad, isRotative = false }: AdBannerProps) {
  const trackClick = useTrackAdClick();
  const trackImpression = useTrackAdImpression();
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackImpression.mutate(ad.id);
    }
  }, [ad.id, trackImpression]);

  const handlePress = useCallback(() => {
    trackClick.mutate(ad.id);
    if (ad.link_url) {
      const url = ad.link_url.startsWith('http') ? ad.link_url : `https://${ad.link_url}`;
      console.log('[Ad] Opening URL:', url);
      Linking.openURL(url).catch(e => console.log('[Ad] Open link error:', e));
    }
  }, [ad.link_url, ad.id, trackClick]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={ad.link_url ? 0.8 : 1}
      disabled={!ad.link_url}
      testID="ad-banner"
    >
      <Image
        source={{ uri: ad.image_url }}
        style={isRotative ? styles.imageRotative : styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.overlay}>
        {ad.title ? (
          <Text style={styles.adTitle} numberOfLines={1}>{ad.title}</Text>
        ) : null}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Publicidade</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.borderLight,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 120,
  },
  imageRotative: {
    width: '100%',
    aspectRatio: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  adTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.white,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: '500' as const,
  },
});
