import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, FadeInLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { GodTierMetricsBadge } from '../../src/components/GodTierMetricsBadge';
import { useNetwork, useLocalStorage } from '../../src/hooks/GodTierHooks';
import { TikTokTheme } from '../../theme/TikTokTheme';

interface StreamSession {
  id: string;
  creator: string;
  title: string;
  date: number;
  duration_minutes: number;
  peak_viewers: number;
  total_gifts: number;
  revenue: number;
}

const MOCK_SESSIONS: StreamSession[] = [
  {
    id: '1',
    creator: 'darkskully',
    title: 'Late Night Gaming Marathon',
    date: Date.now() - 1000 * 60 * 60 * 8,
    duration_minutes: 185,
    peak_viewers: 5240,
    total_gifts: 432,
    revenue: 78500,
  },
  {
    id: '2',
    creator: 'streamerqueen',
    title: 'Q&A + Singing Session',
    date: Date.now() - 1000 * 60 * 60 * 26,
    duration_minutes: 122,
    peak_viewers: 3180,
    total_gifts: 287,
    revenue: 45200,
  },
  {
    id: '3',
    creator: 'darkskully',
    title: 'Battle vs @rivalcreator',
    date: Date.now() - 1000 * 60 * 60 * 50,
    duration_minutes: 95,
    peak_viewers: 8930,
    total_gifts: 1054,
    revenue: 152300,
  },
  {
    id: '4',
    creator: 'streamerqueen',
    title: 'Morning Coffee Chat',
    date: Date.now() - 1000 * 60 * 60 * 74,
    duration_minutes: 65,
    peak_viewers: 1420,
    total_gifts: 98,
    revenue: 12800,
  },
];

type FilterKey = 'all' | 'darkskully' | 'streamerqueen';

