import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { VictoryPie } from 'victory-native';

const { width } = Dimensions.get('window');

export default function BusinessDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('month');

  const [metrics] = useState({
    totalRevenue: 456000,
    growth: 24.5,
    avgOrderValue: 12340,
    conversionRate: 8.7,
  });

  const [revenueBreakdown] = useState([
    { x: 'Gifts', y: 65, color: TikTokTheme.colors.brand.cyan },
    { x: 'Subscriptions', y: 20, color: '#10B981' },
    { x: 'Battles', y: 10, color: '#FE2C55' },
    { x: 'Tips', y: 5, color: '#FFD700' },
  ]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <Animated.View entering={FadeIn} style={styles.businessIcon}>
            <Ionicons name="briefcase" size={36} color="#10B981" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Business Intelligence
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {formatCurrency(metrics.totalRevenue)} this {timeframe}
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
        {/* Timeframe Selector */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.timeframeRow}>
          {['day', 'week', 'month', 'year'].map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.timeframeChip, timeframe === tf && styles.timeframeActive]}
              onPress={() => {
                setTimeframe(tf);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.timeframeText, timeframe === tf && styles.timeframeTextActive]}>
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Key Metrics Grid */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <BlurView intensity={40} style={styles.metricBlur}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
                style={styles.metricContent}
              >
                <Ionicons name="trending-up" size={24} color="#10B981" />
                <Text style={styles.metricValue}>{metrics.growth}%</Text>
                <Text style={styles.metricLabel}>Growth Rate</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.metricCard}>
            <BlurView intensity={40} style={styles.metricBlur}>
              <LinearGradient
                colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']}
                style={styles.metricContent}
              >
                <Ionicons name="cash" size={24} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.metricValue}>{formatNumber(metrics.avgOrderValue)}</Text>
                <Text style={styles.metricLabel}>Avg Order Value</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.metricCard}>
            <BlurView intensity={40} style={styles.metricBlur}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.metricContent}
              >
                <Ionicons name="swap-horizontal" size={24} color="#FFD700" />
                <Text style={styles.metricValue}>{metrics.conversionRate}%</Text>
                <Text style={styles.metricLabel}>Conversion</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Revenue Breakdown Chart */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(550)} style={styles.chartCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
            style={styles.chartBackground}
            blurRadius={5}
          />
          <BlurView intensity={50} style={styles.chartBlur}>
            <View style={styles.chartContent}>
              <View style={styles.chartLegend}>
                {revenueBreakdown.map((item) => (
                  <View key={item.x} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>{item.x}</Text>
                    <Text style={styles.legendValue}>{item.y}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(650)} style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient colors={['rgba(0, 242, 234, 0.2)', 'rgba(0, 242, 234, 0.05)']} style={styles.actionGradient}>
              <Ionicons name="document-text" size={28} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.actionText}>Export Report</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']} style={styles.actionGradient}>
              <Ionicons name="analytics" size={28} color="#10B981" />
              <Text style={styles.actionText}>View Trends</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  heroContainer: { height: 160, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  businessIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#10B981' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#10B981' },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  timeframeRow: { flexDirection: 'row', gap: 8, marginBottom: TikTokTheme.spacing.base },
  timeframeChip: { flex: 1, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  timeframeActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10B981' },
  timeframeText: { fontSize: 13, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  timeframeTextActive: { color: '#10B981', fontWeight: '700' },
  metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: TikTokTheme.spacing.base },
  metricCard: { flex: 1, height: 110, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  metricBlur: { flex: 1 },
  metricContent: { flex: 1, padding: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  metricValue: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 8 },
  metricLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  chartCard: { height: 200, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  chartBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  chartBlur: { flex: 1 },
  chartContent: { flex: 1, padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  chartLegend: { gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { flex: 1, fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.primary },
  legendValue: { fontSize: 16, fontWeight: '900', color: TikTokTheme.colors.text.primary },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, height: 100, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 2 },
  actionGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionText: { fontSize: 13, fontWeight: '700', color: TikTokTheme.colors.text.primary },
});