import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTikTokLiveEvents, useCreatorStatus } from '../../src/hooks/realtime';
import { useCreatorsStore } from '../../src/stores/creatorsStore';
import { useUIStore } from '../../src/stores/uiStore';
import { GlassCard, LiveIndicator } from '../../src/components/glass';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { creatorsAPI } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function DashboardScreen() {
  const { creators, isLoading, setCreators, setLoading } = useCreatorsStore();
  const { refreshing, setRefreshing } = useUIStore();
  const { isConnected } = useTikTokLiveEvents();
  const { liveCreators, totalLive } = useCreatorStatus();

  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      setLoading(true);
      const data = await creatorsAPI.getAll();
      setCreators(data);
    } catch (error) {
      console.error('Failed to load creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadCreators();
    setRefreshing(false);
  };

  const handleCreatorPress = (creator: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/creator/${creator.id}`);
  };

  const handleAddCreator = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/creators');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeIn} style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            {totalLive} Live • {creators.length} Total Creators
          </Text>
        </View>
        <View style={styles.headerRight}>
          {isConnected ? (
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Connected</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.statusBadgeOffline]}>
              <View style={[styles.statusDot, styles.statusDotOffline]} />
              <Text style={styles.statusText}>Offline</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Quick Stats */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.statsContainer}>
        <GlassCard style={styles.statCard}>
          <Ionicons name="eye-outline" size={24} color={TikTokTheme.colors.brand.cyan} />
          <Text style={styles.statValue}>
            {creators.reduce((sum, c) => sum + (c.viewer_count || 0), 0).toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total Viewers</Text>
        </GlassCard>

        <GlassCard style={styles.statCard}>
          <Ionicons name="trending-up" size={24} color={TikTokTheme.colors.brand.cyan} />
          <Text style={styles.statValue}>{totalLive}</Text>
          <Text style={styles.statLabel}>Live Now</Text>
        </GlassCard>
      </Animated.View>

      {/* Creators Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={TikTokTheme.colors.brand.cyan}
            colors={[TikTokTheme.colors.brand.cyan]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {creators.map((creator, index) => (
            <Animated.View
              key={creator.id}
              entering={FadeInDown.delay(200 + index * 50)}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleCreatorPress(creator)}
              >
                <GlassCard style={styles.creatorCard}>
                  {/* Status Badge */}
                  <View style={styles.creatorHeader}>
                    <LiveIndicator
                      isLive={creator.is_live || false}
                      viewerCount={creator.viewer_count}
                    />
                  </View>

                  {/* Avatar Placeholder */}
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {creator.display_name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  </View>

                  {/* Creator Info */}
                  <Text style={styles.creatorName} numberOfLines={1}>
                    {creator.display_name}
                  </Text>
                  <Text style={styles.creatorUsername} numberOfLines={1}>
                    @{creator.tiktok_username}
                  </Text>

                  {/* Stats */}
                  <View style={styles.creatorStats}>
                    <View style={styles.statItem}>
                      <Ionicons
                        name="people-outline"
                        size={12}
                        color={TikTokTheme.colors.text.muted}
                      />
                      <Text style={styles.statText}>
                        {(creator.follower_count || 0) >= 1000
                          ? `${(creator.follower_count / 1000).toFixed(1)}K`
                          : creator.follower_count || 0}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          ))}

          {/* Add Creator Button */}
          <Animated.View entering={FadeInDown.delay(200 + creators.length * 50)}>
            <TouchableOpacity activeOpacity={0.7} onPress={handleAddCreator}>
              <GlassCard style={[styles.creatorCard, styles.addCard]}>
                <Ionicons
                  name="add-circle-outline"
                  size={48}
                  color={TikTokTheme.colors.brand.cyan}
                />
                <Text style={styles.addText}>Add Creator</Text>
              </GlassCard>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Empty State */}
        {creators.length === 0 && !isLoading && (
          <Animated.View entering={FadeIn} style={styles.emptyState}>
            <Ionicons
              name="videocam-outline"
              size={64}
              color={TikTokTheme.colors.text.muted}
            />
            <Text style={styles.emptyTitle}>No Creators Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first creator to start monitoring
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TikTokTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: TikTokTheme.spacing.base,
    paddingVertical: TikTokTheme.spacing.base,
  },
  title: {
    fontSize: TikTokTheme.typography.fontSize['2xl'],
    fontWeight: TikTokTheme.typography.fontWeight.black,
    color: TikTokTheme.colors.text.primary,
  },
  subtitle: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    color: TikTokTheme.colors.text.muted,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: TikTokTheme.borderRadius.full,
  },
  statusBadgeOffline: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TikTokTheme.colors.brand.cyan,
    marginRight: 6,
  },
  statusDotOffline: {
    backgroundColor: TikTokTheme.colors.text.muted,
  },
  statusText: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    fontWeight: TikTokTheme.typography.fontWeight.semibold,
    color: TikTokTheme.colors.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: TikTokTheme.spacing.base,
    gap: TikTokTheme.spacing.base,
    marginBottom: TikTokTheme.spacing.base,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: TikTokTheme.spacing.base,
  },
  statValue: {
    fontSize: TikTokTheme.typography.fontSize['2xl'],
    fontWeight: TikTokTheme.typography.fontWeight.black,
    color: TikTokTheme.colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    color: TikTokTheme.colors.text.muted,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: TikTokTheme.spacing.base,
    paddingBottom: TikTokTheme.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TikTokTheme.spacing.base,
  },
  creatorCard: {
    width: CARD_WIDTH,
    padding: TikTokTheme.spacing.base,
  },
  creatorHeader: {
    marginBottom: TikTokTheme.spacing.base,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: TikTokTheme.spacing.base,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TikTokTheme.colors.brand.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: TikTokTheme.typography.fontSize['2xl'],
    fontWeight: TikTokTheme.typography.fontWeight.black,
    color: TikTokTheme.colors.background.primary,
  },
  creatorName: {
    fontSize: TikTokTheme.typography.fontSize.base,
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.text.primary,
    textAlign: 'center',
  },
  creatorUsername: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    color: TikTokTheme.colors.text.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  creatorStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: TikTokTheme.spacing.base,
    gap: TikTokTheme.spacing.base,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    color: TikTokTheme.colors.text.muted,
  },
  addCard: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 180,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(0, 242, 234, 0.3)',
  },
  addText: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    fontWeight: TikTokTheme.typography.fontWeight.semibold,
    color: TikTokTheme.colors.brand.cyan,
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: TikTokTheme.typography.fontSize.xl,
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.text.primary,
    marginTop: TikTokTheme.spacing.base,
  },
  emptySubtitle: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    color: TikTokTheme.colors.text.muted,
    marginTop: 8,
    textAlign: 'center',
  },
});