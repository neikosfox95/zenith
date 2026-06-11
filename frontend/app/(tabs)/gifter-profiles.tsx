import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker } from '../../src/utils/GodTierFramework';
import { GodTierMetricsBadge } from '../../src/components/GodTierMetricsBadge';
import { useNetwork } from '../../src/hooks/GodTierHooks';

const { width } = Dimensions.get('window');

function GifterProfilesScreenContent() {
  // God Tier: Network detection
  const { isConnected } = useNetwork();

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('gifter_profiles_screen');
    analyticsTracker.screenView('gifter_profiles');
    return () => stopTimer();
  }, []);
  const [refreshing, setRefreshing] = useState(false);
  const [gifters] = useState([
    { 
      id: 1, 
      username: '@diamondqueen', 
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      totalGifts: 23400,
      totalValue: 234000,
      favoriteGift: '💎',
      level: 'VIP',
      lastGift: '2 hours ago',
      color: '#FFD700'
    },
    { 
      id: 2, 
      username: '@roseking', 
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      totalGifts: 18900,
      totalValue: 189000,
      favoriteGift: '🌹',
      level: 'VIP',
      lastGift: '5 hours ago',
      color: '#FE2C55'
    },
    { 
      id: 3, 
      username: '@crownprince', 
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      totalGifts: 12300,
      totalValue: 123000,
      favoriteGift: '👑',
      level: 'Elite',
      lastGift: '1 day ago',
      color: TikTokTheme.colors.brand.cyan
    },
    { 
      id: 4, 
      username: '@stargazer', 
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      totalGifts: 9870,
      totalValue: 98700,
      favoriteGift: '⭐',
      level: 'Elite',
      lastGift: '3 hours ago',
      color: '#A855F7'
    },
    { 
      id: 5, 
      username: '@heartfan', 
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      totalGifts: 7654,
      totalValue: 76540,
      favoriteGift: '❤️',
      level: 'Premium',
      lastGift: '12 hours ago',
      color: '#FF6B9D'
    },
  ]);

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_gifter_profiles');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getLevelColor = (level: string) => {
    if (level === 'VIP') return '#FFD700';
    if (level === 'Elite') return TikTokTheme.colors.brand.cyan;
    return '#A855F7';
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
          source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.profileIcon}>
            <Ionicons name="people" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Top Gifters
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Your most generous supporters
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
        {/* Stats Overview */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsCard}>
          <BlurView intensity={50} style={styles.statsBlur}>
            <LinearGradient
              colors={['rgba(0, 242, 234, 0.15)', 'rgba(168, 85, 247, 0.1)']}
              style={styles.statsContent}
            >
              <View style={styles.stat}>
                <Ionicons name="people" size={24} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.statValue}>{gifters.length}</Text>
                <Text style={styles.statLabel}>Top Gifters</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Ionicons name="gift" size={24} color="#FFD700" />
                <Text style={styles.statValue}>{formatNumber(gifters.reduce((sum, g) => sum + g.totalGifts, 0))}</Text>
                <Text style={styles.statLabel}>Total Gifts</Text>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Gifter List */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Gifter Profiles</Text>
        </Animated.View>

        {gifters.map((gifter, index) => (
          <Animated.View key={gifter.id} entering={FadeInDown.delay(450 + index * 50)}>
            <TouchableOpacity 
              testID={`gifter-profiles-card-${gifter.id}`}
              style={styles.gifterCard}
              onPress={() => {
                analyticsTracker.buttonClick('gifter_profile_open', { gifter: gifter.username });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
                style={styles.gifterBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.gifterBlur}>
                <View style={styles.gifterContent}>
                  {/* Avatar Section */}
                  <View style={styles.avatarContainer}>
                    <Image source={{ uri: gifter.avatar }} style={styles.avatar} />
                    <View style={[styles.levelBadge, { backgroundColor: `${getLevelColor(gifter.level)}20`, borderColor: getLevelColor(gifter.level) }]}>
                      <Text style={[styles.levelText, { color: getLevelColor(gifter.level) }]}>{gifter.level}</Text>
                    </View>
                  </View>

                  {/* Info Section */}
                  <View style={styles.gifterInfo}>
                    <View style={styles.gifterHeader}>
                      <Text style={styles.gifterUsername}>{gifter.username}</Text>
                      <Text style={styles.favoriteGift}>{gifter.favoriteGift}</Text>
                    </View>
                    <Text style={styles.lastGift}>Last gift: {gifter.lastGift}</Text>
                    <View style={styles.gifterStats}>
                      <View style={styles.gifterStat}>
                        <Ionicons name="gift-outline" size={14} color={TikTokTheme.colors.text.secondary} />
                        <Text style={styles.gifterStatText}>{formatNumber(gifter.totalGifts)} gifts</Text>
                      </View>
                      <View style={styles.gifterStat}>
                        <Ionicons name="cash-outline" size={14} color={TikTokTheme.colors.brand.cyan} />
                        <Text style={styles.gifterStatText}>${(gifter.totalValue / 100).toFixed(0)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity 
                    style={[styles.viewButton, { backgroundColor: `${gifter.color}20`, borderColor: gifter.color }]}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                  >
                    <Ionicons name="chevron-forward" size={20} color={gifter.color} />
                  </TouchableOpacity>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}
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
  profileIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  statsCard: { height: 100, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  statsBlur: { flex: 1 },
  statsContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 12, color: TikTokTheme.colors.text.muted },
  statDivider: { width: 1, height: 50, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  gifterCard: { height: 120, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  gifterBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  gifterBlur: { flex: 1 },
  gifterContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', gap: 12 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  levelBadge: { position: 'absolute', bottom: -4, left: -4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  levelText: { fontSize: 10, fontWeight: '900' },
  gifterInfo: { flex: 1 },
  gifterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  gifterUsername: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  favoriteGift: { fontSize: 20 },
  lastGift: { fontSize: 11, color: TikTokTheme.colors.text.muted, marginBottom: 8 },
  gifterStats: { flexDirection: 'row', gap: 12 },
  gifterStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gifterStatText: { fontSize: 12, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  viewButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
});

export default function GifterProfilesScreen() {
  return (
    <GodTierErrorBoundary>
      <GifterProfilesScreenContent />
      <GodTierMetricsBadge />
    </GodTierErrorBoundary>
  );
}
