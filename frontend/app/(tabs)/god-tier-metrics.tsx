import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { useNetwork, useInterval } from '../../src/hooks/GodTierHooks';
import { TikTokTheme } from '../../theme/TikTokTheme';

interface MetricEntry {
  label: string;
  avg: number;
  min: number;
  max: number;
  count: number;
}

interface EventEntry {
  name: string;
  data: any;
  timestamp: number;
}

function GodTierMetricsScreenContent() {
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [liveMode, setLiveMode] = useState(true);

  const { isConnected, connectionType } = useNetwork();

  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('god_tier_metrics_screen');
    analyticsTracker.screenView('god_tier_metrics');
    return () => stopTimer();
  }, []);

  const collectData = useCallback(() => {
    setMetrics(performanceMonitor.getAllMetrics());
    setEvents([...analyticsTracker.getEvents()].reverse());
  }, []);

  useEffect(() => {
    collectData();
  }, [collectData]);

  // Live refresh every 2s while enabled
  useInterval(collectData, liveMode ? 2000 : null);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    collectData();
    setRefreshing(false);
  };

  const handleToggleLive = () => {
    analyticsTracker.buttonClick('metrics_toggle_live', { enabled: !liveMode });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLiveMode(!liveMode);
  };

  const handleClearAll = () => {
    analyticsTracker.buttonClick('metrics_clear_all');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    performanceMonitor.reset();
    analyticsTracker.clear();
    collectData();
  };

  const errorEvents = events.filter(e => e.name.includes('failed') || e.name.includes('error'));
  const screenViews = events.filter(e => e.name === 'screen_view');
  const buttonClicks = events.filter(e => e.name === 'button_click');

  const getSpeedColor = (avg: number) => {
    if (avg < 100) return '#10B981';
    if (avg < 500) return TikTokTheme.colors.status.warning;
    return TikTokTheme.colors.status.error;
  };

  const formatMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`);

  const formatEventTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const getEventIcon = (name: string): { icon: string; color: string } => {
    if (name === 'screen_view') return { icon: 'eye', color: TikTokTheme.colors.brand.cyan };
    if (name === 'button_click') return { icon: 'finger-print', color: '#A855F7' };
    if (name.includes('failed') || name.includes('error')) return { icon: 'alert-circle', color: TikTokTheme.colors.status.error };
    if (name === 'api_call') return { icon: 'swap-horizontal', color: '#3B82F6' };
    return { icon: 'pulse', color: '#10B981' };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']} style={styles.heroGradient} />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.heroIcon}>
            <Ionicons name="speedometer" size={32} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            God Tier Metrics
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Live framework observability
          </Animated.Text>
        </View>

        {/* Live Mode Toggle */}
        <TouchableOpacity
          testID="metrics-live-toggle-button"
          style={[styles.liveButton, liveMode && styles.liveButtonActive]}
          onPress={handleToggleLive}
        >
          <View style={[styles.liveDot, { backgroundColor: liveMode ? TikTokTheme.colors.status.live : TikTokTheme.colors.text.muted }]} />
          <Text style={[styles.liveText, liveMode && { color: TikTokTheme.colors.status.live }]}>
            {liveMode ? 'LIVE' : 'PAUSED'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TikTokTheme.colors.brand.cyan} colors={[TikTokTheme.colors.brand.cyan]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Health Summary */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.summaryRow}>
          <View testID="metrics-screen-views-card" style={styles.summaryCard}>
            <BlurView intensity={40} style={styles.summaryBlur}>
              <LinearGradient colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']} style={styles.summaryContent}>
                <Ionicons name="eye" size={22} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.summaryValue}>{screenViews.length}</Text>
                <Text style={styles.summaryLabel}>Screen Views</Text>
              </LinearGradient>
            </BlurView>
          </View>
          <View testID="metrics-interactions-card" style={styles.summaryCard}>
            <BlurView intensity={40} style={styles.summaryBlur}>
              <LinearGradient colors={['rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.05)']} style={styles.summaryContent}>
                <Ionicons name="finger-print" size={22} color="#A855F7" />
                <Text style={styles.summaryValue}>{buttonClicks.length}</Text>
                <Text style={styles.summaryLabel}>Interactions</Text>
              </LinearGradient>
            </BlurView>
          </View>
          <View testID="metrics-errors-card" style={styles.summaryCard}>
            <BlurView intensity={40} style={styles.summaryBlur}>
              <LinearGradient
                colors={errorEvents.length > 0
                  ? ['rgba(255, 68, 88, 0.2)', 'rgba(255, 68, 88, 0.05)']
                  : ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
                style={styles.summaryContent}
              >
                <Ionicons
                  name={errorEvents.length > 0 ? 'alert-circle' : 'shield-checkmark'}
                  size={22}
                  color={errorEvents.length > 0 ? TikTokTheme.colors.status.error : '#10B981'}
                />
                <Text style={styles.summaryValue}>{errorEvents.length}</Text>
                <Text style={styles.summaryLabel}>Errors</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Network Status */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.networkCard}>
          <BlurView intensity={40} style={styles.networkBlur}>
            <View style={styles.networkContent}>
              <View style={[styles.networkDot, { backgroundColor: isConnected ? TikTokTheme.colors.status.success : TikTokTheme.colors.status.error }]} />
              <Text testID="metrics-network-status" style={styles.networkText}>
                {isConnected ? `Network: connected (${connectionType})` : 'Network: offline'}
              </Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Performance Metrics */}
        <Animated.View entering={FadeInDown.delay(350)}>
          <Text style={styles.sectionTitle}>Performance Timers</Text>
        </Animated.View>

        {metrics.length > 0 ? (
          metrics.map((metric, index) => (
            <Animated.View key={metric.label} entering={FadeInDown.delay(400 + index * 40)} style={styles.metricCard}>
              <BlurView intensity={40} style={styles.metricBlur}>
                <View testID={`metrics-perf-${metric.label}`} style={styles.metricContent}>
                  <View style={styles.metricHeader}>
                    <Text style={styles.metricLabel} numberOfLines={1}>{metric.label}</Text>
                    <Text style={[styles.metricAvg, { color: getSpeedColor(metric.avg) }]}>{formatMs(metric.avg)}</Text>
                  </View>
                  {/* Speed bar */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(100, (metric.avg / 1000) * 100)}%`,
                          backgroundColor: getSpeedColor(metric.avg),
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.metricFooter}>
                    <Text style={styles.metricDetail}>min {formatMs(metric.min)}</Text>
                    <Text style={styles.metricDetail}>max {formatMs(metric.max)}</Text>
                    <Text style={styles.metricDetail}>{metric.count} runs</Text>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="hourglass-outline" size={40} color={TikTokTheme.colors.text.muted} />
            <Text style={styles.emptyText}>No timers recorded yet. Visit other screens to collect data.</Text>
          </View>
        )}

        {/* Event Stream */}
        <Animated.View entering={FadeInDown.delay(450)} style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Event Stream ({events.length})</Text>
        </Animated.View>

        {events.length > 0 ? (
          events.slice(0, 25).map((event, index) => {
            const { icon, color } = getEventIcon(event.name);
            return (
              <Animated.View key={`${event.timestamp}-${index}`} entering={FadeInDown.delay(500 + Math.min(index, 8) * 30)} style={styles.eventCard}>
                <BlurView intensity={30} style={styles.eventBlur}>
                  <View style={styles.eventContent}>
                    <View style={[styles.eventIcon, { backgroundColor: `${color}20` }]}>
                      <Ionicons name={icon as any} size={16} color={color} />
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventName}>{event.name}</Text>
                      {event.data && (
                        <Text style={styles.eventData} numberOfLines={1}>
                          {JSON.stringify(event.data)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.eventTime}>{formatEventTime(event.timestamp)}</Text>
                  </View>
                </BlurView>
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="pulse-outline" size={40} color={TikTokTheme.colors.text.muted} />
            <Text style={styles.emptyText}>No events tracked yet in this session.</Text>
          </View>
        )}

        {/* Clear Button */}
        <Animated.View entering={FadeInDown.delay(550)} style={{ marginTop: 12 }}>
          <TouchableOpacity testID="metrics-clear-all-button" style={styles.clearButton} onPress={handleClearAll}>
            <BlurView intensity={40} style={styles.clearBlur}>
              <View style={styles.clearContent}>
                <Ionicons name="trash-bin" size={20} color={TikTokTheme.colors.status.error} />
                <Text style={styles.clearText}>Clear Metrics & Events</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function GodTierMetricsScreen() {
  return (
    <GodTierErrorBoundary>
      <GodTierMetricsScreenContent />
    </GodTierErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  heroContainer: { height: 160, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 26, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 13, color: TikTokTheme.colors.text.secondary },
  liveButton: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  liveButtonActive: { borderColor: TikTokTheme.colors.status.live },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 11, fontWeight: '900', color: TikTokTheme.colors.text.muted },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, height: 100, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  summaryBlur: { flex: 1 },
  summaryContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  summaryValue: { fontSize: 22, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 4 },
  summaryLabel: { fontSize: 10, color: TikTokTheme.colors.text.muted, marginTop: 2 },
  networkCard: { borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 2 },
  networkBlur: { flex: 1 },
  networkContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  networkDot: { width: 10, height: 10, borderRadius: 5 },
  networkText: { fontSize: 13, fontWeight: '600', color: TikTokTheme.colors.text.secondary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  metricCard: { borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 10, elevation: 2 },
  metricBlur: { flex: 1 },
  metricContent: { padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metricLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginRight: 12 },
  metricAvg: { fontSize: 16, fontWeight: '900' },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', borderRadius: 3 },
  metricFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  metricDetail: { fontSize: 11, color: TikTokTheme.colors.text.muted },
  eventCard: { borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 8, elevation: 1 },
  eventBlur: { flex: 1 },
  eventContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' },
  eventIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 13, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  eventData: { fontSize: 11, color: TikTokTheme.colors.text.muted, marginTop: 2 },
  eventTime: { fontSize: 10, color: TikTokTheme.colors.text.muted },
  emptyBox: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  emptyText: { fontSize: 13, color: TikTokTheme.colors.text.muted, textAlign: 'center', paddingHorizontal: 24 },
  clearButton: { height: 52, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', elevation: 2 },
  clearBlur: { flex: 1 },
  clearContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: `${TikTokTheme.colors.status.error}40` },
  clearText: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.status.error },
});
