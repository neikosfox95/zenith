import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, FadeInLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { GodTierMetricsBadge } from '../../src/components/GodTierMetricsBadge';
import { useNetwork } from '../../src/hooks/GodTierHooks';

const { width } = Dimensions.get('window');

function FanActivitiesScreenContent() {
  // God Tier: Network detection
  const { isConnected } = useNetwork();

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('fan_activities_screen');
    analyticsTracker.screenView('fan_activities');
    return () => stopTimer();
  }, []);
  const [refreshing, setRefreshing] = useState(false);
  const [activities] = useState([
    { id: 1, type: 'gift', user: '@superfan123', action: 'sent 1000 diamonds', time: new Date(Date.now() - 1000 * 60 * 5), icon: 'gift', color: '#FFD700' },
    { id: 2, type: 'follow', user: '@newbie456', action: 'joined the fan club', time: new Date(Date.now() - 1000 * 60 * 12), icon: 'person-add', color: TikTokTheme.colors.brand.cyan },
    { id: 3, type: 'comment', user: '@chattyuser', action: 'sent 50 messages', time: new Date(Date.now() - 1000 * 60 * 18), icon: 'chatbubbles', color: TikTokTheme.colors.brand.pink },
    { id: 4, type: 'badge', user: '@achiever99', action: 'earned Diamond Donor badge', time: new Date(Date.now() - 1000 * 60 * 25), icon: 'ribbon', color: '#A855F7' },
    { id: 5, type: 'share', user: '@promoter', action: 'shared stream 10 times', time: new Date(Date.now() - 1000 * 60 * 35), icon: 'share-social', color: '#3B82F6' },
    { id: 6, type: 'tier', user: '@loyalfan', action: 'upgraded to Gold tier', time: new Date(Date.now() - 1000 * 60 * 45), icon: 'arrow-up', color: '#10B981' },
    { id: 7, type: 'streak', user: '@dailyviewer', action: 'reached 30-day streak', time: new Date(Date.now() - 1000 * 60 * 60), icon: 'flame', color: '#FF6B00' },
    { id: 8, type: 'gift', user: '@biggifter', action: 'sent 500 diamonds', time: new Date(Date.now() - 1000 * 60 * 75), icon: 'gift', color: '#FFD700' },
  ]);

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_fan_activities');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Live data paused</Text>
        </Animated.View>
      )}
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
          <Animated.View entering={FadeIn} style={styles.activityIcon}>
            <Ionicons name="pulse" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Fan Activities
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Recent engagement timeline
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
        {/* Timeline */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </Animated.View>

        <View style={styles.timeline}>
          {activities.map((activity, index) => (
            <Animated.View key={activity.id} entering={FadeInLeft.delay(350 + index * 50)} style={styles.activityCard}>
              <BlurView intensity={40} style={styles.activityBlur}>
                <View style={styles.activityContent}>
                  <View style={[styles.iconContainer, { backgroundColor: `${activity.color}20` }]}>
                    <Ionicons name={activity.icon as any} size={24} color={activity.color} />
                  </View>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityUser}>{activity.user}</Text>
                    <Text style={styles.activityAction}>{activity.action}</Text>
                    <Text style={styles.activityTime}>{formatTime(activity.time)}</Text>
                  </View>
                </View>
              </BlurView>
              {index < activities.length - 1 && <View style={styles.timelineConnector} />}
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  offlineBanner: { backgroundColor: TikTokTheme.colors.status.warning, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  offlineText: { fontSize: 12, fontWeight: '600', color: TikTokTheme.colors.background.primary },
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  heroContainer: { height: 160, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  activityIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  timeline: { position: 'relative' },
  activityCard: { position: 'relative', marginBottom: 16 },
  activityBlur: { borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', elevation: 2 },
  activityContent: { flexDirection: 'row', alignItems: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  activityDetails: { flex: 1 },
  activityUser: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  activityAction: { fontSize: 14, color: TikTokTheme.colors.text.secondary, marginBottom: 4 },
  activityTime: { fontSize: 11, color: TikTokTheme.colors.text.muted },
  timelineConnector: { position: 'absolute', left: 35, top: 72, width: 2, height: 16, backgroundColor: 'rgba(0, 242, 234, 0.3)' },
});

export default function FanActivitiesScreen() {
  return (
    <GodTierErrorBoundary>
      <FanActivitiesScreenContent />
      <GodTierMetricsBadge />
    </GodTierErrorBoundary>
  );
}
