import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';

import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { PostWithCounts, Category, Ad } from '@/types';
import PostCard from '@/components/PostCard';
import AdBanner from '@/components/AdBanner';
import WeatherFuelCards from '@/components/WeatherFuelCards';
import FloatingActionButton from '@/components/FloatingActionButton';
import { usePosts, useAds } from '@/hooks/usePosts';

interface FeedListProps {
  category?: Category;
  showWeather?: boolean;
  ListHeaderComponent?: React.ReactElement;
  filterLocation?: string;
}

type FeedItem =
  | { type: 'weather'; key: string }
  | { type: 'post'; key: string; data: PostWithCounts }
  | { type: 'ad'; key: string; data: Ad };

export default React.memo(function FeedList({ category, showWeather = false, ListHeaderComponent, filterLocation }: FeedListProps) {
  const router = useRouter();
  const { data: rawPosts, isLoading, refetch, isRefetching } = usePosts(category);
  const { data: ads } = useAds();

  const posts = useMemo(() => {
    if (!filterLocation || !rawPosts) return rawPosts;
    return rawPosts.filter(p => p.location?.toLowerCase().includes(filterLocation.toLowerCase()));
  }, [rawPosts, filterLocation]);

  const topAds = useMemo(() => (ads ?? []).filter(a => (a as any).position === 'top'), [ads]);
  const rotativeAds = useMemo(() => (ads ?? []).filter(a => (a as any).position !== 'top'), [ads]);

  const [midAdIndex, setMidAdIndex] = useState(0);

  useEffect(() => {
    if (rotativeAds.length <= 1) return;
    const interval = setInterval(() => {
      setMidAdIndex(prev => (prev + 1) % rotativeAds.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [rotativeAds.length]);

  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];
    const postList = posts ?? [];

    if (topAds.length > 0) {
      items.push({ type: 'ad', key: `ad-top-${topAds[0].id}`, data: topAds[0] });
    }

    if (showWeather) {
      items.push({ type: 'weather', key: 'weather-cards' });
    }

    const midPoint = Math.floor(postList.length / 2);
    const currentMidAd = rotativeAds.length > 0 ? rotativeAds[midAdIndex % rotativeAds.length] : null;

    postList.forEach((post, i) => {
      items.push({ type: 'post', key: post.id, data: post });
      if (i === midPoint - 1 && currentMidAd) {
        items.push({ type: 'ad', key: `ad-mid-${currentMidAd.id}-${midAdIndex}`, data: currentMidAd });
      }
    });

    return items;
  }, [posts, topAds, rotativeAds, showWeather, midAdIndex]);

  const renderItem = useCallback(({ item }: { item: FeedItem }) => {
    if (item.type === 'weather') return <WeatherFuelCards />;
    if (item.type === 'ad') {
      const isRotative = item.key.includes('mid');
      return (
        <View style={isRotative ? styles.rotativeAdWrapper : styles.topAdWrapper}>
          <AdBanner ad={item.data} isRotative={isRotative} />
        </View>
      );
    }
    return <PostCard post={item.data} />;
  }, []);

  const keyExtractor = useCallback((item: FeedItem) => item.key, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>Sem publicações</Text>
            <Text style={styles.emptyText}>
              Seja o primeiro a publicar nesta categoria!
            </Text>
          </View>
        }
      />
      <FloatingActionButton onPress={() => router.push(`/create-post${category ? `?category=${category}` : ''}` as any)} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  topAdWrapper: {
    marginBottom: 4,
  },
  rotativeAdWrapper: {
    marginTop: 16,
    marginBottom: 16,
  },
});
