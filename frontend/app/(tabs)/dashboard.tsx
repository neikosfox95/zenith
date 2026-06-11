import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Dimensions, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { GodTierMetricsBadge } from '../../src/components/GodTierMetricsBadge';
import { useApiCall, useNetwork, useLocalStorage, useResponsive } from '../../src/hooks/GodTierHooks';
import { useDashboard } from '../../src/hooks/realtime';
import { useDashboardStore } from '../../src/stores/dashboardStore';
import { useUIStore } from '../../src/stores/uiStore';
import { TikTokTheme } from '../../theme/TikTokTheme';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

function DashboardScreenContent() {
  const { stats, creators } = useDashboard();
  const { recentStreams, setRecentStreams } = useDashboardStore();
  const { refreshing, setRefreshing } = useUIStore();
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  // God Tier: Network detection
  const { isConnected } = useNetwork();
  
  // God Tier: Cached dashboard data
  const [cachedStats, setCachedStats] = useLocalStorage('dashboard_stats', null);
  const [cachedCreators, setCachedCreators] = useLocalStorage('dashboard_creators', []);
  
  // God Tier: Responsive design
  const { isTablet } = useResponsive();

  // God Tier: API call with caching
  const { data: apiStats, loading: loadingStats, refetch: refetchStats } = useApiCall({
    url: `${BACKEND_URL}/api/analytics/status`,
    cache: true,
    cacheTTL: 60000, // 1 minute cache
    onSuccess: (data) => {
      analyticsTracker.track('dashboard_stats_loaded', { creators: data?.creators || 0 });
      setCachedStats(data);
    }
  });

  // God Tier: Performance monitoring
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('dashboard_screen');
    analyticsTracker.screenView('dashboard');
    
    return () => {
      stopTimer();
    };
  }, []);

  // Use cached data when offline
  const displayStats = !isConnected && cachedStats ? cachedStats : (apiStats || stats);
  const displayCreators = !isConnected && cachedCreators.length > 0 ? cachedCreators : creators;

  // Cache creators when online
  useEffect(() => {
    if (isConnected && creators.length > 0) {
      setCachedCreators(creators);
    }
  }, [creators, isConnected]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const startTimer = performanceMonitor.startTimer('load_dashboard_data');
    try {
      console.log('Loading dashboard data...');
      await refetchStats();
    } catch (error) {
      console.error('Dashboard load error:', error);
      analyticsTracker.track('dashboard_load_failed', { error: String(error) });
    } finally {
      startTimer();
    }
  };

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_dashboard');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleAddCreator = () => {
    analyticsTracker.buttonClick('add_creator_button');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Navigate to add creator modal
  };

  const handleExportDashboard = async () => {
    analyticsTracker.buttonClick('export_dashboard');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const exportData = `
Dashboard Export
================
Total Viewers: ${displayStats.total_viewers}
Live Now: ${displayStats.live_now}
Total Revenue: $${(displayStats.total_revenue / 100).toFixed(2)}
Creators: ${displayCreators.length}
Exported: ${new Date().toLocaleString()}
    `.trim();
    
    try {
      await Share.share({
        message: exportData,
        title: 'Dashboard Export',
      });
      analyticsTracker.track('dashboard_exported');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Mode Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Showing cached data</Text>
        </Animated.View>
      )}

      {/* Hero Section with Background Image */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1584291527908-033f4d6542c8?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={2}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.Text entering={FadeIn} style={styles.heroTitle}>
            TikTok Live Monitor
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroSubtitle}>
            Track all your creators in real-time
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
          <Ionicons 
            name={showQuickActions ? "close" : "ellipsis-horizontal"} 
            size={24} 
            color={TikTokTheme.colors.text.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Quick Actions Menu */}
      {showQuickActions && (
        <Animated.View entering={FadeInDown} style={styles.quickActionsMenu}>
          <BlurView intensity={80} style={styles.quickActionsBlur}>
            <TouchableOpacity style={styles.quickActionItem} onPress={handleExportDashboard}>
              <Ionicons name="share-outline" size={20} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.quickActionText}>Export Dashboard</Text>
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={TikTokTheme.colors.brand.cyan}
            colors={[TikTokTheme.colors.brand.cyan]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats Grid with Skeleton Loader */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsGrid}>
          {loadingStats ? (
            <>
              <View style={[styles.statCard, styles.skeleton]} />
              <View style={[styles.statCard, styles.skeleton]} />
            </>
          ) : (
            <>
              <View style={styles.statCard}>
                <BlurView intensity={40} style={styles.statBlur}>
                  <LinearGradient
                    colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']}
                    style={styles.statGradient}
                  >
                    <Ionicons name="people" size={32} color={TikTokTheme.colors.brand.cyan} />
                    <Text style={styles.statValue}>{displayStats.total_viewers.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Total Viewers</Text>
                  </LinearGradient>
                </BlurView>
              </View>

              <View style={styles.statCard}>
                <BlurView intensity={40} style={styles.statBlur}>
                  <LinearGradient
                    colors={['rgba(254, 44, 85, 0.15)', 'rgba(254, 44, 85, 0.05)']}
                    style={styles.statGradient}
                  >
                    <Ionicons name="videocam" size={32} color={TikTokTheme.colors.brand.pink} />
                    <Text style={styles.statValue}>{displayStats.live_now}</Text>
                    <Text style={styles.statLabel}>Live Now</Text>
                  </LinearGradient>
                </BlurView>
              </View>
            </>
          )}
        </Animated.View>

        {/* Revenue Card with Chart Background */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.revenueSection}>
          <Text style={styles.sectionTitle}>Today's Revenue</Text>
          <View style={styles.revenueCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80' }}
              style={styles.revenueBackground}
              blurRadius={3}
            />
            <BlurView intensity={60} style={styles.revenueBlur}>
              <LinearGradient
                colors={['rgba(0, 242, 234, 0.2)', 'rgba(0, 212, 255, 0.1)']}
                style={styles.revenueContent}
              >
                <View style={styles.revenueTop}>
                  <View>
                    <Text style={styles.revenueLabel}>Total Earnings</Text>
                    <Text style={styles.revenueValue}>${(displayStats.total_revenue / 100).toFixed(2)}</Text>
                  </View>
                  <View style={styles.revenueTrend}>
                    <Ionicons name="trending-up" size={20} color={TikTokTheme.colors.status.success} />
                    <Text style={styles.revenueTrendText}>+12.5%</Text>
                  </View>
                </View>
                <View style={styles.revenueStats}>
                  <View>
                    <Text style={styles.revenueStatLabel}>Gifts Received</Text>
                    <Text style={styles.revenueStatValue}>{displayStats.total_gifts}</Text>
                  </View>
                  <View style={styles.revenueDivider} />
                  <View>
                    <Text style={styles.revenueStatLabel}>Avg. per Stream</Text>
                    <Text style={styles.revenueStatValue}>${(displayStats.total_revenue / Math.max(displayStats.total_streams, 1) / 100).toFixed(2)}</Text>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Active Creators Section */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.creatorsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Creators</Text>
            <TouchableOpacity onPress={handleAddCreator} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color={TikTokTheme.colors.brand.cyan} />
            </TouchableOpacity>
          </View>

          {displayCreators.length > 0 ? (
            <View style={styles.creatorsGrid}>
              {displayCreators.map((creator, index) => (
                <Animated.View
                  key={creator.username}
                  entering={FadeInUp.delay(500 + index * 100)}
                  style={styles.creatorCard}
                >
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=400&q=80' }}
                    style={styles.creatorBackground}
                    blurRadius={4}
                  />
                  <BlurView intensity={50} style={styles.creatorBlur}>
                    <View style={styles.creatorContent}>
                      <View style={styles.creatorAvatar}>
                        <Ionicons name="person" size={24} color={TikTokTheme.colors.brand.cyan} />
                      </View>
                      <Text style={styles.creatorName} numberOfLines={1}>{creator.username}</Text>
                      {creator.is_live ? (
                        <View style={styles.liveIndicator}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveText}>LIVE</Text>
                        </View>
                      ) : (
                        <Text style={styles.offlineText}>Offline</Text>
                      )}
                      <Text style={styles.creatorStats}>{creator.viewer_count} viewers</Text>
                    </View>
                  </BlurView>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1604941878418-b0fbf86e3590?w=400&q=80' }}
                style={styles.emptyImage}
                blurRadius={2}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                style={styles.emptyOverlay}
              >
                <Ionicons name="person-add" size={64} color={TikTokTheme.colors.text.muted} />
                <Text style={styles.emptyTitle}>No Creators Yet</Text>
                <Text style={styles.emptyText}>Add creators to start monitoring</Text>
                <TouchableOpacity onPress={handleAddCreator} style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Add Creator</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// God Tier Error Boundary Export
export default function DashboardScreen() {
  return (
    <GodTierErrorBoundary>
      <DashboardScreenContent />
      <GodTierMetricsBadge />
    </GodTierErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TikTokTheme.colors.background.primary,
  },
  offlineBanner: {
    backgroundColor: TikTokTheme.colors.status.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: TikTokTheme.colors.background.primary,
  },
  heroContainer: {
    height: 180,
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
    paddingHorizontal: TikTokTheme.spacing.base,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: TikTokTheme.colors.text.primary,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: TikTokTheme.colors.text.secondary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  quickActionsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickActionsMenu: {
    marginHorizontal: 16,
    marginTop: -16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
  },
  quickActionsBlur: {
    padding: 4,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: TikTokTheme.colors.text.primary,
  },
  quickActionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  scrollContent: {
    padding: TikTokTheme.spacing.base,
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: TikTokTheme.spacing.base,
    marginBottom: TikTokTheme.spacing.base,
  },
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  statCard: {
    flex: 1,
    height: 140,
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
  },
  statBlur: {
    flex: 1,
  },
  statGradient: {
    flex: 1,
    padding: TikTokTheme.spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: TikTokTheme.colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: TikTokTheme.colors.text.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  revenueSection: {
    marginBottom: TikTokTheme.spacing.base,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TikTokTheme.colors.text.primary,
    marginBottom: TikTokTheme.spacing.xs,
  },
  revenueCard: {
    height: 160,
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
  },
  revenueBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  revenueBlur: {
    flex: 1,
  },
  revenueContent: {
    flex: 1,
    padding: TikTokTheme.spacing.base,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  revenueTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  revenueLabel: {
    fontSize: 14,
    color: TikTokTheme.colors.text.secondary,
  },
  revenueValue: {
    fontSize: 36,
    fontWeight: '900',
    color: TikTokTheme.colors.text.primary,
    marginTop: 4,
  },
  revenueTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  revenueTrendText: {
    fontSize: 14,
    fontWeight: '700',
    color: TikTokTheme.colors.status.success,
  },
  revenueStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  revenueStatLabel: {
    fontSize: 12,
    color: TikTokTheme.colors.text.muted,
  },
  revenueStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: TikTokTheme.colors.text.primary,
    marginTop: 2,
  },
  revenueDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  creatorsSection: {
    marginBottom: TikTokTheme.spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TikTokTheme.spacing.xs,
  },
  addButton: {
    padding: 4,
  },
  creatorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TikTokTheme.spacing.base,
  },
  creatorCard: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
  },
  creatorBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  creatorBlur: {
    flex: 1,
  },
  creatorContent: {
    flex: 1,
    padding: TikTokTheme.spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  creatorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 242, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: TikTokTheme.colors.brand.cyan,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: TikTokTheme.colors.text.primary,
    marginBottom: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TikTokTheme.colors.status.live,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TikTokTheme.colors.background.primary,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '900',
    color: TikTokTheme.colors.background.primary,
  },
  offlineText: {
    fontSize: 12,
    color: TikTokTheme.colors.text.muted,
    marginVertical: 4,
  },
  creatorStats: {
    fontSize: 12,
    color: TikTokTheme.colors.text.secondary,
  },
  emptyState: {
    height: 300,
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 2,
  },
  emptyImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  emptyOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: TikTokTheme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TikTokTheme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: TikTokTheme.colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: TikTokTheme.colors.brand.cyan,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: TikTokTheme.borderRadius.md,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: TikTokTheme.colors.background.primary,
  },
});
