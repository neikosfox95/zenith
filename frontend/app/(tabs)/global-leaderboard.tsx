import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

const { width } = Dimensions.get('window');

export default function GlobalLeaderboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('week');
  const [topCreators] = useState([
    {
      rank: 1,
      username: '@megastreamer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      followers: 2400000,
      totalRevenue: 456000,
      avgViewers: 45000,
      streams: 28,
      country: '🇺🇸',
      trending: true
    },
    {
      rank: 2,
      username: '@proplayer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      followers: 1890000,
      totalRevenue: 389000,
      avgViewers: 38000,
      streams: 24,
      country: '🇬🇧',
      trending: false
    },
    {
      rank: 3,
      username: '@streamqueen',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      followers: 1650000,
      totalRevenue: 342000,
      avgViewers: 32000,
      streams: 32,
      country: '🇨🇦',
      trending: true
    },
    {
      rank: 4,
      username: '@gaminglegend',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      followers: 1420000,
      totalRevenue: 298000,
      avgViewers: 28000,
      streams: 26,
      country: '🇰🇷',
      trending: false
    },
    {
      rank: 5,
      username: '@contentking',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      followers: 1280000,
      totalRevenue: 267000,
      avgViewers: 25000,
      streams: 30,
      country: '🇯🇵',
      trending: true
    },
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

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return TikTokTheme.colors.brand.cyan;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return 'trophy';
    if (rank === 2) return 'medal';
    if (rank === 3) return 'medal-outline';
    return 'ribbon-outline';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1615507184109-662bbacd09cb?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.trophyIcon}>
            <Ionicons name="trophy" size={36} color="#FFD700" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Global Leaderboard
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Top creators worldwide
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
        {/* Timeframe Selector */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.timeframeRow}>
          {['today', 'week', 'month', 'all'].map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.timeframeChip, timeframe === tf && styles.timeframeActive]}
              onPress={() => {
                setTimeframe(tf);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.timeframeText, timeframe === tf && styles.timeframeTextActive]}>
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Podium - Top 3 */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.podiumSection}>
          <BlurView intensity={50} style={styles.podiumBlur}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=400&q=80' }}
              style={styles.podiumBackground}
              blurRadius={4}
            />
            <View style={styles.podiumContent}>
              <View style={styles.podiumRow}>
                {/* 2nd Place */}
                <View style={styles.podiumPlace}>
                  <Image source={{ uri: topCreators[1].avatar }} style={styles.podiumAvatar} />
                  <View style={[styles.podiumRank, { backgroundColor: 'rgba(192, 192, 192, 0.3)', borderColor: '#C0C0C0' }]}>
                    <Text style={[styles.podiumRankText, { color: '#C0C0C0' }]}>2</Text>
                  </View>
                  <Text style={styles.podiumUsername}>{topCreators[1].username}</Text>
                  <Text style={styles.podiumRevenue}>${(topCreators[1].totalRevenue / 100).toFixed(0)}</Text>
                </View>

                {/* 1st Place */}
                <View style={[styles.podiumPlace, styles.firstPlace]}>
                  <Image source={{ uri: topCreators[0].avatar }} style={[styles.podiumAvatar, { width: 80, height: 80, borderWidth: 3 }]} />
                  <View style={[styles.podiumRank, { backgroundColor: 'rgba(255, 215, 0, 0.3)', borderColor: '#FFD700', width: 48, height: 48 }]}>
                    <Ionicons name="trophy" size={20} color="#FFD700" />
                  </View>
                  <Text style={[styles.podiumUsername, { fontSize: 16 }]}>{topCreators[0].username}</Text>
                  <Text style={[styles.podiumRevenue, { fontSize: 15 }]}>${(topCreators[0].totalRevenue / 100).toFixed(0)}</Text>
                </View>

                {/* 3rd Place */}
                <View style={styles.podiumPlace}>
                  <Image source={{ uri: topCreators[2].avatar }} style={styles.podiumAvatar} />
                  <View style={[styles.podiumRank, { backgroundColor: 'rgba(205, 127, 50, 0.3)', borderColor: '#CD7F32' }]}>
                    <Text style={[styles.podiumRankText, { color: '#CD7F32' }]}>3</Text>
                  </View>
                  <Text style={styles.podiumUsername}>{topCreators[2].username}</Text>
                  <Text style={styles.podiumRevenue}>${(topCreators[2].totalRevenue / 100).toFixed(0)}</Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Full Rankings */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Top Creators</Text>
        </Animated.View>

        {topCreators.map((creator, index) => (
          <Animated.View key={creator.rank} entering={FadeInDown.delay(550 + index * 50)}>
            <TouchableOpacity 
              style={styles.creatorCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
                style={styles.creatorBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.creatorBlur}>
                <View style={styles.creatorContent}>
                  {/* Rank Badge */}
                  <View style={[styles.rankBadge, { backgroundColor: `${getRankColor(creator.rank)}20`, borderColor: getRankColor(creator.rank) }]}>
                    <Ionicons name={getRankIcon(creator.rank) as any} size={16} color={getRankColor(creator.rank)} />
                    <Text style={[styles.rankText, { color: getRankColor(creator.rank) }]}>{creator.rank}</Text>
                  </View>

                  {/* Avatar */}
                  <Image source={{ uri: creator.avatar }} style={styles.creatorAvatar} />

                  {/* Info */}
                  <View style={styles.creatorInfo}>
                    <View style={styles.creatorHeader}>
                      <Text style={styles.creatorUsername}>{creator.username}</Text>
                      {creator.trending && (
                        <View style={styles.trendingBadge}>
                          <Ionicons name="flame" size={12} color="#FE2C55" />
                        </View>
                      )}
                      <Text style={styles.countryFlag}>{creator.country}</Text>
                    </View>
                    <View style={styles.creatorStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="people-outline" size={12} color={TikTokTheme.colors.text.secondary} />
                        <Text style={styles.statText}>{formatNumber(creator.followers)}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="eye-outline" size={12} color={TikTokTheme.colors.brand.cyan} />
                        <Text style={styles.statText}>{formatNumber(creator.avgViewers)}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="videocam-outline" size={12} color={TikTokTheme.colors.brand.pink} />
                        <Text style={styles.statText}>{creator.streams}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Revenue */}
                  <View style={styles.revenueColumn}>
                    <Text style={styles.revenueValue}>${(creator.totalRevenue / 100).toFixed(0)}</Text>
                    <Text style={styles.revenueLabel}>Revenue</Text>
                  </View>
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
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  heroContainer: { height: 160, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  trophyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255, 215, 0, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#FFD700' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  timeframeRow: { flexDirection: 'row', gap: 8, marginBottom: TikTokTheme.spacing.base },
  timeframeChip: { flex: 1, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  timeframeActive: { backgroundColor: 'rgba(0, 242, 234, 0.2)', borderColor: TikTokTheme.colors.brand.cyan },
  timeframeText: { fontSize: 13, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  timeframeTextActive: { color: TikTokTheme.colors.brand.cyan, fontWeight: '700' },
  podiumSection: { height: 240, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 6 },
  podiumBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  podiumBlur: { flex: 1 },
  podiumContent: { flex: 1, justifyContent: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  podiumRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  podiumPlace: { alignItems: 'center', flex: 1 },
  firstPlace: { marginBottom: 20 },
  podiumAvatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 8, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  podiumRank: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 2 },
  podiumRankText: { fontSize: 16, fontWeight: '900' },
  podiumUsername: { fontSize: 13, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  podiumRevenue: { fontSize: 12, color: TikTokTheme.colors.brand.cyan, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  creatorCard: { height: 100, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  creatorBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  creatorBlur: { flex: 1 },
  creatorContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  rankBadge: { width: 44, height: 44, borderRadius: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, borderWidth: 2 },
  rankText: { fontSize: 14, fontWeight: '900' },
  creatorAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  creatorInfo: { flex: 1 },
  creatorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  creatorUsername: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  trendingBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(254, 44, 85, 0.2)', justifyContent: 'center', alignItems: 'center' },
  countryFlag: { fontSize: 16 },
  creatorStats: { flexDirection: 'row', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  revenueColumn: { alignItems: 'flex-end' },
  revenueValue: { fontSize: 18, fontWeight: '900', color: '#10B981', marginBottom: 2 },
  revenueLabel: { fontSize: 10, color: TikTokTheme.colors.text.muted },
});