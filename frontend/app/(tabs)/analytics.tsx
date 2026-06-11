import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, Image, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { GodTierMetricsBadge } from '../../src/components/GodTierMetricsBadge';
import { useApiCall, useNetwork, useLocalStorage } from '../../src/hooks/GodTierHooks';
import { useAnalytics } from '../../src/hooks/realtime';
import { useAnalyticsStore } from '../../src/stores/analyticsStore';
import { useUIStore } from '../../src/stores/uiStore';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { analyticsAPI } from '../../src/services/api';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryAxis, VictoryArea } from 'victory-native';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

function AnalyticsScreenContent() {
  const { summary } = useAnalytics();
  const { topGifters, revenueHistory, setTopGifters, setRevenueHistory } = useAnalyticsStore();
  const { refreshing, setRefreshing } = useUIStore();
  const [aiInsight, setAiInsight] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);

  // God Tier: Network detection
  const { isConnected } = useNetwork();
  
  // God Tier: Cached data
  const [cachedSummary, setCachedSummary] = useLocalStorage('analytics_summary', null);
  const [cachedGifters, setCachedGifters] = useLocalStorage('analytics_gifters', []);
  const [cachedRevenue, setCachedRevenue] = useLocalStorage('analytics_revenue', []);

  // God Tier: Performance monitoring
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('analytics_screen');
    analyticsTracker.screenView('analytics');
    return () => stopTimer();
  }, []);

  // Use cached data when offline
  const displaySummary = !isConnected && cachedSummary ? cachedSummary : summary;
  const displayGifters = !isConnected && cachedGifters.length > 0 ? cachedGifters : topGifters;
  const displayRevenue = !isConnected && cachedRevenue.length > 0 ? cachedRevenue : revenueHistory;

  useEffect(() => {
    loadAnalytics();
    generateAIInsight();
  }, []);

  // Cache data when online
  useEffect(() => {
    if (isConnected) {
      if (summary) setCachedSummary(summary);
      if (topGifters.length > 0) setCachedGifters(topGifters);
      if (revenueHistory.length > 0) setCachedRevenue(revenueHistory);
    }
  }, [summary, topGifters, revenueHistory, isConnected]);

  const loadAnalytics = async () => {
    const startTimer = performanceMonitor.startTimer('load_analytics');
    try {
      const [giftersData, revenueData] = await Promise.all([
        analyticsAPI.getTopGifters(10),
        analyticsAPI.getRevenueHistory(7),
      ]);
      setTopGifters(giftersData);
      setRevenueHistory(revenueData);
      analyticsTracker.track('analytics_loaded', { gifters: giftersData.length });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      analyticsTracker.track('analytics_load_failed', { error: String(error) });
    } finally {
      startTimer();
    }
  };

  const generateAIInsight = async () => {
    setAiInsight('Peak engagement detected during evening hours. Consider scheduling streams between 7-9 PM for maximum revenue.');
  };

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_analytics');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadAnalytics();
    await generateAIInsight();
    setRefreshing(false);
  };

  const handleExportAnalytics = async () => {
    analyticsTracker.buttonClick('export_analytics');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const exportData = `
Analytics Export
================
Total Revenue: ${formatCurrency(displaySummary.total_revenue)}
Total Gifts: ${formatNumber(displaySummary.total_gifts)}
Total Viewers: ${formatNumber(displaySummary.total_viewers)}
Peak Viewers: ${formatNumber(displaySummary.peak_viewers)}

Top Gifters:
${displayGifters.slice(0, 5).map((g, i) => `${i + 1}. ${g.username} - 💎${g.total_diamonds}`).join('\n')}

Exported: ${new Date().toLocaleString()}
    `.trim();
    
    try {
      await Share.share({ message: exportData, title: 'Analytics Export' });
      analyticsTracker.track('analytics_exported');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return `$${(value / 100).toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const chartData = displayRevenue.map((item, index) => ({
    x: index + 1,
    y: item.revenue / 100,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Showing cached analytics</Text>
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
          <Animated.Text entering={FadeIn} style={styles.heroTitle}>
            Analytics
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroSubtitle}>
            Performance Overview
          </Animated.Text>
        </View>
        
        {/* Quick Actions Button */}
        <TouchableOpacity 
          style={styles.quickActionsButton}
          onPress={() => {
            analyticsTracker.buttonClick('quick_actions_toggle');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowQuickActions(!showQuickActions);
          }}
        >
          <Ionicons name={showQuickActions ? "close" : "ellipsis-horizontal"} size={24} color={TikTokTheme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions Menu */}
      {showQuickActions && (
        <Animated.View entering={FadeInDown} style={styles.quickActionsMenu}>
          <BlurView intensity={80} style={styles.quickActionsBlur}>
            <TouchableOpacity style={styles.quickActionItem} onPress={handleExportAnalytics}>
              <Ionicons name="share-outline" size={20} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.quickActionText}>Export Analytics</Text>
            </TouchableOpacity>
            <View style={styles.quickActionDivider} />
            <TouchableOpacity style={styles.quickActionItem} onPress={handleRefresh}>
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
        {/* Key Metrics Grid */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <BlurView intensity={40} style={styles.metricBlur}>
              <LinearGradient colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']} style={styles.metricContent}>
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(0, 242, 234, 0.2)' }]}>
                  <Ionicons name="cash-outline" size={24} color={TikTokTheme.colors.brand.cyan} />
                </View>
                <Text style={styles.metricValue}>{formatCurrency(displaySummary.total_revenue)}</Text>
                <Text style={styles.metricLabel}>Total Revenue</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.metricCard}>
            <BlurView intensity={40} style={styles.metricBlur}>
              <LinearGradient colors={['rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.05)']} style={styles.metricContent}>
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                  <Ionicons name="gift-outline" size={24} color="#A855F7" />
                </View>
                <Text style={styles.metricValue}>{formatNumber(displaySummary.total_gifts)}</Text>
                <Text style={styles.metricLabel}>Total Gifts</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.metricCard}>
            <BlurView intensity={40} style={styles.metricBlur}>
              <LinearGradient colors={['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']} style={styles.metricContent}>
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                  <Ionicons name="eye-outline" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.metricValue}>{formatNumber(displaySummary.total_viewers)}</Text>
                <Text style={styles.metricLabel}>Total Viewers</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.metricCard}>
            <BlurView intensity={40} style={styles.metricBlur}>
              <LinearGradient colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']} style={styles.metricContent}>
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="trending-up" size={24} color="#10B981" />
                </View>
                <Text style={styles.metricValue}>{formatNumber(displaySummary.peak_viewers)}</Text>
                <Text style={styles.metricLabel}>Peak Viewers</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* AI Insight Card */}
        {aiInsight && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.insightSection}>
            <View style={styles.insightCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
                style={styles.insightBackground}
                blurRadius={4}
              />
              <BlurView intensity={60} style={styles.insightBlur}>
                <LinearGradient colors={['rgba(0, 242, 234, 0.2)', 'rgba(0, 212, 255, 0.1)']} style={styles.insightContent}>
                  <View style={styles.insightHeader}>
                    <View style={styles.aiIcon}>
                      <Ionicons name="sparkles" size={20} color={TikTokTheme.colors.brand.cyan} />
                    </View>
                    <Text style={styles.insightTitle}>AI Insight</Text>
                  </View>
                  <Text style={styles.insightText}>{aiInsight}</Text>
                </LinearGradient>
              </BlurView>
            </View>
          </Animated.View>
        )}

        {/* Revenue Chart Section */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Revenue Trend (Last 7 Days)</Text>
          <View style={styles.chartCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1587400563263-e77a5590bfe7?w=400&q=80' }}
              style={styles.chartBackground}
              blurRadius={4}
            />
            <BlurView intensity={50} style={styles.chartBlur}>
              <View style={styles.chartContent}>
                {chartData.length > 0 ? (
                  <VictoryChart
                    width={CHART_WIDTH - 32}
                    height={200}
                    theme={VictoryTheme.material}
                    padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
                  >
                    <VictoryAxis
                      style={{
                        axis: { stroke: 'rgba(255, 255, 255, 0.1)' },
                        tickLabels: { fill: TikTokTheme.colors.text.muted, fontSize: 10 },
                        grid: { stroke: 'rgba(255, 255, 255, 0.05)' },
                      }}
                    />
                    <VictoryAxis
                      dependentAxis
                      style={{
                        axis: { stroke: 'rgba(255, 255, 255, 0.1)' },
                        tickLabels: { fill: TikTokTheme.colors.text.muted, fontSize: 10 },
                        grid: { stroke: 'rgba(255, 255, 255, 0.05)' },
                      }}
                    />
                    <VictoryArea
                      data={chartData}
                      style={{
                        data: {
                          fill: 'rgba(0, 242, 234, 0.3)',
                          stroke: TikTokTheme.colors.brand.cyan,
                          strokeWidth: 2,
                        },
                      }}
                      interpolation="monotoneX"
                    />
                  </VictoryChart>
                ) : (
                  <View style={styles.emptyChart}>
                    <Ionicons name="bar-chart-outline" size={48} color={TikTokTheme.colors.text.muted} />
                    <Text style={styles.emptyChartText}>No data available</Text>
                  </View>
                )}
              </View>
            </BlurView>
          </View>
        </Animated.View>

        {/* Top Gifters Leaderboard */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.leaderboardSection}>
          <Text style={styles.sectionTitle}>Top Gifters</Text>
          <View style={styles.leaderboardCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1643962579745-bcaa05ffc573?w=400&q=80' }}
              style={styles.leaderboardBackground}
              blurRadius={4}
            />
            <BlurView intensity={60} style={styles.leaderboardBlur}>
              <View style={styles.leaderboardContent}>
                {displayGifters.length > 0 ? (
                  displayGifters.slice(0, 5).map((gifter, index) => (
                    <View key={index} style={styles.gifterRow}>
                      <View style={styles.gifterLeft}>
                        <View style={[
                          styles.rank,
                          index === 0 && styles.rankGold,
                          index === 1 && styles.rankSilver,
                          index === 2 && styles.rankBronze,
                        ]}>
                          <Text style={styles.rankText}>#{index + 1}</Text>
                        </View>
                        <Text style={styles.gifterName} numberOfLines={1}>
                          {gifter.username}
                        </Text>
                      </View>
                      <View style={styles.gifterRight}>
                        <Text style={styles.gifterDiamonds}>💎 {gifter.total_diamonds}</Text>
                        <Text style={styles.gifterCount}>{gifter.gift_count} gifts</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="trophy-outline" size={48} color={TikTokTheme.colors.text.muted} />
                    <Text style={styles.emptyText}>No gifters yet</Text>
                  </View>
                )}
              </View>
            </BlurView>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AnalyticsScreen() {
  return (
    <GodTierErrorBoundary>
      <AnalyticsScreenContent />
      <GodTierMetricsBadge />
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
  quickActionsButton: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  quickActionsMenu: { marginHorizontal: 16, marginTop: -16, marginBottom: 8, borderRadius: 12, overflow: 'hidden', elevation: 8 },
  quickActionsBlur: { padding: 4 },
  quickActionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  quickActionText: { fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.primary },
  quickActionDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginVertical: 4 },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: TikTokTheme.spacing.base, marginBottom: TikTokTheme.spacing.base },
  metricCard: { width: (width - 48) / 2, height: 140, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  metricBlur: { flex: 1 },
  metricContent: { flex: 1, padding: TikTokTheme.spacing.base, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  metricIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  metricValue: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 4 },
  metricLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted, textAlign: 'center', marginTop: 4 },
  insightSection: { marginBottom: TikTokTheme.spacing.base },
  insightCard: { height: 140, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  insightBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  insightBlur: { flex: 1 },
  insightContent: { flex: 1, padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  insightTitle: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  insightText: { fontSize: 14, color: TikTokTheme.colors.text.secondary, lineHeight: 20 },
  chartSection: { marginBottom: TikTokTheme.spacing.base },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: TikTokTheme.spacing.xs },
  chartCard: { height: 240, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  chartBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  chartBlur: { flex: 1 },
  chartContent: { flex: 1, padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  emptyChart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyChartText: { fontSize: 14, color: TikTokTheme.colors.text.muted, marginTop: 8 },
  leaderboardSection: { marginBottom: TikTokTheme.spacing.base },
  leaderboardCard: { minHeight: 200, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  leaderboardBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  leaderboardBlur: { flex: 1 },
  leaderboardContent: { padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  gifterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  gifterLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  rank: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankGold: { backgroundColor: 'rgba(255, 215, 0, 0.3)' },
  rankSilver: { backgroundColor: 'rgba(192, 192, 192, 0.3)' },
  rankBronze: { backgroundColor: 'rgba(205, 127, 50, 0.3)' },
  rankText: { fontSize: 12, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  gifterName: { flex: 1, fontSize: 15, fontWeight: '600', color: TikTokTheme.colors.text.primary },
  gifterRight: { alignItems: 'flex-end' },
  gifterDiamonds: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.brand.cyan },
  gifterCount: { fontSize: 12, color: TikTokTheme.colors.text.muted, marginTop: 2 },
  emptyState: { paddingVertical: 32, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: TikTokTheme.colors.text.muted, marginTop: 8 },
});