function HistoryScreenContent() {
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<StreamSession[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');

  // God Tier: Network detection
  const { isConnected } = useNetwork();

  // God Tier: Cached data for offline support
  const [cachedSessions, setCachedSessions] = useLocalStorage<StreamSession[]>('history_sessions', []);

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('history_screen');
    analyticsTracker.screenView('history');
    return () => stopTimer();
  }, []);

  useEffect(() => {
    loadHistory();
  }, []);

  // Cache sessions when online
  useEffect(() => {
    if (isConnected && sessions.length > 0) {
      setCachedSessions(sessions);
    }
  }, [sessions, isConnected]);

  const displaySessions = !isConnected && cachedSessions.length > 0 ? cachedSessions : sessions;

  const loadHistory = async () => {
    const stopTimer = performanceMonitor.startTimer('load_history');
    try {
      // TODO: Replace with real API once stream history endpoints are live
      setSessions(MOCK_SESSIONS);
      analyticsTracker.track('history_loaded', { count: MOCK_SESSIONS.length });
    } catch (error) {
      console.error('Failed to load history:', error);
      analyticsTracker.track('history_load_failed', { error: String(error) });
    } finally {
      stopTimer();
    }
  };

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_history');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleFilterChange = (newFilter: FilterKey) => {
    analyticsTracker.buttonClick('history_filter_change', { filter: newFilter });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(newFilter);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (value: number) => `$${(value / 100).toFixed(2)}`;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000 / 60 / 60);
    if (diff < 24) return `${diff}h ago`;
    return `${Math.floor(diff / 24)}d ago`;
  };

  const filteredSessions = filter === 'all'
    ? displaySessions
    : displaySessions.filter(s => s.creator === filter);

  const totalStreams = displaySessions.length;
  const totalRevenue = displaySessions.reduce((sum, s) => sum + s.revenue, 0);
  const totalHours = Math.round(displaySessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60);

  const filters: Array<{ key: FilterKey; label: string }> = [
    { key: 'all', label: 'All Creators' },
    { key: 'darkskully', label: '@darkskully' },
    { key: 'streamerqueen', label: '@streamerqueen' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Showing cached history</Text>
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
          <Animated.View entering={FadeIn} style={styles.historyIcon}>
            <Ionicons name="time" size={32} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Stream History
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {totalStreams} past streams tracked
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
        {/* Summary Stats */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.summaryRow}>
          <View testID="history-total-streams-card" style={styles.summaryCard}>
            <BlurView intensity={40} style={styles.summaryBlur}>
              <LinearGradient colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']} style={styles.summaryContent}>
                <Ionicons name="videocam" size={22} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.summaryValue}>{totalStreams}</Text>
                <Text style={styles.summaryLabel}>Streams</Text>
              </LinearGradient>
            </BlurView>
          </View>
          <View testID="history-total-hours-card" style={styles.summaryCard}>
            <BlurView intensity={40} style={styles.summaryBlur}>
              <LinearGradient colors={['rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.05)']} style={styles.summaryContent}>
                <Ionicons name="hourglass" size={22} color="#A855F7" />
                <Text style={styles.summaryValue}>{totalHours}h</Text>
                <Text style={styles.summaryLabel}>Hours Live</Text>
              </LinearGradient>
            </BlurView>
          </View>
          <View testID="history-total-revenue-card" style={styles.summaryCard}>
            <BlurView intensity={40} style={styles.summaryBlur}>
              <LinearGradient colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']} style={styles.summaryContent}>
                <Ionicons name="cash" size={22} color="#10B981" />
                <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
                <Text style={styles.summaryLabel}>Revenue</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Creator Filter */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              testID={`history-filter-${f.key}`}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => handleFilterChange(f.key)}
            >
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Sessions List */}
        <Animated.View entering={FadeInDown.delay(350)}>
          <Text style={styles.sectionTitle}>Past Streams</Text>
        </Animated.View>

        {filteredSessions.length > 0 ? (
          filteredSessions.map((session, index) => (
            <Animated.View
              key={session.id}
              entering={FadeInLeft.delay(400 + index * 50)}
              style={styles.sessionCard}
            >
              <BlurView intensity={40} style={styles.sessionBlur}>
                <View testID={`history-session-${session.id}`} style={styles.sessionContent}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionAvatar}>
                      <LinearGradient
                        colors={[TikTokTheme.colors.brand.cyan, TikTokTheme.colors.brand.pink]}
                        style={styles.avatarGradient}
                      >
                        <Text style={styles.avatarText}>{session.creator.charAt(0).toUpperCase()}</Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
                      <Text style={styles.sessionMeta}>@{session.creator} • {formatDate(session.date)}</Text>
                    </View>
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color={TikTokTheme.colors.text.secondary} />
                      <Text style={styles.durationText}>{formatDuration(session.duration_minutes)}</Text>
                    </View>
                  </View>

                  <View style={styles.sessionStats}>
                    <View style={styles.sessionStatItem}>
                      <Ionicons name="eye" size={14} color={TikTokTheme.colors.brand.cyan} />
                      <Text style={styles.sessionStatValue}>{formatNumber(session.peak_viewers)}</Text>
                      <Text style={styles.sessionStatLabel}>Peak</Text>
                    </View>
                    <View style={styles.sessionStatDivider} />
                    <View style={styles.sessionStatItem}>
                      <Ionicons name="gift" size={14} color="#FFD700" />
                      <Text style={styles.sessionStatValue}>{formatNumber(session.total_gifts)}</Text>
                      <Text style={styles.sessionStatLabel}>Gifts</Text>
                    </View>
                    <View style={styles.sessionStatDivider} />
                    <View style={styles.sessionStatItem}>
                      <Ionicons name="cash" size={14} color="#10B981" />
                      <Text style={styles.sessionStatValue}>{formatCurrency(session.revenue)}</Text>
                      <Text style={styles.sessionStatLabel}>Earned</Text>
                    </View>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1506994011460-5482746d30a1?w=400&q=80' }}
              style={styles.emptyImage}
              blurRadius={2}
            />
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']} style={styles.emptyOverlay}>
              <Ionicons name="time-outline" size={64} color={TikTokTheme.colors.text.muted} />
              <Text style={styles.emptyTitle}>No Stream History</Text>
              <Text style={styles.emptyText}>Past streams will appear here once creators go live</Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function HistoryScreen() {
  return (
    <GodTierErrorBoundary>
      <HistoryScreenContent />
      <GodTierMetricsBadge />
    </GodTierErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  offlineBanner: { backgroundColor: TikTokTheme.colors.status.warning, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  offlineText: { fontSize: 12, fontWeight: '600', color: TikTokTheme.colors.background.primary },
  heroContainer: { height: 170, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  historyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: TikTokTheme.spacing.base },
  summaryCard: { flex: 1, height: 100, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  summaryBlur: { flex: 1 },
  summaryContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  summaryValue: { fontSize: 18, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 4 },
  summaryLabel: { fontSize: 10, color: TikTokTheme.colors.text.muted, marginTop: 2 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: TikTokTheme.spacing.base },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  filterChipActive: { backgroundColor: TikTokTheme.colors.brand.cyan, borderColor: TikTokTheme.colors.brand.cyan },
  filterChipText: { fontSize: 13, fontWeight: '600', color: TikTokTheme.colors.text.primary },
  filterChipTextActive: { color: TikTokTheme.colors.background.primary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  sessionCard: { borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  sessionBlur: { flex: 1 },
  sessionContent: { padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  sessionAvatar: { width: 44, height: 44 },
  avatarGradient: { flex: 1, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: TikTokTheme.colors.background.primary },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  sessionMeta: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  durationText: { fontSize: 11, fontWeight: '600', color: TikTokTheme.colors.text.secondary },
  sessionStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  sessionStatItem: { flex: 1, alignItems: 'center' },
  sessionStatValue: { fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginTop: 4 },
  sessionStatLabel: { fontSize: 10, color: TikTokTheme.colors.text.muted, marginTop: 2 },
  sessionStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  emptyState: { height: 300, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginTop: TikTokTheme.spacing.base, elevation: 2 },
  emptyImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emptyOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: TikTokTheme.spacing.xl },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: TikTokTheme.colors.text.secondary, textAlign: 'center' },
});
