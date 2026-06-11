import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { GodTierMetricsBadge } from '../../src/components/GodTierMetricsBadge';
import { useNetwork } from '../../src/hooks/GodTierHooks';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

function TopFansScreenContent() {
  // God Tier: Network detection
  const { isConnected } = useNetwork();

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('top_fans_screen');
    analyticsTracker.screenView('top_fans');
    return () => stopTimer();
  }, []);
  const [refreshing, setRefreshing] = useState(false);
  const [fans] = useState([
    { rank: 1, username: 'superfan123', tier: 'Diamond', totalGifts: 12450, totalValue: 245000, avatar: '💎' },
    { rank: 2, username: 'megasupporter', tier: 'Diamond', totalGifts: 9820, totalValue: 198000, avatar: '⭐' },
    { rank: 3, username: 'loyalfan99', tier: 'Gold', totalGifts: 7650, totalValue: 156000, avatar: '👑' },
    { rank: 4, username: 'topviewer', tier: 'Gold', totalGifts: 6340, totalValue: 134000, avatar: '🔥' },
    { rank: 5, username: 'dailywatcher', tier: 'Gold', totalGifts: 5120, totalValue: 98000, avatar: '⚡' },
    { rank: 6, username: 'bigsupporter', tier: 'Silver', totalGifts: 4560, totalValue: 87000, avatar: '💫' },
  ]);

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_top_fans');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTierColor = (tier: string) => {
    if (tier === 'Diamond') return TikTokTheme.colors.brand.cyan;
    if (tier === 'Gold') return '#FFD700';
    return '#C0C0C0';
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'rgba(255, 215, 0, 0.3)', color: '#FFD700' };
    if (rank === 2) return { bg: 'rgba(192, 192, 192, 0.3)', color: '#C0C0C0' };
    if (rank === 3) return { bg: 'rgba(205, 127, 50, 0.3)', color: '#CD7F32' };
    return { bg: 'rgba(255, 255, 255, 0.1)', color: TikTokTheme.colors.text.primary };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Live data paused</Text>
        </Animated.View>
      )}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1604941878418-b0fbf86e3590?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.starIcon}>
            <Ionicons name="star" size={36} color="#FFD700" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Top Fans
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Most engaged supporters
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
        {/* Podium - Top 3 */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.podiumSection}>
          <View style={styles.podiumCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
              style={styles.podiumBackground}
              blurRadius={4}
            />
            <BlurView intensity={60} style={styles.podiumBlur}>
              <View style={styles.podiumContent}>
                <View style={styles.podiumRow}>
                  {/* 2nd Place */}
                  <View style={styles.podiumPlace}>
                    <Text style={styles.podiumEmoji}>{fans[1].avatar}</Text>
                    <View style={[styles.podiumRank, { backgroundColor: 'rgba(192, 192, 192, 0.3)' }]}>
                      <Text style={[styles.podiumRankText, { color: '#C0C0C0' }]}>2</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>@{fans[1].username}</Text>
                    <Text style={styles.podiumValue}>{formatNumber(fans[1].totalGifts)} gifts</Text>
                  </View>

                  {/* 1st Place */}
                  <View style={[styles.podiumPlace, styles.firstPlace]}>
                    <Text style={[styles.podiumEmoji, { fontSize: 48 }]}>{fans[0].avatar}</Text>
                    <View style={[styles.podiumRank, { backgroundColor: 'rgba(255, 215, 0, 0.3)', width: 48, height: 48 }]}>
                      <Ionicons name="trophy" size={20} color="#FFD700" />
                      <Text style={[styles.podiumRankText, { color: '#FFD700', fontSize: 20 }]}>1</Text>
                    </View>
                    <Text style={[styles.podiumName, { fontSize: 16 }]} numberOfLines={1}>@{fans[0].username}</Text>
                    <Text style={[styles.podiumValue, { fontSize: 14 }]}>{formatNumber(fans[0].totalGifts)} gifts</Text>
                  </View>

                  {/* 3rd Place */}
                  <View style={styles.podiumPlace}>
                    <Text style={styles.podiumEmoji}>{fans[2].avatar}</Text>
                    <View style={[styles.podiumRank, { backgroundColor: 'rgba(205, 127, 50, 0.3)' }]}>
                      <Text style={[styles.podiumRankText, { color: '#CD7F32' }]}>3</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>@{fans[2].username}</Text>
                    <Text style={styles.podiumValue}>{formatNumber(fans[2].totalGifts)} gifts</Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </View>
        </Animated.View>

        {/* Fan List */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>All Top Fans</Text>
        </Animated.View>

        <View style={styles.fanGrid}>
          {fans.map((fan, index) => (
            <Animated.View key={fan.rank} entering={FadeInDown.delay(450 + index * 50)} style={styles.fanCard}>
              <BlurView intensity={40} style={styles.fanBlur}>
                <View style={styles.fanContent}>
                  <View style={[styles.rankBadge, { backgroundColor: getRankStyle(fan.rank).bg }]}>
                    <Text style={[styles.rankText, { color: getRankStyle(fan.rank).color }]}>#{fan.rank}</Text>
                  </View>
                  <Text style={styles.fanEmoji}>{fan.avatar}</Text>
                  <Text style={styles.fanName} numberOfLines={1}>@{fan.username}</Text>
                  <View style={[styles.tierBadge, { backgroundColor: `${getTierColor(fan.tier)}20` }]}>
                    <Text style={[styles.tierText, { color: getTierColor(fan.tier) }]}>{fan.tier}</Text>
                  </View>
                  <View style={styles.fanStats}>
                    <Ionicons name="gift" size={14} color={TikTokTheme.colors.brand.cyan} />
                    <Text style={styles.fanStatText}>{formatNumber(fan.totalGifts)}</Text>
                  </View>
                  <Text style={styles.fanValue}>${(fan.totalValue / 100).toFixed(0)}</Text>
                </View>
              </BlurView>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  offlineBanner: { backgroundColor: TikTokTheme.colors.status.warning, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  offlineText: { fontSize: 12, fontWeight: '600', color: TikTokTheme.colors.background.primary },
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  heroContainer: { height: 160, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  starIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255, 215, 0, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#FFD700' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  podiumSection: { marginBottom: TikTokTheme.spacing.base },
  podiumCard: { height: 220, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  podiumBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  podiumBlur: { flex: 1 },
  podiumContent: { flex: 1, justifyContent: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  podiumRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  podiumPlace: { alignItems: 'center', flex: 1 },
  firstPlace: { marginBottom: 16 },
  podiumEmoji: { fontSize: 36, marginBottom: 8 },
  podiumRank: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  podiumRankText: { fontSize: 16, fontWeight: '900' },
  podiumName: { fontSize: 13, fontWeight: '600', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  podiumValue: { fontSize: 11, color: TikTokTheme.colors.brand.cyan, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  fanGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: TikTokTheme.spacing.base },
  fanCard: { width: CARD_WIDTH, height: 200, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 2 },
  fanBlur: { flex: 1 },
  fanContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  rankBadge: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 13, fontWeight: '900' },
  fanEmoji: { fontSize: 40, marginBottom: 8 },
  fanName: { fontSize: 15, fontWeight: '600', color: TikTokTheme.colors.text.primary, marginBottom: 6 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  tierText: { fontSize: 11, fontWeight: '700' },
  fanStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  fanStatText: { fontSize: 13, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  fanValue: { fontSize: 16, fontWeight: '900', color: TikTokTheme.colors.brand.cyan },
});

export default function TopFansScreen() {
  return (
    <GodTierErrorBoundary>
      <TopFansScreenContent />
      <GodTierMetricsBadge />
    </GodTierErrorBoundary>
  );
}
