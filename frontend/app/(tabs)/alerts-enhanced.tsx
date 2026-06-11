import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, FadeInLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { useNetwork, useLocalStorage } from '../../src/hooks/GodTierHooks';
import { TikTokTheme } from '../../theme/TikTokTheme';

interface Alert {
  id: string;
  type: 'live' | 'gift' | 'viewer' | 'revenue' | 'warning';
  title: string;
  message: string;
  creator: string;
  timestamp: number;
  read: boolean;
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'live',
    title: 'Creator went live!',
    message: '@darkskully just started streaming',
    creator: 'darkskully',
    timestamp: Date.now() - 1000 * 60 * 5,
    read: false,
  },
  {
    id: '2',
    type: 'gift',
    title: 'Big Gift Alert!',
    message: 'Received 1000 diamonds from @whale_user',
    creator: 'streamerqueen',
    timestamp: Date.now() - 1000 * 60 * 15,
    read: false,
  },
  {
    id: '3',
    type: 'viewer',
    title: 'Viewer Milestone!',
    message: '@darkskully reached 5K viewers',
    creator: 'darkskully',
    timestamp: Date.now() - 1000 * 60 * 30,
    read: true,
  },
  {
    id: '4',
    type: 'revenue',
    title: 'Revenue Milestone!',
    message: 'Daily revenue exceeded $500',
    creator: 'all',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    read: true,
  },
];

