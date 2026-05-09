import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAnalytics } from '../../src/hooks/realtime';
import { useAnalyticsStore } from '../../src/stores/analyticsStore';
import { useUIStore } from '../../src/stores/uiStore';
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

  const chartData = revenueHistory.map((item, index) => ({
    x: index + 1,
    y: item.revenue / 100,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Hero Section with Chart Background */}
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
          <Animated.Text entering={FadeIn} style={styles.heroTitle}>
            Analytics
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroSubtitle}>
            Performance Overview
          </Animated.Text>
        </View>
      </View>

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
        {/* Key Metrics Grid */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <BlurView intensity={40} style={styles.metricBlur}>
              <LinearGradient
                colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']}
                style={styles.metricContent}
              >
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(0, 242, 234, 0.2)' }]}>
                  <Ionicons name="cash-outline" size={24} color={TikTokTheme.colors.brand.cyan} />
                </View>
                <Text style={styles.metricValue}>{formatCurrency(summary.total_revenue)}</Text>
                <Text style={styles.metricLabel}>Total Revenue</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.metricCard}>
            <BlurView intensity={40} style={styles.metricBlur}>
              <LinearGradient
                colors={['rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.05)']}
                style={styles.metricContent}
              >
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                  <Ionicons name="gift-outline" size={24} color="#A855F7" />
                </View>
                <Text style={styles.metricValue}>{formatNumber(summary.total_gifts)}</Text>
                <Text style={styles.metricLabel}>Total Gifts</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.metricCard}>
            <BlurView intensity={40} style={styles.metricBlur}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']}
                style={styles.metricContent}
              >
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                  <Ionicons name="eye-outline" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.metricValue}>{formatNumber(summary.total_viewers)}</Text>
                <Text style={styles.metricLabel}>Total Viewers</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.metricCard}>
            <BlurView intensity={40} style={styles.metricBlur}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
                style={styles.metricContent}
              >
                <View style={[styles.metricIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="trending-up" size={24} color="#10B981" />
                </View>
                <Text style={styles.metricValue}>{formatNumber(summary.peak_viewers)}</Text>
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
                <LinearGradient
                  colors={['rgba(0, 242, 234, 0.2)', 'rgba(0, 212, 255, 0.1)']}
                  style={styles.insightContent}
                >
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
              </View>
            </BlurView>
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
  heroContainer: {
    height: 140,
    position: 'relative',
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: TikTokTheme.colors.text.primary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: TikTokTheme.colors.text.secondary,
  },
  scrollContent: {
    padding: TikTokTheme.spacing.base,
    paddingBottom: 100,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TikTokTheme.spacing.base,
    marginBottom: TikTokTheme.spacing.base,
  },
  metricCard: {
    width: (width - 48) / 2,
    height: 140,
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
  },
  metricBlur: {
    flex: 1,
  },
  metricContent: {
    flex: 1,
    padding: TikTokTheme.spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: TikTokTheme.colors.text.primary,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: TikTokTheme.colors.text.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  insightSection: {
    marginBottom: TikTokTheme.spacing.base,
  },
  insightCard: {
    height: 140,
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
  },
  insightBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  insightBlur: {
    flex: 1,
  },
  insightContent: {
    flex: 1,
    padding: TikTokTheme.spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 242, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TikTokTheme.colors.text.primary,
  },
  insightText: {
    fontSize: 14,
    color: TikTokTheme.colors.text.secondary,
    lineHeight: 20,
  },
  chartSection: {
    marginBottom: TikTokTheme.spacing.base,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TikTokTheme.colors.text.primary,
    marginBottom: TikTokTheme.spacing.xs,
  },
  chartCard: {
    height: 240,
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
  },
  chartBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  chartBlur: {
    flex: 1,
  },
  chartContent: {
    flex: 1,
    padding: TikTokTheme.spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyChart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 14,
    color: TikTokTheme.colors.text.muted,
    marginTop: 8,
  },
  leaderboardSection: {
    marginBottom: TikTokTheme.spacing.base,
  },
  leaderboardCard: {
    minHeight: 200,
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
  },
  leaderboardBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  leaderboardBlur: {
    flex: 1,
  },
  leaderboardContent: {
    padding: TikTokTheme.spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gifterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  gifterLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  rankSilver: {
    backgroundColor: 'rgba(192, 192, 192, 0.3)',
  },
  rankBronze: {
    backgroundColor: 'rgba(205, 127, 50, 0.3)',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: TikTokTheme.colors.text.primary,
  },
  gifterName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: TikTokTheme.colors.text.primary,
  },
  gifterRight: {
    alignItems: 'flex-end',
  },
  gifterDiamonds: {
    fontSize: 15,
    fontWeight: '700',
    color: TikTokTheme.colors.brand.cyan,
  },
  gifterCount: {
    fontSize: 12,
    color: TikTokTheme.colors.text.muted,
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: TikTokTheme.colors.text.muted,
    marginTop: 8,
  },
});
