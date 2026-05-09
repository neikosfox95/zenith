import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

const { width } = Dimensions.get('window');

export default function BattleLeaderboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboard] = useState([
    { rank: 1, username: 'darkskully', wins: 87, losses: 23, winRate: 79.1, totalScore: 1245000 },
    { rank: 2, username: 'streamerqueen', wins: 76, losses: 34, winRate: 69.1, totalScore: 1156000 },
    { rank: 3, username: 'gamerpro', wins: 65, losses: 28, winRate: 69.9, totalScore: 987000 },
    { rank: 4, username: 'musiclive', wins: 54, losses: 31, winRate: 63.5, totalScore: 876000 },
    { rank: 5, username: 'danceking', wins: 48, losses: 27, winRate: 64.0, totalScore: 754000 },
    { rank: 6, username: 'comedyqueen', wins: 42, losses: 33, winRate: 56.0, totalScore: 623000 },
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

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'rgba(255, 215, 0, 0.3)', color: '#FFD700' };
    if (rank === 2) return { bg: 'rgba(192, 192, 192, 0.3)', color: '#C0C0C0' };
    if (rank === 3) return { bg: 'rgba(205, 127, 50, 0.3)', color: '#CD7F32' };
    return { bg: 'rgba(255, 255, 255, 0.1)', color: TikTokTheme.colors.text.primary };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1587400563263-e77a5590bfe7?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.trophyIcon}>
            <Ionicons name="trophy" size={40} color="#FFD700" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Leaderboard
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Top battle champions
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
        {/* Podium - Top 3 */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.podiumSection}>
          <View style={styles.podiumCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1643962579745-bcaa05ffc573?w=400&q=80' }}
              style={styles.podiumBackground}
              blurRadius={4}
            />
            <BlurView intensity={60} style={styles.podiumBlur}>
              <View style={styles.podiumContent}>
                <View style={styles.podiumRow}>
                  {/* 2nd Place */}
                  <View style={styles.podiumPlace}>
                    <View style={[styles.podiumRank, { backgroundColor: 'rgba(192, 192, 192, 0.3)' }]}>
                      <Ionicons name="medal" size={24} color="#C0C0C0" />
                      <Text style={[styles.podiumRankText, { color: '#C0C0C0' }]}>2</Text>
                    </View>
                    <View style={[styles.podiumAvatar, { backgroundColor: 'rgba(192, 192, 192, 0.2)' }]}>
                      <Text style={styles.podiumAvatarText}>{leaderboard[1].username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>@{leaderboard[1].username}</Text>
                    <Text style={styles.podiumWins}>{leaderboard[1].wins} wins</Text>
                  </View>

                  {/* 1st Place */}
                  <View style={[styles.podiumPlace, styles.firstPlace]}>
                    <View style={[styles.podiumRank, { backgroundColor: 'rgba(255, 215, 0, 0.3)' }]}>
                      <Ionicons name="trophy" size={28} color="#FFD700" />
                      <Text style={[styles.podiumRankText, { color: '#FFD700', fontSize: 24 }]}>1</Text>
                    </View>
                    <View style={[styles.podiumAvatar, styles.firstAvatar, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                      <Text style={[styles.podiumAvatarText, { fontSize: 28 }]}>{leaderboard[0].username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.podiumName, { fontSize: 16 }]} numberOfLines={1}>@{leaderboard[0].username}</Text>
                    <Text style={[styles.podiumWins, { fontSize: 16 }]}>{leaderboard[0].wins} wins</Text>
                  </View>

                  {/* 3rd Place */}
                  <View style={styles.podiumPlace}>
                    <View style={[styles.podiumRank, { backgroundColor: 'rgba(205, 127, 50, 0.3)' }]}>
                      <Ionicons name="medal" size={24} color="#CD7F32" />
                      <Text style={[styles.podiumRankText, { color: '#CD7F32' }]}>3</Text>
                    </View>
                    <View style={[styles.podiumAvatar, { backgroundColor: 'rgba(205, 127, 50, 0.2)' }]}>
                      <Text style={styles.podiumAvatarText}>{leaderboard[2].username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>@{leaderboard[2].username}</Text>
                    <Text style={styles.podiumWins}>{leaderboard[2].wins} wins</Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </View>
        </Animated.View>

        {/* Rest of Leaderboard */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Rankings</Text>
        </Animated.View>

        {leaderboard.slice(3).map((player, index) => (
          <Animated.View key={player.rank} entering={FadeInDown.delay(450 + index * 50)} style={styles.playerCard}>
            <BlurView intensity={40} style={styles.playerBlur}>
              <View style={styles.playerContent}>
                <View style={[styles.rankBadge, { backgroundColor: getRankStyle(player.rank).bg }]}>
                  <Text style={[styles.rankText, { color: getRankStyle(player.rank).color }]}>#{player.rank}</Text>
                </View>
                <View style={[styles.playerAvatar, { backgroundColor: 'rgba(0, 242, 234, 0.2)' }]}>
                  <Text style={styles.playerAvatarText}>{player.username.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>@{player.username}</Text>
                  <View style={styles.playerStats}>
                    <Text style={styles.playerStat}>{player.wins}W-{player.losses}L</Text>
                    <View style={styles.statDivider} />
                    <Text style={styles.playerStat}>{player.winRate.toFixed(1)}% WR</Text>
                  </View>
                </View>
                <View style={styles.playerScore}>
                  <Text style={styles.scoreValue}>{formatNumber(player.totalScore)}</Text>
                  <Text style={styles.scoreLabel}>Total Score</Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        ))}
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
  trophyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 215, 0, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: '#FFD700' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  podiumSection: { marginBottom: TikTokTheme.spacing.base },
  podiumCard: { height: 240, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  podiumBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  podiumBlur: { flex: 1 },
  podiumContent: { flex: 1, justifyContent: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  podiumRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  podiumPlace: { alignItems: 'center', flex: 1 },
  firstPlace: { marginBottom: 20 },
  podiumRank: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'absolute', top: -20, zIndex: 10 },
  podiumRankText: { fontSize: 18, fontWeight: '900', position: 'absolute' },
  podiumAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8, marginTop: 20 },
  firstAvatar: { width: 72, height: 72, borderRadius: 36 },
  podiumAvatarText: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary },
  podiumName: { fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  podiumWins: { fontSize: 12, color: TikTokTheme.colors.brand.cyan, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  playerCard: { height: 80, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 8, elevation: 2 },
  playerBlur: { flex: 1 },
  playerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, paddingVertical: TikTokTheme.spacing.xs, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', gap: 12 },
  rankBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 14, fontWeight: '900' },
  playerAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  playerAvatarText: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.text.primary },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: '600', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  playerStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playerStat: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  statDivider: { width: 1, height: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  playerScore: { alignItems: 'flex-end' },
  scoreValue: { fontSize: 16, fontWeight: '900', color: TikTokTheme.colors.brand.cyan, marginBottom: 2 },
  scoreLabel: { fontSize: 10, color: TikTokTheme.colors.text.muted },
});