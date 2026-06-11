import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Dimensions, TextInput } from 'react-native';
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

function BattleHistoryScreenContent() {
  // God Tier: Network detection
  const { isConnected } = useNetwork();

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('battle_history_screen');
    analyticsTracker.screenView('battle_history');
    return () => stopTimer();
  }, []);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [battles, setBattles] = useState([
    { id: '1', creator1: 'darkskully', creator2: 'streamerqueen', winner: 'darkskully', score1: 15300, score2: 14900, date: new Date(Date.now() - 1000 * 60 * 60 * 2), viewers: 12400 },
    { id: '2', creator1: 'gamerpro', creator2: 'musiclive', winner: 'musiclive', score1: 8200, score2: 9500, date: new Date(Date.now() - 1000 * 60 * 60 * 24), viewers: 8540 },
    { id: '3', creator1: 'danceking', creator2: 'comedyqueen', winner: 'danceking', score1: 11200, score2: 9800, date: new Date(Date.now() - 1000 * 60 * 60 * 48), viewers: 6320 },
  ]);

  const handleRefresh = async () => {
    analyticsTracker.buttonClick('refresh_battle_history');
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

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60 / 60);
    if (diff < 24) return `${diff}h ago`;
    const days = Math.floor(diff / 24);
    return `${days}d ago`;
  };

  const filteredBattles = battles.filter(b =>
    b.creator1.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.creator2.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          source={{ uri: 'https://images.pexels.com/photos/7505924/pexels-photo-7505924.jpeg?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.historyIcon}>
            <Ionicons name="time" size={32} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Battle History
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {battles.length} completed battles
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
        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.searchContainer}>
          <BlurView intensity={40} style={styles.searchBlur}>
            <View style={styles.searchContent}>
              <Ionicons name="search" size={20} color={TikTokTheme.colors.text.muted} />
              <TextInput
                testID="battle-history-search-input"
                style={styles.searchInput}
                placeholder="Search battles..."
                placeholderTextColor={TikTokTheme.colors.text.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity testID="battle-history-search-clear" onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={TikTokTheme.colors.text.muted} />
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
        </Animated.View>

        {/* Battle List */}
        {filteredBattles.map((battle, index) => (
          <Animated.View key={battle.id} entering={FadeInDown.delay(400 + index * 50)} style={styles.battleCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1506994011460-5482746d30a1?w=400&q=80' }}
              style={styles.battleBackground}
              blurRadius={4}
            />
            <BlurView intensity={50} style={styles.battleBlur}>
              <View style={styles.battleContent}>
                {/* Winner Badge */}
                <View style={styles.winnerBadge}>
                  <Ionicons name="trophy" size={14} color="#FFD700" />
                  <Text style={styles.winnerText}>@{battle.winner} won</Text>
                </View>

                {/* Creators */}
                <View style={styles.creatorsRow}>
                  <View style={styles.creatorInfo}>
                    <View style={[styles.miniAvatar, { backgroundColor: 'rgba(0, 242, 234, 0.3)' }]}>
                      <Text style={styles.miniAvatarText}>{battle.creator1.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.creatorName}>@{battle.creator1}</Text>
                      <Text style={[styles.scoreText, battle.winner === battle.creator1 && styles.winnerScore]}>
                        {formatNumber(battle.score1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.vsContainer}>
                    <Text style={styles.vsSmall}>VS</Text>
                  </View>

                  <View style={styles.creatorInfo}>
                    <View style={[styles.miniAvatar, { backgroundColor: 'rgba(254, 44, 85, 0.3)' }]}>
                      <Text style={styles.miniAvatarText}>{battle.creator2.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={styles.creatorName}>@{battle.creator2}</Text>
                      <Text style={[styles.scoreText, battle.winner === battle.creator2 && styles.winnerScore]}>
                        {formatNumber(battle.score2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="people" size={12} color={TikTokTheme.colors.text.secondary} />
                    <Text style={styles.statText}>{formatNumber(battle.viewers)}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="time" size={12} color={TikTokTheme.colors.text.secondary} />
                    <Text style={styles.statText}>{formatDate(battle.date)}</Text>
                  </View>
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
  offlineBanner: { backgroundColor: TikTokTheme.colors.status.warning, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  offlineText: { fontSize: 12, fontWeight: '600', color: TikTokTheme.colors.background.primary },
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  heroContainer: { height: 160, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  historyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  searchContainer: { height: 50, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 2 },
  searchBlur: { flex: 1 },
  searchContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  searchInput: { flex: 1, fontSize: 16, color: TikTokTheme.colors.text.primary },
  battleCard: { height: 160, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  battleBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  battleBlur: { flex: 1 },
  battleContent: { flex: 1, padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  winnerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 215, 0, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4, alignSelf: 'flex-start', marginBottom: 12 },
  winnerText: { fontSize: 11, fontWeight: '700', color: '#FFD700' },
  creatorsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 12 },
  creatorInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  miniAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  miniAvatarText: { fontSize: 16, fontWeight: '900', color: TikTokTheme.colors.text.primary },
  creatorName: { fontSize: 13, fontWeight: '600', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  scoreText: { fontSize: 16, fontWeight: '900', color: TikTokTheme.colors.text.secondary },
  winnerScore: { color: TikTokTheme.colors.brand.cyan },
  vsContainer: { paddingHorizontal: 12 },
  vsSmall: { fontSize: 12, fontWeight: '900', color: TikTokTheme.colors.text.muted },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 11, color: TikTokTheme.colors.text.secondary },
  statDivider: { width: 1, height: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
});

export default function BattleHistoryScreen() {
  return (
    <GodTierErrorBoundary>
      <BattleHistoryScreenContent />
      <GodTierMetricsBadge />
    </GodTierErrorBoundary>
  );
}
