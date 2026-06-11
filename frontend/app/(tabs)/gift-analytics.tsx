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

function GiftAnalyticsScreenContent() {
  // God Tier: Network detection
  const { isConnected } = useNetwork();

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('gift_analytics_screen');
    analyticsTracker.screenView('gift_analytics');
    return () => stopTimer();
  }, []);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalGifts: 12450,
    totalValue: 245000,
    avgGiftValue: 19.68,
    topGift: 'Rose',
    topGiftCount: 3420,
  });

  const giftDistribution = [
    { name: 'Rose', count: 3420, value: 68400, color: '#FE2C55' },
    { name: 'Diamond', count: 890, value: 89000, color: '#00F2EA' },
    { name: 'Crown', count: 560, value: 56000, color: '#FFD700' },
    { name: 'Heart', count: 2340, value: 23400, color: '#FF6B9D' },
    { name: 'Other', count: 5240, value: 8240, color: '#A855F7' },
  ];

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_gift_analytics');
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
          source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.giftIcon}>
            <Ionicons name="gift" size={36} color="#FFD700" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Gift Analytics
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {formatNumber(stats.totalGifts)} gifts received
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
        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsGrid}>
          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="gift" size={28} color="#FFD700" />
                <Text style={styles.statValue}>{formatNumber(stats.totalGifts)}</Text>
                <Text style={styles.statLabel}>Total Gifts</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="cash" size={28} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.statValue}>${(stats.totalValue / 100).toFixed(0)}</Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Top Gift Card */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.topGiftSection}>
          <Text style={styles.sectionTitle}>Most Popular Gift</Text>
          <View style={styles.topGiftCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=400&q=80' }}
              style={styles.topGiftBackground}
              blurRadius={4}
            />
            <BlurView intensity={60} style={styles.topGiftBlur}>
              <LinearGradient
                colors={['rgba(254, 44, 85, 0.2)', 'rgba(254, 44, 85, 0.05)']}
                style={styles.topGiftContent}
              >
                <Text style={styles.topGiftEmoji}>🌹</Text>
                <Text style={styles.topGiftName}>{stats.topGift}</Text>
                <Text style={styles.topGiftCount}>{formatNumber(stats.topGiftCount)} received</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Gift Distribution */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Gift Distribution</Text>
        </Animated.View>

        {giftDistribution.map((gift, index) => (
          <Animated.View key={gift.name} entering={FadeInDown.delay(550 + index * 50)} style={styles.giftCard}>
            <BlurView intensity={40} style={styles.giftBlur}>
              <View style={styles.giftContent}>
                <View style={[styles.giftIndicator, { backgroundColor: gift.color }]} />
                <View style={styles.giftInfo}>
                  <Text style={styles.giftName}>{gift.name}</Text>
                  <Text style={styles.giftCount}>{formatNumber(gift.count)} gifts</Text>
                </View>
                <View style={styles.giftValue}>
                  <Text style={styles.giftValueText}>${(gift.value / 100).toFixed(0)}</Text>
                  <Text style={styles.giftPercentage}>{((gift.count / stats.totalGifts) * 100).toFixed(1)}%</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        ))}
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
  giftIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255, 215, 0, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#FFD700' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', gap: TikTokTheme.spacing.base, marginBottom: TikTokTheme.spacing.base },
  statCard: { flex: 1, height: 120, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  statBlur: { flex: 1 },
  statContent: { flex: 1, padding: TikTokTheme.spacing.base, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statValue: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 8 },
  statLabel: { fontSize: 12, color: TikTokTheme.colors.text.muted, marginTop: 4 },
  topGiftSection: { marginBottom: TikTokTheme.spacing.base },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  topGiftCard: { height: 140, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  topGiftBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  topGiftBlur: { flex: 1 },
  topGiftContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(254, 44, 85, 0.3)' },
  topGiftEmoji: { fontSize: 48, marginBottom: 8 },
  topGiftName: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  topGiftCount: { fontSize: 14, color: TikTokTheme.colors.brand.pink, fontWeight: '700' },
  giftCard: { height: 70, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 8, elevation: 2 },
  giftBlur: { flex: 1 },
  giftContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', gap: 12 },
  giftIndicator: { width: 4, height: 40, borderRadius: 2 },
  giftInfo: { flex: 1 },
  giftName: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  giftCount: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  giftValue: { alignItems: 'flex-end' },
  giftValueText: { fontSize: 18, fontWeight: '900', color: TikTokTheme.colors.brand.cyan, marginBottom: 2 },
  giftPercentage: { fontSize: 11, color: TikTokTheme.colors.text.muted },
});

export default function GiftAnalyticsScreen() {
  return (
    <GodTierErrorBoundary>
      <GiftAnalyticsScreenContent />
      <GodTierMetricsBadge />
    </GodTierErrorBoundary>
  );
}
