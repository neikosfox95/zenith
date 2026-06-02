import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, FlatList, Dimensions, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { useApiCall, useNetwork, useLocalStorage } from '../../src/hooks/GodTierHooks';
import { useLiveMonitoring } from '../../src/hooks/realtime';
import { useLiveStore } from '../../src/stores/liveStore';
import { useUIStore } from '../../src/stores/uiStore';
import { TikTokTheme } from '../../theme/TikTokTheme';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

function LiveMonitoringScreenContent() {
  const { events, liveCreators } = useLiveMonitoring();
  const { filter, setFilter } = useLiveStore();
  const { refreshing, setRefreshing } = useUIStore();
  const [stats, setStats] = useState({ total: 0, gifts: 0, comments: 0, likes: 0 });
  const [showQuickActions, setShowQuickActions] = useState(false);

  // God Tier: Network detection
  const { isConnected } = useNetwork();
  
  // God Tier: Cached data
  const [cachedEvents, setCachedEvents] = useLocalStorage('live_events', []);
  const [cachedStats, setCachedStats] = useLocalStorage('live_stats', null);

  // God Tier: Performance monitoring
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('live_monitoring_screen');
    analyticsTracker.screenView('live_monitoring');
    return () => stopTimer();
  }, []);

  // Use cached data when offline
  const displayEvents = !isConnected && cachedEvents.length > 0 ? cachedEvents : events;
  const displayStats = !isConnected && cachedStats ? cachedStats : stats;

  useEffect(() => {
    loadLiveData();
  }, [filter]);

  // Cache data when online
  useEffect(() => {
    if (isConnected && events.length > 0) {
      setCachedEvents(events);
    }
  }, [events, isConnected]);

  const loadLiveData = async () => {
    const startTimer = performanceMonitor.startTimer('load_live_data');
    try {
      const mockStats = { total: 1247, gifts: 324, comments: 892, likes: 5123 };
      setStats(mockStats);
      setCachedStats(mockStats);
      analyticsTracker.track('live_data_loaded', { events: events.length });
    } catch (error) {
      console.error('Live data load error:', error);
      analyticsTracker.track('live_data_load_failed', { error: String(error) });
    } finally {
      startTimer();
    }
  };

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_live_monitoring');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadLiveData();
    setRefreshing(false);
  };

  const handleExportEvents = async () => {
    analyticsTracker.buttonClick('export_live_events');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const exportData = `
Live Events Export
==================
Filter: ${filter}
Total Events: ${displayStats.total}
Gifts: ${displayStats.gifts}
Comments: ${displayStats.comments}
Likes: ${displayStats.likes}
Live Creators: ${liveCreators.length}
Exported: ${new Date().toLocaleString()}
    `.trim();
    
    try {
      await Share.share({ message: exportData, title: 'Live Events Export' });
      analyticsTracker.track('live_events_exported');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'gift': return 'gift';
      case 'comment': return 'chatbubble';
      case 'like': return 'heart';
      case 'share': return 'arrow-redo';
      case 'follow': return 'person-add';
      default: return 'pulse';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'gift': return TikTokTheme.colors.charts.accent4;
      case 'comment': return TikTokTheme.colors.brand.cyan;
      case 'like': return TikTokTheme.colors.brand.pink;
      case 'share': return TikTokTheme.colors.charts.tertiary;
      case 'follow': return TikTokTheme.colors.charts.accent3;
      default: return TikTokTheme.colors.text.secondary;
    }
  };

  const renderEvent = ({ item, index }: any) => (
    <Animated.View entering={FadeInDown.delay(index * 50)} style={styles.eventCard}>
      <BlurView intensity={30} style={styles.eventBlur}>
        <View style={styles.eventContent}>
          <View style={[styles.eventIcon, { backgroundColor: `${getEventColor(item.type)}15` }]}>
            <Ionicons name={getEventIcon(item.type)} size={20} color={getEventColor(item.type)} />
          </View>
          <View style={styles.eventDetails}>
            <Text style={styles.eventUser}>{item.username}</Text>
            <Text style={styles.eventText} numberOfLines={2}>{item.text || item.type}</Text>
            <Text style={styles.eventTime}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
          </View>
          {item.value && (
            <View style={styles.eventValue}>
              <Text style={styles.eventValueText}>💎 {item.value}</Text>
            </View>
          )}
        </View>
      </BlurView>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Showing cached events</Text>
        </Animated.View>
      )}

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']} style={styles.heroGradient} />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.pulseDot}>
            <View style={styles.pulseInner} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Live Monitoring
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {liveCreators.length} creators streaming now
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
            <TouchableOpacity style={styles.quickActionItem} onPress={handleExportEvents}>
              <Ionicons name="share-outline" size={20} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.quickActionText}>Export Events</Text>
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
        {/* Stats Overview */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <BlurView intensity={40} style={styles.statBlur}>
                <LinearGradient colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']} style={styles.statContent}>
                  <Text style={styles.statValue}>{displayStats.total}</Text>
                  <Text style={styles.statLabel}>Total Events</Text>
                </LinearGradient>
              </BlurView>
            </View>
            <View style={styles.statBox}>
              <BlurView intensity={40} style={styles.statBlur}>
                <LinearGradient colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']} style={styles.statContent}>
                  <Text style={styles.statValue}>{displayStats.gifts}</Text>
                  <Text style={styles.statLabel}>Gifts</Text>
                </LinearGradient>
              </BlurView>
            </View>
            <View style={styles.statBox}>
              <BlurView intensity={40} style={styles.statBlur}>
                <LinearGradient colors={['rgba(254, 44, 85, 0.15)', 'rgba(254, 44, 85, 0.05)']} style={styles.statContent}>
                  <Text style={styles.statValue}>{displayStats.likes}</Text>
                  <Text style={styles.statLabel}>Likes</Text>
                </LinearGradient>
              </BlurView>
            </View>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['all', 'gifts', 'comments', 'likes', 'follows'].map((filterType) => (
              <TouchableOpacity
                key={filterType}
                onPress={() => {
                  analyticsTracker.buttonClick('filter_events', { filter: filterType });
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilter(filterType);
                }}
                style={[styles.filterTab, filter === filterType && styles.filterTabActive]}
              >
                <Text style={[styles.filterText, filter === filterType && styles.filterTextActive]}>
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Events Feed */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Live Events Feed</Text>
          {displayEvents.length > 0 ? (
            <FlatList
              data={displayEvents}
              renderItem={renderEvent}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              scrollEnabled={false}
              contentContainerStyle={styles.eventsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/14240656/pexels-photo-14240656.jpeg?w=400&q=80' }}
                style={styles.emptyImage}
                blurRadius={2}
              />
              <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']} style={styles.emptyOverlay}>
                <Ionicons name="pulse-outline" size={64} color={TikTokTheme.colors.text.muted} />
                <Text style={styles.emptyTitle}>No Live Events</Text>
                <Text style={styles.emptyText}>Events will appear here when creators go live</Text>
              </LinearGradient>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function LiveMonitoringScreen() {
  return (
    <GodTierErrorBoundary>
      <LiveMonitoringScreenContent />
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
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base },
  pulseDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: TikTokTheme.colors.status.live, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 8 },
  pulseInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: TikTokTheme.colors.text.primary },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary, textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  quickActionsButton: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  quickActionsMenu: { marginHorizontal: 16, marginTop: -16, marginBottom: 8, borderRadius: 12, overflow: 'hidden', elevation: 8 },
  quickActionsBlur: { padding: 4 },
  quickActionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  quickActionText: { fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.primary },
  quickActionDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginVertical: 4 },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  statsContainer: { marginBottom: TikTokTheme.spacing.base },
  statsRow: { flexDirection: 'row', gap: TikTokTheme.spacing.xs },
  statBox: { flex: 1, height: 90, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', elevation: 4 },
  statBlur: { flex: 1 },
  statContent: { flex: 1, padding: TikTokTheme.spacing.xs, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statValue: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  statLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted },
  filterContainer: { marginBottom: TikTokTheme.spacing.base },
  filterScroll: { flexGrow: 0 },
  filterTab: { paddingHorizontal: 20, paddingVertical: 10, marginRight: 8, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  filterTabActive: { backgroundColor: TikTokTheme.colors.brand.cyan, borderColor: TikTokTheme.colors.brand.cyan },
  filterText: { fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.secondary },
  filterTextActive: { color: TikTokTheme.colors.background.primary },
  eventsSection: { flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: TikTokTheme.spacing.xs },
  eventsList: { gap: TikTokTheme.spacing.xs },
  eventCard: { borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: TikTokTheme.spacing.xs, elevation: 2 },
  eventBlur: { flex: 1 },
  eventContent: { flexDirection: 'row', alignItems: 'center', padding: TikTokTheme.spacing.xs, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', gap: 12 },
  eventIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  eventDetails: { flex: 1 },
  eventUser: { fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  eventText: { fontSize: 13, color: TikTokTheme.colors.text.secondary, marginBottom: 2 },
  eventTime: { fontSize: 11, color: TikTokTheme.colors.text.muted },
  eventValue: { backgroundColor: 'rgba(255, 215, 0, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  eventValueText: { fontSize: 12, fontWeight: '700', color: TikTokTheme.colors.charts.accent4 },
  emptyState: { height: 300, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginTop: TikTokTheme.spacing.base, elevation: 2 },
  emptyImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emptyOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: TikTokTheme.spacing.xl },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: TikTokTheme.colors.text.secondary, textAlign: 'center' },
});
