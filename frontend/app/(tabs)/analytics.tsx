import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnalytics } from '../../src/hooks/realtime';
import { useAnalyticsStore } from '../../src/stores/analyticsStore';
import { useUIStore } from '../../src/stores/uiStore';
import { GlassCard } from '../../src/components/glass';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { analyticsAPI } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryAxis, VictoryArea } from 'victory-native';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

export default function AnalyticsScreen() {
  const { summary } = useAnalytics();
  const { topGifters, revenueHistory, setTopGifters, setRevenueHistory } = useAnalyticsStore();
  const { refreshing, setRefreshing } = useUIStore();
  const [aiInsight, setAiInsight] = useState('');

  useEffect(() => {
    loadAnalytics();
    generateAIInsight();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [giftersData, revenueData] = await Promise.all([
        analyticsAPI.getTopGifters(10),
        analyticsAPI.getRevenueHistory(7),
      ]);
      setTopGifters(giftersData);
      setRevenueHistory(revenueData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const generateAIInsight = async () => {
    // TODO: Call AI API for insights
    setAiInsight('Peak engagement detected during evening hours. Consider scheduling streams between 7-9 PM for maximum revenue.');
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadAnalytics();
    await generateAIInsight();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return `$${(value / 100).toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  // Prepare chart data
  const chartData = revenueHistory.map((item, index) => ({
    x: index + 1,
    y: item.revenue / 100,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
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
        {/* Header */}
        <Animated.View entering={FadeIn}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Performance Overview</Text>
        </Animated.View>

        {/* Key Metrics */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.metricsGrid}>
          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(0, 242, 234, 0.1)' }]}>
              <Ionicons name="cash-outline" size={24} color={TikTokTheme.colors.brand.cyan} />
            </View>
            <Text style={styles.metricValue}>{formatCurrency(summary.total_revenue)}</Text>
            <Text style={styles.metricLabel}>Total Revenue</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
              <Ionicons name="gift-outline" size={24} color="#A855F7" />
            </View>
            <Text style={styles.metricValue}>{formatNumber(summary.total_gifts)}</Text>
            <Text style={styles.metricLabel}>Total Gifts</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="eye-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.metricValue}>{formatNumber(summary.total_viewers)}</Text>
            <Text style={styles.metricLabel}>Total Viewers</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
            </View>
            <Text style={styles.metricValue}>{formatNumber(summary.peak_viewers)}</Text>
            <Text style={styles.metricLabel}>Peak Viewers</Text>
          </GlassCard>
        </Animated.View>

        {/* AI Insight */}
        {aiInsight && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <GlassCard style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <View style={styles.aiIcon}>
                  <Ionicons name="sparkles" size={20} color={TikTokTheme.colors.brand.cyan} />
                </View>
                <Text style={styles.insightTitle}>AI Insight</Text>
              </View>
              <Text style={styles.insightText}>{aiInsight}</Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* Revenue Chart */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Revenue Trend (Last 7 Days)</Text>
          <GlassCard style={styles.chartCard}>
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
                      fill: 'url(#gradient)',
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
          </GlassCard>
        </Animated.View>

        {/* Top Gifters */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Top Gifters</Text>
          <GlassCard style={styles.leaderboardCard}>
            {topGifters.length > 0 ? (
              topGifters.slice(0, 5).map((gifter, index) => (
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
          </GlassCard>
        </Animated.View>

        {/* Stream Stats */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Stream Statistics</Text>
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <Ionicons name="videocam-outline" size={20} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.statValue}>{summary.total_streams}</Text>
              <Text style={styles.statLabel}>Total Streams</Text>
            </GlassCard>
            <GlassCard style={styles.statCard}>
              <Ionicons name="time-outline" size={20} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.statValue}>{Math.round(summary.average_duration / 60)}m</Text>
              <Text style={styles.statLabel}>Avg Duration</Text>
            </GlassCard>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TikTokTheme.colors.background.primary,
  },
  scrollContent: {
    padding: TikTokTheme.spacing.base,
    paddingBottom: TikTokTheme.spacing['2xl'],
  },
  title: {
    fontSize: TikTokTheme.typography.fontSize['2xl'],
    fontWeight: TikTokTheme.typography.fontWeight.black,
    color: TikTokTheme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    color: TikTokTheme.colors.text.muted,
    marginBottom: TikTokTheme.spacing.base,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TikTokTheme.spacing.base,
    marginBottom: TikTokTheme.spacing.base,
  },
  metricCard: {
    width: (width - 48) / 2,
    padding: TikTokTheme.spacing.base,
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: TikTokTheme.spacing.xs,
  },
  metricValue: {
    fontSize: TikTokTheme.typography.fontSize.xl,
    fontWeight: TikTokTheme.typography.fontWeight.black,
    color: TikTokTheme.colors.text.primary,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    color: TikTokTheme.colors.text.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  insightCard: {
    padding: TikTokTheme.spacing.base,
    marginBottom: TikTokTheme.spacing.base,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: TikTokTheme.spacing.xs,
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 242, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: TikTokTheme.spacing.xs,
  },
  insightTitle: {
    fontSize: TikTokTheme.typography.fontSize.base,
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.text.primary,
  },
  insightText: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    color: TikTokTheme.colors.text.secondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: TikTokTheme.typography.fontSize.lg,
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.text.primary,
    marginBottom: TikTokTheme.spacing.xs,
    marginTop: TikTokTheme.spacing.base,
  },
  chartCard: {
    padding: TikTokTheme.spacing.base,
    marginBottom: TikTokTheme.spacing.base,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    color: TikTokTheme.colors.text.muted,
    marginTop: 8,
  },
  leaderboardCard: {
    padding: TikTokTheme.spacing.base,
    marginBottom: TikTokTheme.spacing.base,
  },
  gifterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: TikTokTheme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  gifterLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: TikTokTheme.spacing.xs,
  },
  rankGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  rankSilver: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
  },
  rankBronze: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
  },
  rankText: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.text.primary,
  },
  gifterName: {
    flex: 1,
    fontSize: TikTokTheme.typography.fontSize.sm,
    fontWeight: TikTokTheme.typography.fontWeight.semibold,
    color: TikTokTheme.colors.text.primary,
  },
  gifterRight: {
    alignItems: 'flex-end',
  },
  gifterDiamonds: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.brand.cyan,
  },
  gifterCount: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    color: TikTokTheme.colors.text.muted,
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    color: TikTokTheme.colors.text.muted,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: TikTokTheme.spacing.base,
  },
  statCard: {
    flex: 1,
    padding: TikTokTheme.spacing.base,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TikTokTheme.typography.fontSize.xl,
    fontWeight: TikTokTheme.typography.fontWeight.black,
    color: TikTokTheme.colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    color: TikTokTheme.colors.text.muted,
    marginTop: 4,
    textAlign: 'center',
  },
});
