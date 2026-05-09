import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

const { width } = Dimensions.get('window');

export default function FanClubScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 12450,
    activeFans: 8320,
    topSupporter: '@superfan123',
    totalBadges: 24,
    tier1: 8200,
    tier2: 3100,
    tier3: 1150,
  });

  const handleRefresh = async () => {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.fanIcon}>
            <Ionicons name="heart" size={36} color={TikTokTheme.colors.brand.pink} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Fan Club
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {formatNumber(stats.totalMembers)} members strong
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
        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsGrid}>
          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="people" size={32} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.statValue}>{formatNumber(stats.totalMembers)}</Text>
                <Text style={styles.statLabel}>Total Members</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(254, 44, 85, 0.15)', 'rgba(254, 44, 85, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="flame" size={32} color={TikTokTheme.colors.brand.pink} />
                <Text style={styles.statValue}>{formatNumber(stats.activeFans)}</Text>
                <Text style={styles.statLabel}>Active Fans</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Top Supporter Card */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.topSupporterSection}>
          <Text style={styles.sectionTitle}>Top Supporter</Text>
          <View style={styles.topSupporterCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=400&q=80' }}
              style={styles.topSupporterBackground}
              blurRadius={4}
            />
            <BlurView intensity={60} style={styles.topSupporterBlur}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.topSupporterContent}
              >
                <View style={styles.crownIcon}>
                  <Ionicons name="trophy" size={32} color="#FFD700" />
                </View>
                <Text style={styles.topSupporterName}>{stats.topSupporter}</Text>
                <Text style={styles.topSupporterBadge}>👑 VIP Fan</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Tier Breakdown */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Membership Tiers</Text>
        </Animated.View>

        {/* Tier 1 */}
        <Animated.View entering={FadeInDown.delay(550)} style={styles.tierCard}>
          <BlurView intensity={40} style={styles.tierBlur}>
            <View style={styles.tierContent}>
              <View style={[styles.tierIcon, { backgroundColor: 'rgba(192, 192, 192, 0.3)' }]}>
                <Ionicons name="star" size={24} color="#C0C0C0" />
              </View>
              <View style={styles.tierInfo}>
                <Text style={styles.tierName}>Silver Fans</Text>
                <Text style={styles.tierDescription}>Regular supporters</Text>
              </View>
              <View style={styles.tierStats}>
                <Text style={styles.tierCount}>{formatNumber(stats.tier1)}</Text>
                <Text style={styles.tierLabel}>members</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Tier 2 */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.tierCard}>
          <BlurView intensity={40} style={styles.tierBlur}>
            <View style={styles.tierContent}>
              <View style={[styles.tierIcon, { backgroundColor: 'rgba(255, 215, 0, 0.3)' }]}>
                <Ionicons name="star" size={24} color="#FFD700" />
              </View>
              <View style={styles.tierInfo}>
                <Text style={styles.tierName}>Gold Fans</Text>
                <Text style={styles.tierDescription}>Dedicated supporters</Text>
              </View>
              <View style={styles.tierStats}>
                <Text style={styles.tierCount}>{formatNumber(stats.tier2)}</Text>
                <Text style={styles.tierLabel}>members</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Tier 3 */}
        <Animated.View entering={FadeInDown.delay(650)} style={styles.tierCard}>
          <BlurView intensity={40} style={styles.tierBlur}>
            <View style={styles.tierContent}>
              <View style={[styles.tierIcon, { backgroundColor: 'rgba(0, 242, 234, 0.3)' }]}>
                <Ionicons name="diamond" size={24} color={TikTokTheme.colors.brand.cyan} />
              </View>
              <View style={styles.tierInfo}>
                <Text style={styles.tierName}>Diamond Fans</Text>
                <Text style={styles.tierDescription}>Elite supporters</Text>
              </View>
              <View style={styles.tierStats}>
                <Text style={styles.tierCount}>{formatNumber(stats.tier3)}</Text>
                <Text style={styles.tierLabel}>members</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
            <LinearGradient
              colors={[TikTokTheme.colors.brand.cyan, TikTokTheme.colors.charts.tertiary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="people" size={20} color={TikTokTheme.colors.background.primary} />
              <Text style={styles.actionText}>View Top Fans</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
            <LinearGradient
              colors={[TikTokTheme.colors.brand.pink, '#FF6B9D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="ribbon" size={20} color={TikTokTheme.colors.background.primary} />
              <Text style={styles.actionText}>View Badges</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  heroContainer: { height: 180, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fanIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(254, 44, 85, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.pink },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', gap: TikTokTheme.spacing.base, marginBottom: TikTokTheme.spacing.base },
  statCard: { flex: 1, height: 140, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  statBlur: { flex: 1 },
  statContent: { flex: 1, padding: TikTokTheme.spacing.base, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statValue: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 8 },
  statLabel: { fontSize: 12, color: TikTokTheme.colors.text.muted, marginTop: 4, textAlign: 'center' },
  topSupporterSection: { marginBottom: TikTokTheme.spacing.base },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  topSupporterCard: { height: 160, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  topSupporterBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  topSupporterBlur: { flex: 1 },
  topSupporterContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)' },
  crownIcon: { marginBottom: 12 },
  topSupporterName: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 8 },
  topSupporterBadge: { fontSize: 16, color: '#FFD700', fontWeight: '700' },
  tierCard: { height: 80, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  tierBlur: { flex: 1 },
  tierContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', gap: 12 },
  tierIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  tierInfo: { flex: 1 },
  tierName: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  tierDescription: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  tierStats: { alignItems: 'flex-end' },
  tierCount: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.brand.cyan, marginBottom: 2 },
  tierLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted },
  actionsSection: { flexDirection: 'row', gap: TikTokTheme.spacing.base, marginTop: 8 },
  actionButton: { flex: 1, height: 56, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', elevation: 4 },
  actionGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.background.primary },
});