function AlertsScreenContent() {
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // God Tier: Persisted alert preferences
  const [liveAlerts, setLiveAlerts] = useLocalStorage('alerts_pref_live', true);
  const [giftAlerts, setGiftAlerts] = useLocalStorage('alerts_pref_gift', true);
  const [viewerAlerts, setViewerAlerts] = useLocalStorage('alerts_pref_viewer', false);

  // God Tier: Network detection
  const { isConnected } = useNetwork();

  // God Tier: Cached alerts for offline support
  const [cachedAlerts, setCachedAlerts] = useLocalStorage<Alert[]>('alerts_cache', []);

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('alerts_screen');
    analyticsTracker.screenView('alerts');
    return () => stopTimer();
  }, []);

  useEffect(() => {
    loadAlerts();
  }, []);

  // Cache alerts when online
  useEffect(() => {
    if (isConnected && alerts.length > 0) {
      setCachedAlerts(alerts);
    }
  }, [alerts, isConnected]);

  const displayAlerts = !isConnected && cachedAlerts.length > 0 ? cachedAlerts : alerts;

  const loadAlerts = async () => {
    const stopTimer = performanceMonitor.startTimer('load_alerts');
    try {
      // TODO: Replace with real API once alerts endpoints are live
      setAlerts(MOCK_ALERTS);
      analyticsTracker.track('alerts_loaded', { count: MOCK_ALERTS.length });
    } catch (error) {
      console.error('Failed to load alerts:', error);
      analyticsTracker.track('alerts_load_failed', { error: String(error) });
    } finally {
      stopTimer();
    }
  };

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_alerts');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const handleMarkAsRead = (id: string) => {
    analyticsTracker.track('alert_marked_read', { alert_id: id });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleDelete = (id: string) => {
    analyticsTracker.track('alert_deleted', { alert_id: id });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleMarkAllAsRead = () => {
    analyticsTracker.buttonClick('mark_all_alerts_read');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAlerts(alerts.map(a => ({ ...a, read: true })));
  };

  const handlePreferenceToggle = (key: string, setter: (val: boolean) => void, currentValue: boolean) => {
    analyticsTracker.track('alert_preference_toggled', { preference: key, value: !currentValue });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(!currentValue);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'live': return 'videocam';
      case 'gift': return 'gift';
      case 'viewer': return 'people';
      case 'revenue': return 'cash';
      case 'warning': return 'warning';
      default: return 'notifications';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'live': return TikTokTheme.colors.status.live;
      case 'gift': return '#FFD700';
      case 'viewer': return TikTokTheme.colors.brand.cyan;
      case 'revenue': return '#10B981';
      case 'warning': return TikTokTheme.colors.status.warning;
      default: return TikTokTheme.colors.brand.cyan;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000 / 60);

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const unreadCount = displayAlerts.filter(a => !a.read).length;

  const preferences = [
    { key: 'live', icon: 'videocam' as const, label: 'Live Stream Alerts', color: TikTokTheme.colors.status.live, value: liveAlerts, setter: setLiveAlerts, testID: 'alerts-pref-live-toggle' },
    { key: 'gift', icon: 'gift' as const, label: 'Gift Alerts', color: '#FFD700', value: giftAlerts, setter: setGiftAlerts, testID: 'alerts-pref-gift-toggle' },
    { key: 'viewer', icon: 'people' as const, label: 'Viewer Milestones', color: TikTokTheme.colors.brand.cyan, value: viewerAlerts, setter: setViewerAlerts, testID: 'alerts-pref-viewer-toggle' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Showing cached alerts</Text>
        </Animated.View>
      )}

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']} style={styles.heroGradient} />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.bellContainer}>
            <Ionicons name="notifications" size={32} color={TikTokTheme.colors.brand.cyan} />
            {unreadCount > 0 && (
              <View testID="alerts-unread-badge" style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Alerts
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {unreadCount} unread notifications
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
        {/* Alert Preferences */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Alert Preferences</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350)} style={styles.preferenceCard}>
          <BlurView intensity={40} style={styles.preferenceBlur}>
            <View style={styles.preferenceContent}>
              {preferences.map((pref, index) => (
                <View key={pref.key} style={[styles.preferenceRow, index === preferences.length - 1 && { borderBottomWidth: 0 }]}>
                  <Ionicons name={pref.icon} size={20} color={pref.color} />
                  <Text style={styles.preferenceText}>{pref.label}</Text>
                  <Switch
                    testID={pref.testID}
                    value={pref.value}
                    onValueChange={() => handlePreferenceToggle(pref.key, pref.setter, pref.value)}
                    trackColor={{ false: '#3e3e3e', true: TikTokTheme.colors.brand.cyan }}
                    thumbColor={pref.value ? TikTokTheme.colors.background.primary : '#f4f3f4'}
                  />
                </View>
              ))}
            </View>
          </BlurView>
        </Animated.View>

        {/* Actions */}
        {unreadCount > 0 && (
          <Animated.View entering={FadeInDown.delay(400)}>
            <TouchableOpacity testID="alerts-mark-all-read-button" style={styles.markAllButton} onPress={handleMarkAllAsRead}>
              <LinearGradient colors={['rgba(0, 242, 234, 0.2)', 'rgba(0, 212, 255, 0.1)']} style={styles.markAllGradient}>
                <Ionicons name="checkmark-done" size={20} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.markAllText}>Mark All as Read</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Alerts List */}
        <Animated.View entering={FadeInDown.delay(450)}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
        </Animated.View>

        {displayAlerts.length > 0 ? (
          displayAlerts.map((alert, index) => (
            <Animated.View
              key={alert.id}
              entering={FadeInLeft.delay(500 + index * 50)}
              style={styles.alertCard}
            >
              <Image
                source={{ uri: 'https://images.pexels.com/photos/14240656/pexels-photo-14240656.jpeg?w=400&q=80' }}
                style={styles.alertBackground}
                blurRadius={5}
              />
              <BlurView intensity={alert.read ? 30 : 50} style={styles.alertBlur}>
                <View testID={`alerts-item-${alert.id}`} style={[styles.alertContent, !alert.read && styles.alertUnread]}>
                  <View style={[styles.alertIcon, { backgroundColor: `${getAlertColor(alert.type)}20` }]}>
                    <Ionicons name={getAlertIcon(alert.type) as any} size={24} color={getAlertColor(alert.type)} />
                  </View>
                  <View style={styles.alertDetails}>
                    <View style={styles.alertHeader}>
                      <Text style={[styles.alertTitle, !alert.read && styles.alertTitleUnread]}>
                        {alert.title}
                      </Text>
                      {!alert.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
                    <Text style={styles.alertTime}>{formatTime(alert.timestamp)}</Text>
                  </View>
                  <View style={styles.alertActions}>
                    {!alert.read && (
                      <TouchableOpacity
                        testID={`alerts-mark-read-button-${alert.id}`}
                        onPress={() => handleMarkAsRead(alert.id)}
                        style={styles.actionIcon}
                      >
                        <Ionicons name="checkmark-circle" size={24} color={TikTokTheme.colors.brand.cyan} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      testID={`alerts-delete-button-${alert.id}`}
                      onPress={() => handleDelete(alert.id)}
                      style={styles.actionIcon}
                    >
                      <Ionicons name="trash" size={20} color={TikTokTheme.colors.status.error} />
                    </TouchableOpacity>
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
              <Ionicons name="notifications-off" size={64} color={TikTokTheme.colors.text.muted} />
              <Text style={styles.emptyTitle}>No Alerts</Text>
              <Text style={styles.emptyText}>You're all caught up!</Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AlertsScreen() {
  return (
    <GodTierErrorBoundary>
      <AlertsScreenContent />
    </GodTierErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  offlineBanner: { backgroundColor: TikTokTheme.colors.status.warning, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  offlineText: { fontSize: 12, fontWeight: '600', color: TikTokTheme.colors.background.primary },
  heroContainer: { height: 180, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bellContainer: { position: 'relative', marginBottom: 12 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: TikTokTheme.colors.status.live, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 11, fontWeight: '900', color: TikTokTheme.colors.background.primary },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  preferenceCard: { borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 2 },
  preferenceBlur: { flex: 1 },
  preferenceContent: { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  preferenceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, paddingVertical: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  preferenceText: { flex: 1, fontSize: 15, fontWeight: '600', color: TikTokTheme.colors.text.primary },
  markAllButton: { height: 48, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 2 },
  markAllGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: TikTokTheme.colors.brand.cyan },
  markAllText: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.brand.cyan },
  alertCard: { height: 110, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  alertBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  alertBlur: { flex: 1 },
  alertContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
  alertUnread: { borderColor: `${TikTokTheme.colors.brand.cyan}40`, backgroundColor: 'rgba(0, 242, 234, 0.05)' },
  alertIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  alertDetails: { flex: 1 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  alertTitle: { fontSize: 15, fontWeight: '600', color: TikTokTheme.colors.text.primary },
  alertTitleUnread: { fontWeight: '700' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: TikTokTheme.colors.brand.cyan },
  alertMessage: { fontSize: 13, color: TikTokTheme.colors.text.secondary, marginBottom: 4, lineHeight: 18 },
  alertTime: { fontSize: 11, color: TikTokTheme.colors.text.muted },
  alertActions: { flexDirection: 'row', gap: 8 },
  actionIcon: { padding: 4 },
  emptyState: { height: 300, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginTop: TikTokTheme.spacing.base, elevation: 2 },
  emptyImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  emptyOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: TikTokTheme.spacing.xl },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
});
