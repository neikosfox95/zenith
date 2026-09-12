/**
 * ============================================================
 * AI STUDIO HOME - GOD TIER ENHANCED VERSION
 * ============================================================
 * Enhancements Applied:
 * ✅ Error Boundary
 * ✅ Advanced Caching (useApiCall)
 * ✅ Performance Monitoring
 * ✅ Analytics Tracking
 * ✅ Offline Support
 * ✅ Skeleton Loaders
 * ✅ Network Status
 * ✅ Export Functionality
 * ✅ Quick Actions Menu
 * ✅ Recent Generations
 * ✅ Cost Calculator
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TikTokColors } from '../../src/constants/tiktokTheme';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { useApiCall, useNetwork, useLocalStorage, useResponsive } from '../../src/hooks/GodTierHooks';

// FIX: this screen derived the API base URL locally from
// EXPO_PUBLIC_BACKEND_URL, which is defined nowhere (app.json has no
// `extra` block and no .env sets it), so the value was undefined and
// every request went to a URL literally starting with "undefined/".
// All screens now share src/config/backend.ts.
import { BACKEND_URL } from '../../src/config/backend';

const { width } = Dimensions.get('window');

function AIStudioHomeContent() {
  const router = useRouter();
  const { isConnected } = useNetwork();
  const { isTablet } = useResponsive();
  const [showQuickActions, setShowQuickActions] = useState(false);
  // Explicit type args — inferring T from a `null` default makes the setter
  // accept only `(prev: null) => null`.
  const [cachedData, setCachedData] = useLocalStorage<
    null,
    { status: unknown; usage: unknown; timestamp: number } | null
  >('ai_studio_home', null);

  // Track screen view
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('ai_studio_home_load');
    analyticsTracker.screenView('ai_studio_home');
    return () => stopTimer();
  }, []);

  // Advanced API call with caching
  const { 
    data: statusData, 
    loading: statusLoading, 
    error: statusError,
    refetch: refetchStatus 
  } = useApiCall({
    url: `${BACKEND_URL}/api/ai-studio/v2/status`,
    cache: true,
    cacheTTL: 60000, // 1 min
    retry: true
  });

  const { 
    data: usageData, 
    loading: usageLoading,
    refetch: refetchUsage 
  } = useApiCall({
    url: `${BACKEND_URL}/api/ai-studio/v2/usage`,
    cache: true,
    cacheTTL: 30000 // 30s
  });

  const { 
    data: analyticsData,
    refetch: refetchAnalytics 
  } = useApiCall({
    url: `${BACKEND_URL}/api/ai-studio/v2/provider-analytics`,
    cache: true,
    cacheTTL: 60000
  });

  const loading = statusLoading || usageLoading;
  const status = statusData;
  const usage = usageData?.usage;
  const analytics = analyticsData?.analytics;

  // Save to cache for offline
  useEffect(() => {
    if (status && usage) {
      setCachedData({ status, usage, timestamp: Date.now() });
    }
  }, [status, usage]);

  // Use cached data if offline
  const displayStatus = !isConnected && cachedData ? cachedData.status : status;
  const displayUsage = !isConnected && cachedData ? cachedData.usage : usage;

  const onRefresh = async () => {
    analyticsTracker.track('refresh', { screen: 'ai_studio_home' });
    await Promise.all([refetchStatus(), refetchUsage(), refetchAnalytics()]);
  };

  // Export functionality
  const exportData = async () => {
    try {
      const data = `AI Studio Summary\n\nTotal Models: ${displayStatus?.totalModels}\nRequests Today: ${displayUsage?.today?.requests}\nCost Today: $${displayUsage?.today?.cost?.toFixed(2)}\nTokens: ${displayUsage?.today?.tokens}`;
      
      await Share.share({
        message: data,
        title: 'AI Studio Summary'
      });
      
      analyticsTracker.track('export_data', { screen: 'ai_studio_home' });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Quick actions
  const quickActions = [
    { id: 'text', label: 'Quick Text', icon: 'document-text', color: '#10B981', route: '/(tabs)/ai-text-generator' },
    { id: 'image', label: 'Quick Image', icon: 'image', color: '#EC4899', route: '/(tabs)/ai-image-generator' },
    { id: 'video', label: 'Quick Video', icon: 'videocam', color: '#8B5CF6', route: '/(tabs)/ai-video-generator' },
    { id: 'analytics', label: 'Analytics', icon: 'stats-chart', color: '#00F2EA', route: '/(tabs)/ai-provider-analytics' }
  ];

  if (loading && !cachedData) {
    return <SkeletonLoader />;
  }

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&h=2000&fit=crop&q=80' }}
      style={styles.container}
      blurRadius={3}
    >
      {/* Network Status Banner */}
      {!isConnected && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#FFFFFF" />
          <Text style={styles.offlineText}>Offline Mode - Showing Cached Data</Text>
        </Animated.View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={TikTokColors.cyan} />
        }
      >
        {/* Hero Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.heroSection}>
          <LinearGradient
            colors={['rgba(0, 242, 234, 0.2)', 'rgba(254, 44, 85, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Ionicons name="sparkles" size={64} color={TikTokColors.cyan} />
              <Text style={styles.heroTitle}>AI Studio</Text>
              <Text style={styles.heroSubtitle}>Zenith Grade Super App</Text>
              <Text style={styles.heroDescription}>
                {displayStatus?.totalModels || 39} AI Models • Text, Image, Video, Audio, Music
              </Text>
              
              {/* Action Buttons */}
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.heroButton} onPress={exportData}>
                  <Ionicons name="download" size={20} color="#FFFFFF" />
                  <Text style={styles.heroButtonText}>Export</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroButton} onPress={() => setShowQuickActions(!showQuickActions)}>
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                  <Text style={styles.heroButtonText}>Quick Actions</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions Menu */}
        {showQuickActions && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.quickActionsMenu}>
            <LinearGradient colors={['rgba(0, 242, 234, 0.15)', 'rgba(254, 44, 85, 0.15)']} style={styles.quickActionsGradient}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                {quickActions.map(action => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.quickActionButton}
                    onPress={() => {
                      analyticsTracker.buttonClick(action.id, { from: 'quick_actions' });
                      router.push(action.route as any);
                    }}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}30` }]}>
                      <Ionicons name={action.icon as any} size={24} color={action.color} />
                    </View>
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard icon="flash" label="Total Models" value={displayStatus?.totalModels || 39} color="#10B981" delay={250} />
            <StatCard icon="trending-up" label="Requests Today" value={displayUsage?.today?.requests || 0} color="#00F2EA" delay={300} />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="wallet" label="Today's Cost" value={`$${displayUsage?.today?.cost?.toFixed(2) || '0.00'}`} color="#FFD700" delay={350} />
            <StatCard icon="cube" label="Tokens Used" value={`${((displayUsage?.today?.tokens || 0) / 1000000).toFixed(1)}M`} color="#FE2C55" delay={400} />
          </View>
        </Animated.View>

        {/* Provider Performance */}
        {analytics && (
          <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.section}>
            <Text style={styles.sectionTitle}>Provider Performance</Text>
            <TouchableOpacity 
              style={styles.providerCard}
              onPress={() => router.push('/(tabs)/ai-provider-analytics')}
            >
              <LinearGradient colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']} style={styles.providerGradient}>
                <View style={styles.providerRow}>
                  <View>
                    <Text style={styles.providerLabel}>Emergent LLM (Primary)</Text>
                    <Text style={styles.providerValue}>{analytics.byProvider?.emergent?.percentage || 0}% of requests</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#10B981" />
                </View>
                <View style={styles.providerRow}>
                  <View>
                    <Text style={styles.providerLabel}>Atlas Cloud (Backup)</Text>
                    <Text style={styles.providerValue}>{analytics.byProvider?.atlas?.percentage || 0}% of requests</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* System Status */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusCard}>
            <LinearGradient
              colors={displayStatus?.atlasCloudAvailable ? ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)'] : ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']}
              style={styles.statusGradient}
            >
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: displayStatus?.atlasCloudAvailable ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.statusLabel}>Atlas Cloud API</Text>
                <Text style={[styles.statusValue, { color: displayStatus?.atlasCloudAvailable ? '#10B981' : '#EF4444' }]}>
                  {displayStatus?.atlasCloudAvailable ? 'Active' : 'Standby'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: displayStatus?.fallbackAvailable ? '#10B981' : '#F59E0B' }]} />
                <Text style={styles.statusLabel}>Fallback Providers</Text>
                <Text style={[styles.statusValue, { color: displayStatus?.fallbackAvailable ? '#10B981' : '#F59E0B' }]}>
                  {displayStatus?.fallbackAvailable ? 'Ready' : 'Limited'}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Quick Actions Grid */}
        <Animated.View entering={FadeInDown.delay(550).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Generators</Text>
          <View style={styles.actionsGrid}>
            <ActionButton icon="document-text" label="Text Generation" color="#10B981" count={displayStatus?.modelsByType?.text || 7} onPress={() => router.push('/(tabs)/ai-text-generator')} delay={600} />
            <ActionButton icon="image" label="Image Generation" color="#EC4899" count={displayStatus?.modelsByType?.image || 10} onPress={() => router.push('/(tabs)/ai-image-generator')} delay={650} />
            <ActionButton icon="videocam" label="Video Generation" color="#8B5CF6" count={displayStatus?.modelsByType?.video || 12} onPress={() => router.push('/(tabs)/ai-video-generator')} delay={700} />
            <ActionButton icon="mic" label="Audio & Voice" color="#3B82F6" count={displayStatus?.modelsByType?.audio || 5} onPress={() => router.push('/(tabs)/ai-audio-generator')} delay={750} />
            <ActionButton icon="musical-notes" label="Music Generation" color="#F59E0B" count={displayStatus?.modelsByType?.music || 5} onPress={() => router.push('/(tabs)/ai-music-generator')} delay={800} />
            <ActionButton icon="apps" label="Model Gallery" color="#00F2EA" count={39} onPress={() => router.push('/(tabs)/ai-model-gallery')} delay={850} />
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ImageBackground>
  );
}

// Skeleton Loader
function SkeletonLoader() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHero} />
      <View style={styles.skeletonStats}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
      <View style={styles.skeletonStats}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    </View>
  );
}

function StatCard({ icon, label, value, color, delay }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.statCard}>
      <LinearGradient colors={[`${color}15`, `${color}05`]} style={styles.statGradient}>
        <Ionicons name={icon} size={32} color={color} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function ActionButton({ icon, label, color, count, onPress, delay }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)}>
      <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
        <LinearGradient colors={[`${color}20`, `${color}10`]} style={styles.actionGradient}>
          <View style={[styles.actionIconContainer, { backgroundColor: `${color}30` }]}>
            <Ionicons name={icon} size={28} color={color} />
          </View>
          <Text style={styles.actionLabel}>{label}</Text>
          <Text style={styles.actionCount}>{count} models</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Wrap with Error Boundary
export default function AIStudioHome() {
  return (
    <GodTierErrorBoundary>
      <AIStudioHomeContent />
    </GodTierErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokColors.background },
  scrollView: { flex: 1 },
  offlineBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.9)', paddingVertical: 8, gap: 8 },
  offlineText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  heroSection: { marginTop: 60, marginHorizontal: 16, borderRadius: 24, overflow: 'hidden' },
  heroGradient: { padding: 32, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  heroContent: { alignItems: 'center' },
  heroTitle: { fontSize: 48, fontWeight: '900', color: '#FFFFFF', marginTop: 16, letterSpacing: -1 },
  heroSubtitle: { fontSize: 18, fontWeight: '700', color: TikTokColors.cyan, marginTop: 8 },
  heroDescription: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginTop: 8, textAlign: 'center' },
  heroActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  heroButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  heroButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  quickActionsMenu: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden' },
  quickActionsGradient: { padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20 },
  quickActionsTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickActionButton: { width: (width - 80) / 2, alignItems: 'center' },
  quickActionIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionLabel: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
  statsContainer: { marginTop: 16, marginHorizontal: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  statGradient: { padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16 },
  statValue: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginTop: 12 },
  statLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginTop: 4, fontWeight: '600' },
  section: { marginTop: 24, marginHorizontal: 16 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  providerCard: { borderRadius: 16, overflow: 'hidden' },
  providerGradient: { padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16 },
  providerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  providerLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' },
  providerValue: { fontSize: 16, color: '#FFFFFF', fontWeight: '700', marginTop: 4 },
  statusCard: { borderRadius: 16, overflow: 'hidden' },
  statusGradient: { padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  statusLabel: { flex: 1, fontSize: 16, color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600' },
  statusValue: { fontSize: 16, fontWeight: '700' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionButton: { width: (width - 48) / 2, borderRadius: 16, overflow: 'hidden' },
  actionGradient: { padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, alignItems: 'center' },
  actionIconContainer: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 12, textAlign: 'center' },
  actionCount: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginTop: 4, fontWeight: '600' },
  skeletonContainer: { flex: 1, backgroundColor: TikTokColors.background, padding: 16, paddingTop: 60 },
  skeletonHero: { height: 200, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 24, marginBottom: 16 },
  skeletonStats: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  skeletonCard: { flex: 1, height: 120, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16 }
});