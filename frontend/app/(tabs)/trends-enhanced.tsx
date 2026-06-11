import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Share, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { useNetwork, useLocalStorage } from '../../src/hooks/GodTierHooks';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { VictoryLine, VictoryChart, VictoryTheme } from 'victory-native';

const { width } = Dimensions.get('window');

interface TrendPoint {
  x: string;
  y: number;
}

interface Insight {
  icon: string;
  text: string;
  color: string;
}

const DEFAULT_TREND_DATA: TrendPoint[] = [
  { x: 'Mon', y: 12 },
  { x: 'Tue', y: 18 },
  { x: 'Wed', y: 15 },
  { x: 'Thu', y: 22 },
  { x: 'Fri', y: 28 },
  { x: 'Sat', y: 35 },
  { x: 'Sun', y: 30 },
];

const DEFAULT_INSIGHTS: Insight[] = [
  { icon: 'trending-up', text: 'Revenue up 28% this week', color: '#10B981' },
  { icon: 'people', text: 'Audience growing 15% monthly', color: TikTokTheme.colors.brand.cyan },
  { icon: 'gift', text: 'Gifts increased 40% weekend', color: '#FE2C55' },
];

function TrendsScreenContent() {
  const [refreshing, setRefreshing] = useState(false);
  const [trendData, setTrendData] = useState<TrendPoint[]>(DEFAULT_TREND_DATA);
  const [insights, setInsights] = useState<Insight[]>(DEFAULT_INSIGHTS);

  // God Tier: Network detection
  const { isConnected } = useNetwork();

  // God Tier: Cached data for offline support
  const [cachedTrendData, setCachedTrendData] = useLocalStorage<TrendPoint[]>('trends_data', []);

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('trends_screen');
    analyticsTracker.screenView('trends');
    return () => stopTimer();
  }, []);

  // Cache trend data when online
  useEffect(() => {
    if (isConnected && trendData.length > 0) {
      setCachedTrendData(trendData);
    }
  }, [trendData, isConnected]);

  const displayTrendData = !isConnected && cachedTrendData.length > 0 ? cachedTrendData : trendData;

  const loadTrends = async () => {
    const stopTimer = performanceMonitor.startTimer('load_trends');
    try {
      // TODO: Replace with real API once trends endpoints are live
      setTrendData(DEFAULT_TREND_DATA);
      setInsights(DEFAULT_INSIGHTS);
      analyticsTracker.track('trends_loaded', { points: DEFAULT_TREND_DATA.length });
    } catch (error) {
      console.error('Failed to load trends:', error);
      analyticsTracker.track('trends_load_failed', { error: String(error) });
    } finally {
      stopTimer();
    }
  };

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_trends');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadTrends();
    setRefreshing(false);
  };

  const handleShareTrends = async () => {
    analyticsTracker.buttonClick('share_trends');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const peak = displayTrendData.reduce((max, p) => (p.y > max.y ? p : max), displayTrendData[0]);
    const shareData = `
Growth Trends
=============
Weekly trend: +28%
Peak day: ${peak.x} (${peak.y})

${insights.map(i => `• ${i.text}`).join('\n')}

Shared: ${new Date().toLocaleString()}
    `.trim();

    try {
      await Share.share({ message: shareData, title: 'Growth Trends' });
      analyticsTracker.track('trends_shared');
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const weeklyGrowth = '+28%';
  const peakDay = displayTrendData.reduce((max, p) => (p.y > max.y ? p : max), displayTrendData[0]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Showing cached trends</Text>
        </Animated.View>
      )}

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']} style={styles.heroGradient} />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.trendIcon}>
            <Ionicons name="trending-up" size={36} color="#10B981" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Growth Trends
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {weeklyGrowth} this week
          </Animated.Text>
        </View>

        {/* Share Button */}
        <TouchableOpacity testID="trends-share-button" style={styles.shareButton} onPress={handleShareTrends}>
          <Ionicons name="share-outline" size={22} color={TikTokTheme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TikTokTheme.colors.brand.cyan} colors={[TikTokTheme.colors.brand.cyan]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Stats */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.summaryRow}>
          <View testID="trends-weekly-growth-card" style={styles.summaryCard}>
            <BlurView intensity={40} style={styles.summaryBlur}>
              <LinearGradient colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']} style={styles.summaryContent}>
                <Ionicons name="trending-up" size={24} color="#10B981" />
                <Text style={styles.summaryValue}>{weeklyGrowth}</Text>
                <Text style={styles.summaryLabel}>Weekly Growth</Text>
              </LinearGradient>
            </BlurView>
          </View>
          <View testID="trends-peak-day-card" style={styles.summaryCard}>
            <BlurView intensity={40} style={styles.summaryBlur}>
              <LinearGradient colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']} style={styles.summaryContent}>
                <Ionicons name="flame" size={24} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.summaryValue}>{peakDay.x}</Text>
                <Text style={styles.summaryLabel}>Peak Day</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Trend Chart */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.chartCard}>
          <BlurView intensity={40} style={styles.chartBlur}>
            <Text style={styles.chartTitle}>Weekly Revenue Trend</Text>
            {displayTrendData.length > 0 ? (
              <VictoryChart theme={VictoryTheme.material} height={200} width={width - 64}>
                <VictoryLine
                  data={displayTrendData}
                  style={{
                    data: { stroke: '#10B981', strokeWidth: 3 },
                  }}
                  interpolation="monotoneX"
                />
              </VictoryChart>
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={48} color={TikTokTheme.colors.text.muted} />
                <Text style={styles.emptyChartText}>No trend data available</Text>
              </View>
            )}
          </BlurView>
        </Animated.View>

        {/* Key Insights */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
        </Animated.View>

        {insights.map((insight, index) => (
          <Animated.View key={index} entering={FadeInDown.delay(450 + index * 50)} style={styles.insightCard}>
            <BlurView intensity={30} style={styles.insightBlur}>
              <View testID={`trends-insight-${index}`} style={styles.insightContent}>
                <View style={[styles.insightIcon, { backgroundColor: `${insight.color}20` }]}>
                  <Ionicons name={insight.icon as any} size={24} color={insight.color} />
                </View>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            </BlurView>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function TrendsScreen() {
  return (
    <GodTierErrorBoundary>
      <TrendsScreenContent />
    </GodTierErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  offlineBanner: { backgroundColor: TikTokTheme.colors.status.warning, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  offlineText: { fontSize: 12, fontWeight: '600', color: TikTokTheme.colors.background.primary },
  heroContainer: { height: 160, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  trendIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#10B981' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#10B981' },
  shareButton: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  summaryRow: { flexDirection: 'row', gap: TikTokTheme.spacing.base, marginBottom: TikTokTheme.spacing.base },
  summaryCard: { flex: 1, height: 110, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  summaryBlur: { flex: 1 },
  summaryContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  summaryValue: { fontSize: 22, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 6 },
  summaryLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted, marginTop: 4 },
  chartCard: { height: 280, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  chartBlur: { flex: 1, padding: TikTokTheme.spacing.base },
  chartTitle: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  emptyChart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyChartText: { fontSize: 14, color: TikTokTheme.colors.text.muted, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  insightCard: { height: 70, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  insightBlur: { flex: 1 },
  insightContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  insightIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  insightText: { flex: 1, fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.primary },
});
