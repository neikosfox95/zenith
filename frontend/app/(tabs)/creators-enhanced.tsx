import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker, retryWithBackoff } from '../../src/utils/GodTierFramework';
import { useNetwork, useLocalStorage, useDebounce } from '../../src/hooks/GodTierHooks';
import { TikTokTheme } from '../../theme/TikTokTheme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Creator {
  id: string;
  username: string;
  follower_count: number;
  is_live: boolean;
  viewer_count: number;
  total_revenue: number;
  streams_count: number;
  avg_duration: number;
}

const MOCK_CREATORS: Creator[] = [
  {
    id: '1',
    username: 'darkskully',
    follower_count: 125000,
    is_live: true,
    viewer_count: 3420,
    total_revenue: 245000,
    streams_count: 87,
    avg_duration: 145,
  },
  {
    id: '2',
    username: 'streamerqueen',
    follower_count: 89000,
    is_live: false,
    viewer_count: 0,
    total_revenue: 156000,
    streams_count: 62,
    avg_duration: 120,
  },
];

function CreatorsScreenContent() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // God Tier: Debounced search to optimize filtering performance
  const debouncedQuery = useDebounce(searchQuery, 300);

  // God Tier: Network detection
  const { isConnected } = useNetwork();

  // God Tier: Cached data for offline support
  const [cachedCreators, setCachedCreators] = useLocalStorage<Creator[]>('creators_list', []);

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('creators_screen');
    analyticsTracker.screenView('creators');
    return () => stopTimer();
  }, []);

  useEffect(() => {
    loadCreators();
  }, []);

  // Cache creators when online
  useEffect(() => {
    if (isConnected && creators.length > 0) {
      setCachedCreators(creators);
    }
  }, [creators, isConnected]);

  const displayCreators = !isConnected && cachedCreators.length > 0 ? cachedCreators : creators;

  const loadCreators = async () => {
    const stopTimer = performanceMonitor.startTimer('load_creators');
    try {
      // God Tier: retry with exponential backoff
      const data = await retryWithBackoff(async () => MOCK_CREATORS, 3, 500);
      setCreators(data);
      analyticsTracker.track('creators_loaded', { count: data.length });
    } catch (error) {
      console.error('Failed to load creators:', error);
      analyticsTracker.track('creators_load_failed', { error: String(error) });
    } finally {
      stopTimer();
    }
  };

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_creators');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadCreators();
    setRefreshing(false);
  };

  const handleAddCreator = () => {
    analyticsTracker.buttonClick('add_creator');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAddModal(true);
  };

  const handleDeleteCreator = (id: string) => {
    analyticsTracker.track('creator_deleted', { creator_id: id });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCreators(creators.filter(c => c.id !== id));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const filteredCreators = displayCreators.filter(c =>
    c.username.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Showing cached creators</Text>
        </Animated.View>
      )}

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1604941878418-b0fbf86e3590?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']} style={styles.heroGradient} />
        <View style={styles.heroContent}>
          <Animated.Text entering={FadeIn} style={styles.heroTitle}>
            Creator Management
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroSubtitle}>
            {displayCreators.length} creators monitored
          </Animated.Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TikTokTheme.colors.brand.cyan} colors={[TikTokTheme.colors.brand.cyan]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.searchContainer}>
          <BlurView intensity={40} style={styles.searchBlur}>
            <View style={styles.searchContent}>
              <Ionicons name="search" size={20} color={TikTokTheme.colors.text.muted} />
              <TextInput
                testID="creators-search-input"
                style={styles.searchInput}
                placeholder="Search creators..."
                placeholderTextColor={TikTokTheme.colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  testID="creators-search-clear-button"
                  onPress={() => {
                    analyticsTracker.buttonClick('clear_creator_search');
                    setSearchQuery('');
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={TikTokTheme.colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
        </Animated.View>

        {/* Add Creator Button */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <TouchableOpacity testID="creators-add-button" style={styles.addButton} onPress={handleAddCreator}>
            <LinearGradient
              colors={[TikTokTheme.colors.brand.cyan, TikTokTheme.colors.charts.tertiary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add-circle" size={24} color={TikTokTheme.colors.background.primary} />
              <Text style={styles.addButtonText}>Add New Creator</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Creators Grid */}
        {filteredCreators.length > 0 ? (
          <View style={styles.creatorsGrid}>
            {filteredCreators.map((creator, index) => (
              <Animated.View
                key={creator.id}
                entering={FadeInRight.delay(400 + index * 100)}
                style={styles.creatorCard}
              >
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=400&q=80' }}
                  style={styles.creatorBackground}
                  blurRadius={4}
                />
                <BlurView intensity={50} style={styles.creatorBlur}>
                  <View testID={`creators-card-${creator.username}`} style={styles.creatorContent}>
                    {/* Header */}
                    <View style={styles.creatorHeader}>
                      <View style={styles.avatarContainer}>
                        <LinearGradient
                          colors={[TikTokTheme.colors.brand.cyan, TikTokTheme.colors.brand.pink]}
                          style={styles.avatar}
                        >
                          <Text style={styles.avatarText}>{creator.username.charAt(0).toUpperCase()}</Text>
                        </LinearGradient>
                        {creator.is_live && (
                          <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        testID={`creators-delete-button-${creator.username}`}
                        onPress={() => handleDeleteCreator(creator.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={18} color={TikTokTheme.colors.status.error} />
                      </TouchableOpacity>
                    </View>

                    {/* Username */}
                    <Text style={styles.username} numberOfLines={1}>@{creator.username}</Text>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Ionicons name="people" size={14} color={TikTokTheme.colors.text.secondary} />
                        <Text style={styles.statText}>{formatNumber(creator.follower_count)}</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Ionicons name="videocam" size={14} color={TikTokTheme.colors.text.secondary} />
                        <Text style={styles.statText}>{creator.streams_count}</Text>
                      </View>
                    </View>

                    {/* Revenue */}
                    <View style={styles.revenueContainer}>
                      <Text style={styles.revenueLabel}>Total Revenue</Text>
                      <Text style={styles.revenueValue}>${(creator.total_revenue / 100).toFixed(2)}</Text>
                    </View>

                    {/* Status */}
                    {creator.is_live ? (
                      <View style={styles.statusLive}>
                        <Ionicons name="radio-button-on" size={12} color={TikTokTheme.colors.background.primary} />
                        <Text style={styles.statusLiveText}>LIVE • {formatNumber(creator.viewer_count)} viewers</Text>
                      </View>
                    ) : (
                      <View style={styles.statusOffline}>
                        <Ionicons name="radio-button-off" size={12} color={TikTokTheme.colors.text.muted} />
                        <Text style={styles.statusOfflineText}>Offline</Text>
                      </View>
                    )}
                  </View>
                </BlurView>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/7505924/pexels-photo-7505924.jpeg?w=400&q=80' }}
              style={styles.emptyImage}
              blurRadius={2}
            />
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']} style={styles.emptyOverlay}>
              <Ionicons name="person-add" size={64} color={TikTokTheme.colors.text.muted} />
              <Text style={styles.emptyTitle}>No Creators Found</Text>
              <Text style={styles.emptyText}>Add creators to start monitoring their streams</Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function CreatorsScreen() {
  return (
    <GodTierErrorBoundary>
      <CreatorsScreenContent />
    </GodTierErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  offlineBanner: { backgroundColor: TikTokTheme.colors.status.warning, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  offlineText: { fontSize: 12, fontWeight: '600', color: TikTokTheme.colors.background.primary },
  heroContainer: { height: 140, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  searchContainer: { height: 50, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 2 },
  searchBlur: { flex: 1 },
  searchContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  searchInput: { flex: 1, fontSize: 16, color: TikTokTheme.colors.text.primary },
  addButton: { height: 56, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  addButtonGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  addButtonText: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.background.primary },
  creatorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: TikTokTheme.spacing.base },
  creatorCard: { width: CARD_WIDTH, height: 280, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  creatorBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  creatorBlur: { flex: 1 },
  creatorContent: { flex: 1, padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  creatorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.background.primary },
  liveIndicator: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: TikTokTheme.colors.status.live, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: TikTokTheme.colors.background.primary },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: TikTokTheme.colors.background.primary },
  deleteButton: { padding: 4 },
  username: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 8 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  statDivider: { width: 1, height: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', marginHorizontal: 8 },
  revenueContainer: { marginBottom: 12 },
  revenueLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted, marginBottom: 2 },
  revenueValue: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.brand.cyan },
  statusLive: { flexDirection: 'row', alignItems: 'center', backgroundColor: TikTokTheme.colors.status.live, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  statusLiveText: { fontSize: 11, fontWeight: '900', color: TikTokTheme.colors.background.primary },
  statusOffline: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  statusOfflineText: { fontSize: 11, fontWeight: '600', color: TikTokTheme.colors.text.muted },
  emptyState: { height: 300, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginTop: TikTokTheme.spacing.base, elevation: 2 },
  emptyImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emptyOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: TikTokTheme.spacing.xl },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: TikTokTheme.colors.text.secondary, textAlign: 'center' },
});
