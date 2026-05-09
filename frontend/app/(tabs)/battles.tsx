import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

const { width } = Dimensions.get('window');

interface Battle {
  id: string;
  creator1: string;
  creator2: string;
  creator1Score: number;
  creator2Score: number;
  status: 'active' | 'completed' | 'upcoming';
  viewers: number;
  startTime: Date;
  endTime?: Date;
}

export default function BattlesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadBattles();
  }, []);

  const loadBattles = async () => {
    const mockBattles: Battle[] = [
      {
        id: '1',
        creator1: 'darkskully',
        creator2: 'streamerqueen',
        creator1Score: 12450,
        creator2Score: 9320,
        status: 'active',
        viewers: 8540,
        startTime: new Date(Date.now() - 1000 * 60 * 15),
      },
      {
        id: '2',
        creator1: 'gamerpro',
        creator2: 'musiclive',
        creator1Score: 5600,
        creator2Score: 7200,
        status: 'active',
        viewers: 4230,
        startTime: new Date(Date.now() - 1000 * 60 * 8),
      },
      {
        id: '3',
        creator1: 'danceking',
        creator2: 'comedyqueen',
        creator1Score: 15300,
        creator2Score: 14900,
        status: 'completed',
        viewers: 12400,
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
        endTime: new Date(Date.now() - 1000 * 60 * 30),
      },
    ];
    setBattles(mockBattles);
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await loadBattles();
    setRefreshing(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getWinner = (battle: Battle) => {
    if (battle.status !== 'completed') return null;
    return battle.creator1Score > battle.creator2Score ? battle.creator1 : battle.creator2;
  };

  const filteredBattles = battles.filter(b => 
    filter === 'all' || b.status === filter
  );

  const activeBattles = battles.filter(b => b.status === 'active').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Hero Section */}
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
          <Animated.View entering={FadeIn} style={styles.battleIcon}>
            <Ionicons name="trophy" size={32} color={TikTokTheme.colors.charts.accent4} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Battle Arena
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {activeBattles} battles happening now
          </Animated.Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={TikTokTheme.colors.brand.cyan}
            colors={[TikTokTheme.colors.brand.cyan]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsGrid}>
          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(254, 44, 85, 0.15)', 'rgba(254, 44, 85, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="flame" size={32} color={TikTokTheme.colors.brand.pink} />
                <Text style={styles.statValue}>{activeBattles}</Text>
                <Text style={styles.statLabel}>Active Now</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="trophy" size={32} color="#FFD700" />
                <Text style={styles.statValue}>{battles.filter(b => b.status === 'completed').length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.filterContainer}>
          {(['all', 'active', 'completed'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(filterType);
              }}
              style={[
                styles.filterTab,
                filter === filterType && styles.filterTabActive,
              ]}
            >
              <Text style={[
                styles.filterText,
                filter === filterType && styles.filterTextActive,
              ]}>
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Battles List */}
        {filteredBattles.length > 0 ? (
          filteredBattles.map((battle, index) => (
            <Animated.View
              key={battle.id}
              entering={FadeInUp.delay(500 + index * 100)}
              style={styles.battleCard}
            >
              <Image
                source={{ uri: 'https://images.pexels.com/photos/14240656/pexels-photo-14240656.jpeg?w=400&q=80' }}
                style={styles.battleBackground}
                blurRadius={4}
              />
              <BlurView intensity={50} style={styles.battleBlur}>
                <View style={styles.battleContent}>
                  {/* Status Badge */}
                  {battle.status === 'active' && (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                  {battle.status === 'completed' && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={TikTokTheme.colors.background.primary} />
                      <Text style={styles.completedText}>ENDED</Text>
                    </View>
                  )}

                  {/* Creator 1 */}
                  <View style={styles.creatorSection}>
                    <View style={[styles.creatorAvatar, { backgroundColor: 'rgba(0, 242, 234, 0.3)' }]}>
                      <Text style={styles.avatarText}>{battle.creator1.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.creatorName} numberOfLines={1}>@{battle.creator1}</Text>
                    <Text style={[styles.score, battle.creator1Score > battle.creator2Score && styles.winningScore]}>
                      {formatNumber(battle.creator1Score)}
                    </Text>
                  </View>

                  {/* VS Divider */}
                  <View style={styles.vsDivider}>
                    <LinearGradient
                      colors={[TikTokTheme.colors.brand.cyan, TikTokTheme.colors.brand.pink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.vsGradient}
                    >
                      <Text style={styles.vsText}>VS</Text>
                    </LinearGradient>
                  </View>

                  {/* Creator 2 */}
                  <View style={styles.creatorSection}>
                    <View style={[styles.creatorAvatar, { backgroundColor: 'rgba(254, 44, 85, 0.3)' }]}>
                      <Text style={styles.avatarText}>{battle.creator2.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.creatorName} numberOfLines={1}>@{battle.creator2}</Text>
                    <Text style={[styles.score, battle.creator2Score > battle.creator1Score && styles.winningScore]}>
                      {formatNumber(battle.creator2Score)}
                    </Text>
                  </View>

                  {/* Battle Info */}
                  <View style={styles.battleInfo}>
                    <View style={styles.infoItem}>
                      <Ionicons name="people" size={14} color={TikTokTheme.colors.text.secondary} />
                      <Text style={styles.infoText}>{formatNumber(battle.viewers)} viewers</Text>
                    </View>
                    {battle.status === 'completed' && getWinner(battle) && (
                      <View style={styles.winnerBadge}>
                        <Ionicons name="trophy" size={12} color="#FFD700" />
                        <Text style={styles.winnerText}>@{getWinner(battle)} won!</Text>
                      </View>
                    )}
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
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
              style={styles.emptyOverlay}
            >
              <Ionicons name="trophy-outline" size={64} color={TikTokTheme.colors.text.muted} />
              <Text style={styles.emptyTitle}>No Battles</Text>
              <Text style={styles.emptyText}>Check back later for new battles</Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TikTokTheme.colors.background.primary,
  },
  heroContainer: {
    height: 160,
    position: 'relative',
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  battleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: TikTokTheme.colors.text.primary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: TikTokTheme.colors.text.secondary,
  },
  scrollContent: {
    padding: TikTokTheme.spacing.base,
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: TikTokTheme.spacing.base,
    marginBottom: TikTokTheme.spacing.base,
  },
  statCard: {
    flex: 1,
    height: 120,
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
  },
  statBlur: {
    flex: 1,
  },
  statContent: {
    flex: 1,
    padding: TikTokTheme.spacing.base,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: TikTokTheme.colors.text.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: TikTokTheme.colors.text.muted,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: TikTokTheme.spacing.base,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: TikTokTheme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: TikTokTheme.colors.brand.cyan,
    borderColor: TikTokTheme.colors.brand.cyan,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: TikTokTheme.colors.text.secondary,
  },
  filterTextActive: {
    color: TikTokTheme.colors.background.primary,
  },
  battleCard: {
    height: 220,
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: TikTokTheme.spacing.base,
    elevation: 4,
  },
  battleBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  battleBlur: {
    flex: 1,
  },
  battleContent: {
    flex: 1,
    padding: TikTokTheme.spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TikTokTheme.colors.status.live,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: TikTokTheme.colors.background.primary,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '900',
    color: TikTokTheme.colors.background.primary,
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  completedText: {
    fontSize: 11,
    fontWeight: '900',
    color: TikTokTheme.colors.background.primary,
  },
  creatorSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  creatorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: TikTokTheme.colors.text.primary,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '600',
    color: TikTokTheme.colors.text.primary,
    marginBottom: 4,
  },
  score: {
    fontSize: 24,
    fontWeight: '900',
    color: TikTokTheme.colors.text.secondary,
  },
  winningScore: {
    color: TikTokTheme.colors.brand.cyan,
  },
  vsDivider: {
    alignItems: 'center',
    marginVertical: 12,
  },
  vsGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900',
    color: TikTokTheme.colors.background.primary,
  },
  battleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: TikTokTheme.colors.text.secondary,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  winnerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
  },
  emptyState: {
    height: 300,
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    marginTop: TikTokTheme.spacing.base,
    elevation: 2,
  },
  emptyImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  emptyOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: TikTokTheme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TikTokTheme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: TikTokTheme.colors.text.secondary,
  },
});