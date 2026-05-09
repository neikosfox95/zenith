import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

export default function BattleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [battle, setBattle] = useState({
    id: '1',
    creator1: 'darkskully',
    creator2: 'streamerqueen',
    creator1Score: 12450,
    creator2Score: 9320,
    status: 'active',
    viewers: 8540,
    duration: 15,
    totalGifts: 245,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getProgress = () => {
    const total = battle.creator1Score + battle.creator2Score;
    return (battle.creator1Score / total) * 100;
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
          <Animated.View entering={FadeIn} style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE BATTLE</Text>
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Battle Details
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {formatNumber(battle.viewers)} watching
          </Animated.Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Score Display */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.scoreCard}>
          <BlurView intensity={50} style={styles.scoreBlur}>
            <View style={styles.scoreContent}>
              <View style={styles.creatorColumn}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(0, 242, 234, 0.3)' }]}>
                  <Text style={styles.avatarText}>{battle.creator1.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.creatorName}>@{battle.creator1}</Text>
                <Text style={styles.scoreValue}>{formatNumber(battle.creator1Score)}</Text>
              </View>

              <View style={styles.vsSection}>
                <LinearGradient
                  colors={[TikTokTheme.colors.brand.cyan, TikTokTheme.colors.brand.pink]}
                  style={styles.vsCircle}
                >
                  <Text style={styles.vsText}>VS</Text>
                </LinearGradient>
                <Text style={styles.timeText}>{battle.duration}m</Text>
              </View>

              <View style={styles.creatorColumn}>
                <View style={[styles.avatar, { backgroundColor: 'rgba(254, 44, 85, 0.3)' }]}>
                  <Text style={styles.avatarText}>{battle.creator2.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.creatorName}>@{battle.creator2}</Text>
                <Text style={styles.scoreValue}>{formatNumber(battle.creator2Score)}</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[TikTokTheme.colors.brand.cyan, '#00D4FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${getProgress()}%` }]}
                />
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.statsGrid}>
          <View style={styles.statBox}>
            <BlurView intensity={40} style={styles.statBlur}>
              <Ionicons name="people" size={24} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.statValue}>{formatNumber(battle.viewers)}</Text>
              <Text style={styles.statLabel}>Viewers</Text>
            </BlurView>
          </View>
          <View style={styles.statBox}>
            <BlurView intensity={40} style={styles.statBlur}>
              <Ionicons name="gift" size={24} color="#FFD700" />
              <Text style={styles.statValue}>{battle.totalGifts}</Text>
              <Text style={styles.statLabel}>Gifts</Text>
            </BlurView>
          </View>
          <View style={styles.statBox}>
            <BlurView intensity={40} style={styles.statBlur}>
              <Ionicons name="time" size={24} color={TikTokTheme.colors.brand.pink} />
              <Text style={styles.statValue}>{battle.duration}m</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </BlurView>
          </View>
        </Animated.View>

        {/* Recent Events */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Recent Events</Text>
        </Animated.View>

        {[1, 2, 3, 4, 5].map((item, index) => (
          <Animated.View key={item} entering={FadeInDown.delay(600 + index * 50)} style={styles.eventCard}>
            <BlurView intensity={30} style={styles.eventBlur}>
              <View style={styles.eventContent}>
                <View style={[styles.eventIcon, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                  <Ionicons name="gift" size={20} color="#FFD700" />
                </View>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventUser}>@user{item}</Text>
                  <Text style={styles.eventText}>Sent 500 diamonds to @{item % 2 === 0 ? battle.creator1 : battle.creator2}</Text>
                </View>
                <Text style={styles.eventTime}>{item}m ago</Text>
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
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: TikTokTheme.colors.status.live, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 4, marginBottom: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: TikTokTheme.colors.background.primary },
  liveText: { fontSize: 11, fontWeight: '900', color: TikTokTheme.colors.background.primary },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  scoreCard: { height: 280, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  scoreBlur: { flex: 1 },
  scoreContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  creatorColumn: { alignItems: 'center', flex: 1 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary },
  creatorName: { fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.primary, marginBottom: 8 },
  scoreValue: { fontSize: 32, fontWeight: '900', color: TikTokTheme.colors.brand.cyan },
  vsSection: { alignItems: 'center' },
  vsCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  vsText: { fontSize: 16, fontWeight: '900', color: TikTokTheme.colors.background.primary },
  timeText: { fontSize: 12, color: TikTokTheme.colors.text.muted },
  progressContainer: { paddingHorizontal: TikTokTheme.spacing.base, paddingBottom: TikTokTheme.spacing.base },
  progressBar: { height: 8, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%' },
  statsGrid: { flexDirection: 'row', gap: TikTokTheme.spacing.xs, marginBottom: TikTokTheme.spacing.base },
  statBox: { flex: 1, height: 100, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', elevation: 2 },
  statBlur: { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statValue: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 8 },
  statLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  eventCard: { height: 80, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 8, elevation: 2 },
  eventBlur: { flex: 1 },
  eventContent: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: TikTokTheme.spacing.xs, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', gap: 12 },
  eventIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  eventDetails: { flex: 1 },
  eventUser: { fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  eventText: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  eventTime: { fontSize: 11, color: TikTokTheme.colors.text.muted },
});