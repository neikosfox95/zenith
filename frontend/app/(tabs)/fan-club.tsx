import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Share, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { GodTierMetricsBadge } from '../../src/components/GodTierMetricsBadge';
import { useNetwork, useLocalStorage } from '../../src/hooks/GodTierHooks';
import { TikTokTheme } from '../../theme/TikTokTheme';

const { width } = Dimensions.get('window');

interface FanClubStats {
  totalMembers: number;
  activeFans: number;
  topSupporter: string;
  totalBadges: number;
  tier1: number;
  tier2: number;
  tier3: number;
}

const DEFAULT_STATS: FanClubStats = {
  totalMembers: 12450,
  activeFans: 8320,
  topSupporter: '@superfan123',
  totalBadges: 24,
  tier1: 8200,
  tier2: 3100,
  tier3: 1150,
};

function FanClubScreenContent() {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<FanClubStats>(DEFAULT_STATS);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // God Tier: Network detection
  const { isConnected } = useNetwork();

  // God Tier: Cached data for offline support
  const [cachedStats, setCachedStats] = useLocalStorage<FanClubStats | null>('fan_club_stats', null);

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('fan_club_screen');
    analyticsTracker.screenView('fan_club');
    return () => stopTimer();
  }, []);

  // Cache stats when online
  useEffect(() => {
    if (isConnected && stats) {
      setCachedStats(stats);
    }
  }, [stats, isConnected]);

  const displayStats = !isConnected && cachedStats ? cachedStats : stats;

  const loadStats = async () => {
    const stopTimer = performanceMonitor.startTimer('load_fan_club_stats');
    try {
      // TODO: Replace with real API once fan club endpoints are live
      setStats(DEFAULT_STATS);
      analyticsTracker.track('fan_club_loaded', { members: DEFAULT_STATS.totalMembers });
    } catch (error) {
      console.error('Failed to load fan club stats:', error);
      analyticsTracker.track('fan_club_load_failed', { error: String(error) });
    } finally {
      stopTimer();
    }
  };

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_fan_club');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleShareFanClub = async () => {
    analyticsTracker.buttonClick('share_fan_club');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const shareData = `
Fan Club Stats
==============
Total Members: ${formatNumber(displayStats.totalMembers)}
Active Fans: ${formatNumber(displayStats.activeFans)}
Top Supporter: ${displayStats.topSupporter}
Diamond Fans: ${formatNumber(displayStats.tier3)}

Shared: ${new Date().toLocaleString()}
    `.trim();

    try {
      await Share.share({ message: shareData, title: 'Fan Club Stats' });
      analyticsTracker.track('fan_club_shared');
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const tiers = [
    { name: 'Silver Fans', description: 'Regular supporters', icon: 'star' as const, color: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.3)', count: displayStats.tier1 },
    { name: 'Gold Fans', description: 'Dedicated supporters', icon: 'star' as const, color: '#FFD700', bg: 'rgba(255, 215, 0, 0.3)', count: displayStats.tier2 },
    { name: 'Diamond Fans', description: 'Elite supporters', icon: 'diamond' as const, color: TikTokTheme.colors.brand.cyan, bg: 'rgba(0, 242, 234, 0.3)', count: displayStats.tier3 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Showing cached fan club data</Text>
        </Animated.View>
      )}

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']} style={styles.heroGradient} />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.fanIcon}>
            <Ionicons name="heart" size={36} color={TikTokTheme.colors.brand.pink} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Fan Club
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {formatNumber(displayStats.totalMembers)} members strong
          </Animated.Text>
        </View>

        {/* Quick Actions Button */}
        <TouchableOpacity
          testID="fan-club-quick-actions-button"
          style={styles.quickActionsButton}
          onPress={() => {
            analyticsTracker.buttonClick('fan_club_quick_actions_toggle');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowQuickActions(!showQuickActions);
          }}
        >
          <Ionicons name={showQuickActions ? 'close' : 'ellipsis-horizontal'} size={24} color={TikTokTheme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions Menu */}
      {showQuickActions && (
        <Animated.View entering={FadeInDown} style={styles.quickActionsMenu}>
          <BlurView intensity={80} style={styles.quickActionsBlur}>
            <TouchableOpacity testID="fan-club-share-button" style={styles.quickActionItem} onPress={handleShareFanClub}>
              <Ionicons name="share-outline" size={20} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.quickActionText}>Share Fan Club Stats</Text>
            </TouchableOpacity>
            <View style={styles.quickActionDivider} />
            <TouchableOpacity testID="fan-club-refresh-button" style={styles.quickActionItem} onPress={handleRefresh}>
              <Ionicons name="refresh" size={20} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.quickActionText}>Refresh Data</Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TikTokTheme.colors.brand.cyan} colors={[TikTokTheme.colors.brand.cyan]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsGrid}>
          <View testID="fan-club-total-members-card" style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']} style={styles.statContent}>
                <Ionicons name="people" size={32} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.statValue}>{formatNumber(displayStats.totalMembers)}</Text>
                <Text style={styles.statLabel}>Total Members</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View testID="fan-club-active-fans-card" style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient colors={['rgba(254, 44, 85, 0.15)', 'rgba(254, 44, 85, 0.05)']} style={styles.statContent}>
                <Ionicons name="flame" size={32} color={TikTokTheme.colors.brand.pink} />
                <Text style={styles.statValue}>{formatNumber(displayStats.activeFans)}</Text>
                <Text style={styles.statLabel}>Active Fans</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Top Supporter Card */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.topSupporterSection}>
          <Text style={styles.sectionTitle}>Top Supporter</Text>
          <View testID="fan-club-top-supporter-card" style={styles.topSupporterCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=400&q=80' }}
              style={styles.topSupporterBackground}
              blurRadius={4}
            />
            <BlurView intensity={60} style={styles.topSupporterBlur}>
              <LinearGradient colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)']} style={styles.topSupporterContent}>
                <View style={styles.crownIcon}>
                  <Ionicons name="trophy" size={32} color="#FFD700" />
                </View>
                <Text style={styles.topSupporterName}>{displayStats.topSupporter}</Text>
                <Text style={styles.topSupporterBadge}>👑 VIP Fan</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Tier Breakdown */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Membership Tiers</Text>
        </Animated.View>

        {tiers.map((tier, index) => (
          <Animated.View key={tier.name} entering={FadeInDown.delay(550 + index * 50)} style={styles.tierCard}>
            <BlurView intensity={40} style={styles.tierBlur}>
              <View style={styles.tierContent}>
                <View style={[styles.tierIcon, { backgroundColor: tier.bg }]}>
                  <Ionicons name={tier.icon} size={24} color={tier.color} />
                </View>
                <View style={styles.tierInfo}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierDescription}>{tier.description}</Text>
                </View>
                <View style={styles.tierStats}>
                  <Text style={styles.tierCount}>{formatNumber(tier.count)}</Text>
                  <Text style={styles.tierLabel}>members</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        ))}

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.actionsSection}>
          <TouchableOpacity
            testID="fan-club-view-top-fans-button"
            style={styles.actionButton}
            onPress={() => {
              analyticsTracker.buttonClick('view_top_fans');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <LinearGradient
              colors={[TikTokTheme.colors.brand.cyan, TikTokTheme.colors.charts.tertiary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="people" size={20} color={TikTokTheme.colors.background.primary} />
              <Text style={styles.actionText}>View Top Fans</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            testID="fan-club-view-badges-button"
            style={styles.actionButton}
            onPress={() => {
              analyticsTracker.buttonClick('view_badges');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <LinearGradient
              colors={[TikTokTheme.colors.brand.pink, '#FF6B9D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="ribbon" size={20} color={TikTokTheme.colors.background.primary} />
              <Text style={styles.actionText}>View Badges</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function FanClubScreen() {
  return (
    <GodTierErrorBoundary>
      <FanClubScreenContent />
      <GodTierMetricsBadge />
    </GodTierErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  offlineBanner: { backgroundColor: TikTokTheme.colors.status.warning, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  offlineText: { fontSize: 12, fontWeight: '600', color: TikTokTheme.colors.background.primary },
  heroContainer: { height: 180, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fanIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(254, 44, 85, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.pink },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  quickActionsButton: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  quickActionsMenu: { marginHorizontal: 16, marginTop: -16, marginBottom: 8, borderRadius: 12, overflow: 'hidden', elevation: 8 },
  quickActionsBlur: { padding: 4 },
  quickActionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  quickActionText: { fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.primary },
  quickActionDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginVertical: 4 },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', gap: TikTokTheme.spacing.base, marginBottom: TikTokTheme.spacing.base },
  statCard: { flex: 1, height: 140, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  statBlur: { flex: 1 },
  statContent: { flex: 1, padding: TikTokTheme.spacing.base, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statValue: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 8 },
  statLabel: { fontSize: 12, color: TikTokTheme.colors.text.muted, marginTop: 4, textAlign: 'center' },
  topSupporterSection: { marginBottom: TikTokTheme.spacing.base },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  topSupporterCard: { height: 160, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  topSupporterBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  topSupporterBlur: { flex: 1 },
  topSupporterContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)' },
  crownIcon: { marginBottom: 12 },
  topSupporterName: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 8 },
  topSupporterBadge: { fontSize: 16, color: '#FFD700', fontWeight: '700' },
  tierCard: { height: 80, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  tierBlur: { flex: 1 },
  tierContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', gap: 12 },
  tierIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  tierInfo: { flex: 1 },
  tierName: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  tierDescription: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  tierStats: { alignItems: 'flex-end' },
  tierCount: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.brand.cyan, marginBottom: 2 },
  tierLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted },
  actionsSection: { flexDirection: 'row', gap: TikTokTheme.spacing.base, marginTop: 8 },
  actionButton: { flex: 1, height: 56, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', elevation: 4 },
  actionGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.background.primary },
});
