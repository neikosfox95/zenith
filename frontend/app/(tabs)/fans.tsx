import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { GodTierMetricsBadge } from '../../src/components/GodTierMetricsBadge';
import { useNetwork, useLocalStorage } from '../../src/hooks/GodTierHooks';
import { useSocket } from '../../src/contexts/SocketContext';
import { creatorsAPI, fansAPI } from '../../src/services/api';
import { TikTokTheme } from '../../theme/TikTokTheme';

interface Fan {
  _id: string;
  username: string;
  nickname: string;
  total_diamonds: number;
  total_gifts: number;
  chat_count: number;
  like_count: number;
  stream_joins: number;
  tier: string;
  tier_info: {
    name: string;
    color: string;
    min: number;
    max: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
}

interface Creator {
  _id: string;
  tiktok_username: string;
}

interface FanClubStats {
  total_fans: number;
  tier_distribution: Array<{
    _id: string;
    count: number;
    total_diamonds: number;
  }>;
  top_fans: Fan[];
}

type TabKey = 'all' | 'super' | 'leaderboard';

function FansScreenContent() {
  const { socket } = useSocket();
  const [selectedTab, setSelectedTab] = useState<TabKey>('super');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [fans, setFans] = useState<Fan[]>([]);
  const [superFans, setSuperFans] = useState<Fan[]>([]);
  const [leaderboard, setLeaderboard] = useState<Fan[]>([]);
  const [stats, setStats] = useState<FanClubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // God Tier: Network detection
  const { isConnected } = useNetwork();

  // God Tier: Cached data for offline support
  const [cachedStats, setCachedStats] = useLocalStorage<FanClubStats | null>('fans_stats', null);
  const [cachedSuperFans, setCachedSuperFans] = useLocalStorage<Fan[]>('fans_super', []);
  const [cachedLeaderboard, setCachedLeaderboard] = useLocalStorage<Fan[]>('fans_leaderboard', []);

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('fans_screen');
    analyticsTracker.screenView('fans');
    return () => stopTimer();
  }, []);

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    if (selectedCreator) {
      loadFanData();
    }
  }, [selectedCreator]);

  useEffect(() => {
    if (socket) {
      socket.on('fan_tier_upgrade', handleFanTierUpgrade);
      socket.on('badge_earned', handleBadgeEarned);

      return () => {
        socket.off('fan_tier_upgrade', handleFanTierUpgrade);
        socket.off('badge_earned', handleBadgeEarned);
      };
    }
  }, [socket]);

  // Cache data when online
  useEffect(() => {
    if (isConnected) {
      if (stats) setCachedStats(stats);
      if (superFans.length > 0) setCachedSuperFans(superFans);
      if (leaderboard.length > 0) setCachedLeaderboard(leaderboard);
    }
  }, [stats, superFans, leaderboard, isConnected]);

  const displayStats = !isConnected && cachedStats ? cachedStats : stats;
  const displaySuperFans = !isConnected && cachedSuperFans.length > 0 ? cachedSuperFans : superFans;
  const displayLeaderboard = !isConnected && cachedLeaderboard.length > 0 ? cachedLeaderboard : leaderboard;

  const loadCreators = async () => {
    const stopTimer = performanceMonitor.startTimer('load_fans_creators');
    try {
      const data = await creatorsAPI.getCreators();
      setCreators(data);
      if (data.length > 0 && !selectedCreator) {
        setSelectedCreator(data[0]._id);
      } else if (data.length === 0) {
        setLoading(false);
      }
      analyticsTracker.track('fans_creators_loaded', { count: data.length });
    } catch (error) {
      console.error('Error loading creators:', error);
      analyticsTracker.track('fans_creators_load_failed', { error: String(error) });
      setLoading(false);
    } finally {
      stopTimer();
    }
  };

  const loadFanData = async () => {
    if (!selectedCreator) return;

    const stopTimer = performanceMonitor.startTimer('load_fan_data');
    try {
      setLoading(true);
      const [fansData, superFansData, leaderboardData, statsData] = await Promise.all([
        fansAPI.getFans(selectedCreator),
        fansAPI.getSuperFans(selectedCreator),
        fansAPI.getLeaderboard(selectedCreator, 'diamonds'),
        fansAPI.getFanClubStats(selectedCreator),
      ]);

      setFans(fansData);
      setSuperFans(superFansData);
      setLeaderboard(leaderboardData);
      setStats(statsData);
      analyticsTracker.track('fan_data_loaded', { fans: fansData.length });
    } catch (error) {
      console.error('Error loading fan data:', error);
      analyticsTracker.track('fan_data_load_failed', { error: String(error) });
    } finally {
      setLoading(false);
      stopTimer();
    }
  };

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_fans');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadFanData();
    setRefreshing(false);
  };

  const handleTabChange = (tab: TabKey) => {
    analyticsTracker.buttonClick('fans_tab_change', { tab });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tab);
  };

  const handleFanTierUpgrade = (event: any) => {
    analyticsTracker.track('fan_tier_upgrade_received', event);
    loadFanData();
  };

  const handleBadgeEarned = (event: any) => {
    analyticsTracker.track('badge_earned_received', event);
    loadFanData();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'MEGA_FAN': return '👑';
      case 'ULTRA_FAN': return '💎';
      case 'SUPER_FAN': return '⭐';
      case 'DEDICATED': return '🔥';
      case 'SUPPORTER': return '💚';
      default: return '👤';
    }
  };

  const renderFanCard = (fan: Fan, rank?: number) => (
    <View key={fan._id} testID={`fans-card-${fan.username}`} style={styles.fanCard}>
      <BlurView intensity={40} style={styles.fanBlur}>
        <View style={styles.fanCardInner}>
          <View style={styles.fanHeader}>
            {rank && (
              <View style={[
                styles.rankBadge,
                rank === 1 && styles.rankGold,
                rank === 2 && styles.rankSilver,
                rank === 3 && styles.rankBronze,
              ]}>
                <Text style={styles.rankText}>#{rank}</Text>
              </View>
            )}
            <View style={styles.fanAvatar}>
              <Text style={styles.avatarEmoji}>{getTierIcon(fan.tier)}</Text>
            </View>
            <View style={styles.fanInfo}>
              <Text style={styles.fanName} numberOfLines={1}>
                {fan.nickname || fan.username}
              </Text>
              <Text style={styles.fanUsername} numberOfLines={1}>
                @{fan.username}
              </Text>
            </View>
            <View style={[styles.tierBadge, { backgroundColor: (fan.tier_info?.color || TikTokTheme.colors.brand.cyan) + '20' }]}>
              <Text style={[styles.tierText, { color: fan.tier_info?.color || TikTokTheme.colors.brand.cyan }]}>
                {fan.tier_info?.name || fan.tier}
              </Text>
            </View>
          </View>

          <View style={styles.fanStats}>
            <View style={styles.statItem}>
              <Ionicons name="diamond" size={16} color="#A855F7" />
              <Text style={styles.statValue}>{formatNumber(fan.total_diamonds)}</Text>
              <Text style={styles.statLabel}>Diamonds</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="gift" size={16} color="#FFD700" />
              <Text style={styles.statValue}>{fan.total_gifts}</Text>
              <Text style={styles.statLabel}>Gifts</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble" size={16} color="#10B981" />
              <Text style={styles.statValue}>{fan.chat_count}</Text>
              <Text style={styles.statLabel}>Chats</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={16} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.statValue}>{fan.stream_joins}</Text>
              <Text style={styles.statLabel}>Streams</Text>
            </View>
          </View>

          {fan.badges && fan.badges.length > 0 && (
            <View style={styles.badgesContainer}>
              <Text style={styles.badgesTitle}>Badges:</Text>
              <View style={styles.badgesList}>
                {fan.badges.slice(0, 5).map((badge) => (
                  <View key={badge.id} style={styles.badge}>
                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  </View>
                ))}
                {fan.badges.length > 5 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeMore}>+{fan.badges.length - 5}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </BlurView>
    </View>
  );

  const renderStatsOverview = () => {
    if (!displayStats) return null;

    return (
      <Animated.View entering={FadeInDown.delay(300)} style={styles.statsOverview}>
        <View testID="fans-total-fans-card" style={styles.statCard}>
          <BlurView intensity={40} style={styles.statCardBlur}>
            <LinearGradient colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']} style={styles.statCardContent}>
              <Ionicons name="people" size={28} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.statCardValue}>{displayStats.total_fans}</Text>
              <Text style={styles.statCardLabel}>Total Fans</Text>
            </LinearGradient>
          </BlurView>
        </View>
        <View testID="fans-vip-fans-card" style={styles.statCard}>
          <BlurView intensity={40} style={styles.statCardBlur}>
            <LinearGradient colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']} style={styles.statCardContent}>
              <Ionicons name="trophy" size={28} color="#FFD700" />
              <Text style={styles.statCardValue}>{displayStats.top_fans?.length ?? 0}</Text>
              <Text style={styles.statCardLabel}>VIP Fans</Text>
            </LinearGradient>
          </BlurView>
        </View>
        <View testID="fans-total-diamonds-card" style={styles.statCard}>
          <BlurView intensity={40} style={styles.statCardBlur}>
            <LinearGradient colors={['rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.05)']} style={styles.statCardContent}>
              <Ionicons name="diamond" size={28} color="#A855F7" />
              <Text style={styles.statCardValue}>
                {formatNumber(displayStats.tier_distribution?.reduce((sum, t) => sum + t.total_diamonds, 0) ?? 0)}
              </Text>
              <Text style={styles.statCardLabel}>Total Diamonds</Text>
            </LinearGradient>
          </BlurView>
        </View>
      </Animated.View>
    );
  };

  const renderTabContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading fans...</Text>
        </View>
      );
    }

    const tabConfig: Record<TabKey, { title: string; subtitle?: string; data: Fan[]; ranked: boolean; empty: string }> = {
      super: { title: 'Super Fans 👑', subtitle: 'Your top supporters', data: displaySuperFans, ranked: false, empty: 'No super fans yet' },
      leaderboard: { title: 'Leaderboard 🏆', subtitle: 'Top contributors', data: displayLeaderboard, ranked: true, empty: 'No leaderboard data yet' },
      all: { title: `All Fans (${fans.length})`, data: fans.slice(0, 50), ranked: false, empty: 'No fans yet' },
    };

    const config = tabConfig[selectedTab];

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{config.title}</Text>
          {config.subtitle && <Text style={styles.sectionSubtitle}>{config.subtitle}</Text>}
        </View>
        {config.data.length > 0 ? (
          config.data.map((fan, index) => renderFanCard(fan, config.ranked ? index + 1 : undefined))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={TikTokTheme.colors.text.muted} />
            <Text style={styles.emptyText}>{config.empty}</Text>
          </View>
        )}
      </View>
    );
  };

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'super', label: 'Super Fans' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'all', label: 'All Fans' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Showing cached fan data</Text>
        </Animated.View>
      )}

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']} style={styles.heroGradient} />
        <View style={styles.heroContent}>
          <Animated.Text entering={FadeIn} style={styles.heroTitle}>
            Fan Club
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroSubtitle}>
            {displayStats ? `${displayStats.total_fans} fans tracked` : 'Track your top supporters'}
          </Animated.Text>
        </View>
      </View>

      {/* Creator Selector */}
      {creators.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.creatorSelector}
          contentContainerStyle={styles.creatorSelectorContent}
        >
          {creators.map((creator) => (
            <TouchableOpacity
              key={creator._id}
              testID={`fans-creator-chip-${creator.tiktok_username}`}
              style={[
                styles.creatorChip,
                selectedCreator === creator._id && styles.creatorChipActive,
              ]}
              onPress={() => {
                analyticsTracker.buttonClick('fans_select_creator', { creator: creator.tiktok_username });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCreator(creator._id);
              }}
            >
              <Text
                style={[
                  styles.creatorChipText,
                  selectedCreator === creator._id && styles.creatorChipTextActive,
                ]}
              >
                @{creator.tiktok_username}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Stats Overview */}
      {renderStatsOverview()}

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            testID={`fans-tab-${tab.key}`}
            style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
            onPress={() => handleTabChange(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TikTokTheme.colors.brand.cyan} colors={[TikTokTheme.colors.brand.cyan]} />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function FansScreen() {
  return (
    <GodTierErrorBoundary>
      <FansScreenContent />
      <GodTierMetricsBadge />
    </GodTierErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  offlineBanner: { backgroundColor: TikTokTheme.colors.status.warning, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  offlineText: { fontSize: 12, fontWeight: '600', color: TikTokTheme.colors.background.primary },
  heroContainer: { height: 120, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  creatorSelector: { maxHeight: 52, marginVertical: 12 },
  creatorSelectorContent: { paddingHorizontal: TikTokTheme.spacing.base, gap: 8 },
  creatorChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  creatorChipActive: { backgroundColor: TikTokTheme.colors.brand.cyan, borderColor: TikTokTheme.colors.brand.cyan },
  creatorChipText: { fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.primary },
  creatorChipTextActive: { color: TikTokTheme.colors.background.primary },
  statsOverview: { flexDirection: 'row', paddingHorizontal: TikTokTheme.spacing.base, marginBottom: 12, gap: 12 },
  statCard: { flex: 1, height: 110, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  statCardBlur: { flex: 1 },
  statCardContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statCardValue: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 6 },
  statCardLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted, marginTop: 4, textAlign: 'center' },
  tabSelector: { flexDirection: 'row', paddingHorizontal: TikTokTheme.spacing.base, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: TikTokTheme.colors.brand.cyan },
  tabText: { fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.secondary },
  tabTextActive: { color: TikTokTheme.colors.brand.cyan },
  tabContent: { paddingHorizontal: TikTokTheme.spacing.base },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  fanCard: { borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  fanBlur: { flex: 1 },
  fanCardInner: { padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  fanHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankGold: { backgroundColor: 'rgba(255, 215, 0, 0.4)' },
  rankSilver: { backgroundColor: 'rgba(192, 192, 192, 0.4)' },
  rankBronze: { backgroundColor: 'rgba(205, 127, 50, 0.4)' },
  rankText: { fontSize: 12, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  fanAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarEmoji: { fontSize: 24 },
  fanInfo: { flex: 1 },
  fanName: { fontSize: 16, fontWeight: '600', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  fanUsername: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  tierBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  tierText: { fontSize: 10, fontWeight: '700' },
  fanStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginTop: 4 },
  statLabel: { fontSize: 10, color: TikTokTheme.colors.text.muted, marginTop: 2 },
  badgesContainer: { marginTop: 8 },
  badgesTitle: { fontSize: 12, color: TikTokTheme.colors.text.secondary, marginBottom: 8 },
  badgesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.08)', justifyContent: 'center', alignItems: 'center' },
  badgeIcon: { fontSize: 16 },
  badgeMore: { fontSize: 10, fontWeight: '700', color: TikTokTheme.colors.text.secondary },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: TikTokTheme.colors.text.muted, marginTop: 8 },
});
