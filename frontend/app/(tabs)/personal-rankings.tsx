import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function PersonalRankingsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const [myRankings] = useState({
    global: { rank: 342, total: 50000, percentile: 99.3, change: 'up' },
    regional: { rank: 23, total: 2400, percentile: 99.0, change: 'up' },
    category: { rank: 15, total: 1200, percentile: 98.8, change: 'down' },
  });

  const [myStats] = useState({
    followers: 145000,
    avgViewers: 3200,
    totalStreams: 87,
    totalRevenue: 45600,
    hoursStreamed: 348,
    avgRating: 4.7,
  });

  const [achievements] = useState([
    { id: 1, title: 'Rising Star', desc: 'Reached top 500 globally', icon: 'star', color: '#FFD700', earned: true },
    { id: 2, title: 'Regional Hero', desc: 'Top 25 in your region', icon: 'medal', color: '#00F2EA', earned: true },
    { id: 3, title: 'Consistent Streamer', desc: '50+ streams completed', icon: 'checkmark-circle', color: '#10B981', earned: true },
    { id: 4, title: 'Big Spender', desc: '$10K+ in gifts received', icon: 'gift', color: '#FE2C55', earned: false },
  ]);

  const [milestones] = useState([
    { id: 1, title: 'Next Rank Milestone', target: 300, current: 342, type: 'rank', icon: 'trending-up', color: TikTokTheme.colors.brand.cyan },
    { id: 2, title: '150K Followers', target: 150000, current: 145000, type: 'followers', icon: 'people', color: TikTokTheme.colors.brand.pink },
    { id: 3, title: '100 Streams', target: 100, current: 87, type: 'streams', icon: 'videocam', color: '#FFD700' },
  ]);

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

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
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
          <Animated.View entering={FadeIn} style={styles.userIcon}>
            <Ionicons name="person" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Your Rankings
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Track your position
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
        {/* Rank Cards */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Your Current Ranks</Text>
        </Animated.View>

        {/* Global Rank */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.rankCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1615507184109-662bbacd09cb?w=400&q=80' }}
            style={styles.rankBackground}
            blurRadius={5}
          />
          <BlurView intensity={50} style={styles.rankBlur}>
            <LinearGradient
              colors={['rgba(0, 242, 234, 0.2)', 'rgba(0, 242, 234, 0.05)']}
              style={styles.rankContent}
            >
              <View style={styles.rankHeader}>
                <Ionicons name="globe" size={24} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.rankTitle}>Global Rank</Text>
                <View style={[styles.changeBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="arrow-up" size={12} color="#10B981" />
                </View>
              </View>
              <View style={styles.rankStats}>
                <Text style={styles.rankValue}>#{myRankings.global.rank}</Text>
                <Text style={styles.rankTotal}>of {formatNumber(myRankings.global.total)}</Text>
              </View>
              <Text style={styles.percentile}>Top {(100 - myRankings.global.percentile).toFixed(1)}%</Text>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Regional & Category Ranks */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.rankRow}>
          <View style={styles.miniRankCard}>
            <BlurView intensity={40} style={styles.miniRankBlur}>
              <LinearGradient
                colors={['rgba(254, 44, 85, 0.2)', 'rgba(254, 44, 85, 0.05)']}
                style={styles.miniRankContent}
              >
                <Ionicons name="location" size={20} color={TikTokTheme.colors.brand.pink} />
                <Text style={styles.miniRankTitle}>Regional</Text>
                <Text style={styles.miniRankValue}>#{myRankings.regional.rank}</Text>
                <Text style={styles.miniRankTotal}>of {formatNumber(myRankings.regional.total)}</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.miniRankCard}>
            <BlurView intensity={40} style={styles.miniRankBlur}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.miniRankContent}
              >
                <Ionicons name="ribbon" size={20} color="#FFD700" />
                <Text style={styles.miniRankTitle}>Category</Text>
                <Text style={styles.miniRankValue}>#{myRankings.category.rank}</Text>
                <Text style={styles.miniRankTotal}>of {formatNumber(myRankings.category.total)}</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* My Stats */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(550)} style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color={TikTokTheme.colors.brand.cyan} />
            <Text style={styles.statValue}>{formatNumber(myStats.followers)}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="eye" size={24} color={TikTokTheme.colors.brand.pink} />
            <Text style={styles.statValue}>{formatNumber(myStats.avgViewers)}</Text>
            <Text style={styles.statLabel}>Avg Viewers</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="videocam" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{myStats.totalStreams}</Text>
            <Text style={styles.statLabel}>Streams</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={24} color="#10B981" />
            <Text style={styles.statValue}>${(myStats.totalRevenue / 100).toFixed(0)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </Animated.View>

        {/* Milestones */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <Text style={styles.sectionTitle}>Next Milestones</Text>
        </Animated.View>

        {milestones.map((milestone, index) => (
          <Animated.View key={milestone.id} entering={FadeInDown.delay(650 + index * 50)} style={styles.milestoneCard}>
            <BlurView intensity={40} style={styles.milestoneBlur}>
              <View style={styles.milestoneContent}>
                <View style={[styles.milestoneIcon, { backgroundColor: `${milestone.color}20` }]}>
                  <Ionicons name={milestone.icon as any} size={20} color={milestone.color} />
                </View>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                  <View style={styles.progressBar}>
                    <LinearGradient
                      colors={[milestone.color, `${milestone.color}80`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${getProgress(milestone.current, milestone.target)}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {milestone.type === 'rank' ? `${milestone.current} → ${milestone.target}` : `${formatNumber(milestone.current)} / ${formatNumber(milestone.target)}`}
                  </Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        ))}

        {/* Achievements */}
        <Animated.View entering={FadeInDown.delay(800)}>
          <Text style={styles.sectionTitle}>Achievements</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(850)} style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={[styles.achievementCard, !achievement.earned && styles.achievementLocked]}>
              <BlurView intensity={30} style={styles.achievementBlur}>
                <View style={styles.achievementContent}>
                  <View style={[styles.achievementIcon, { backgroundColor: `${achievement.color}${achievement.earned ? '30' : '10'}` }]}>
                    <Ionicons 
                      name={achievement.earned ? achievement.icon as any : 'lock-closed'} 
                      size={28} 
                      color={achievement.earned ? achievement.color : TikTokTheme.colors.text.muted} 
                    />
                  </View>
                  <Text style={[styles.achievementTitle, !achievement.earned && { color: TikTokTheme.colors.text.muted }]}>{achievement.title}</Text>
                  <Text style={styles.achievementDesc}>{achievement.desc}</Text>
                </View>
              </BlurView>
            </View>
          ))}
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
  userIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  rankCard: { height: 140, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 6 },
  rankBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  rankBlur: { flex: 1 },
  rankContent: { flex: 1, padding: TikTokTheme.spacing.base, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.3)' },
  rankHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  changeBadge: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  rankStats: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  rankValue: { fontSize: 40, fontWeight: '900', color: TikTokTheme.colors.brand.cyan },
  rankTotal: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  percentile: { fontSize: 13, color: '#10B981', fontWeight: '700' },
  rankRow: { flexDirection: 'row', gap: 12, marginBottom: TikTokTheme.spacing.base },
  miniRankCard: { flex: 1, height: 130, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  miniRankBlur: { flex: 1 },
  miniRankContent: { flex: 1, padding: 12, justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  miniRankTitle: { fontSize: 13, fontWeight: '600', color: TikTokTheme.colors.text.secondary },
  miniRankValue: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary },
  miniRankTotal: { fontSize: 11, color: TikTokTheme.colors.text.muted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: TikTokTheme.spacing.base },
  statCard: { width: '48%', height: 100, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: TikTokTheme.borderRadius.md, padding: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statValue: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted },
  milestoneCard: { height: 80, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  milestoneBlur: { flex: 1 },
  milestoneContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  milestoneIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  milestoneInfo: { flex: 1 },
  milestoneTitle: { fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%' },
  progressText: { fontSize: 11, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  achievementCard: { width: '48%', height: 140, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 2 },
  achievementLocked: { opacity: 0.5 },
  achievementBlur: { flex: 1 },
  achievementContent: { flex: 1, padding: 12, justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  achievementIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  achievementTitle: { fontSize: 13, fontWeight: '700', color: TikTokTheme.colors.text.primary, textAlign: 'center' },
  achievementDesc: { fontSize: 10, color: TikTokTheme.colors.text.muted, textAlign: 'center' },
});