import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function RegionalRankingsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('north-america');
  
  const regions = [
    { id: 'north-america', name: 'North America', flag: '🌎', color: '#00F2EA' },
    { id: 'europe', name: 'Europe', flag: '🇪🇺', color: '#FE2C55' },
    { id: 'asia', name: 'Asia', flag: '🌏', color: '#FFD700' },
    { id: 'latam', name: 'Latin America', flag: '🌎', color: '#10B981' },
  ];

  const [rankings] = useState([
    {
      rank: 1,
      username: '@northstar',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      country: 'United States',
      countryFlag: '🇺🇸',
      followers: 1200000,
      revenue: 234000,
      avgViewers: 23000,
    },
    {
      rank: 2,
      username: '@canadianpro',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      country: 'Canada',
      countryFlag: '🇨🇦',
      followers: 980000,
      revenue: 189000,
      avgViewers: 19000,
    },
    {
      rank: 3,
      username: '@mexicostreamer',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      country: 'Mexico',
      countryFlag: '🇲🇽',
      followers: 850000,
      revenue: 167000,
      avgViewers: 17000,
    },
    {
      rank: 4,
      username: '@usgamer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      country: 'United States',
      countryFlag: '🇺🇸',
      followers: 720000,
      revenue: 145000,
      avgViewers: 15000,
    },
    {
      rank: 5,
      username: '@canadiangaming',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      country: 'Canada',
      countryFlag: '🇨🇦',
      followers: 680000,
      revenue: 134000,
      avgViewers: 14000,
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

  const currentRegion = regions.find(r => r.id === selectedRegion);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1506994011460-5482746d30a1?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.globeIcon}>
            <Ionicons name="globe" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Regional Rankings
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Top creators by region
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
        {/* Region Selector */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Select Region</Text>
          <View style={styles.regionsGrid}>
            {regions.map((region) => (
              <TouchableOpacity
                key={region.id}
                style={[
                  styles.regionCard,
                  selectedRegion === region.id && styles.regionCardActive
                ]}
                onPress={() => {
                  setSelectedRegion(region.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <BlurView intensity={40} style={styles.regionBlur}>
                  <LinearGradient
                    colors={[
                      selectedRegion === region.id ? `${region.color}30` : 'rgba(255, 255, 255, 0.05)',
                      selectedRegion === region.id ? `${region.color}10` : 'rgba(255, 255, 255, 0.02)'
                    ]}
                    style={styles.regionContent}
                  >
                    <Text style={styles.regionFlag}>{region.flag}</Text>
                    <Text style={[
                      styles.regionName,
                      selectedRegion === region.id && { color: region.color }
                    ]}>{region.name}</Text>
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Current Region Header */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.regionHeader}>
          <BlurView intensity={40} style={styles.regionHeaderBlur}>
            <LinearGradient
              colors={[`${currentRegion?.color}20`, `${currentRegion?.color}10`]}
              style={styles.regionHeaderContent}
            >
              <Text style={styles.regionHeaderFlag}>{currentRegion?.flag}</Text>
              <View style={styles.regionHeaderText}>
                <Text style={styles.regionHeaderTitle}>{currentRegion?.name}</Text>
                <Text style={styles.regionHeaderSubtitle}>Top 5 Creators</Text>
              </View>
              <View style={[styles.regionBadge, { backgroundColor: `${currentRegion?.color}30`, borderColor: currentRegion?.color }]}>
                <Ionicons name="people" size={16} color={currentRegion?.color} />
                <Text style={[styles.regionBadgeText, { color: currentRegion?.color }]}>5</Text>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Rankings List */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
        </Animated.View>

        {rankings.map((creator, index) => (
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
                  {/* Rank */}
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankText}>{creator.rank}</Text>
                  </View>

                  {/* Avatar & Country */}
                  <View style={styles.avatarContainer}>
                    <Image source={{ uri: creator.avatar }} style={styles.avatar} />
                    <Text style={styles.countryFlag}>{creator.countryFlag}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.creatorInfo}>
                    <Text style={styles.creatorUsername}>{creator.username}</Text>
                    <Text style={styles.creatorCountry}>{creator.country}</Text>
                    <View style={styles.statsRow}>
                      <View style={styles.miniStat}>
                        <Ionicons name="people-outline" size={11} color={TikTokTheme.colors.text.muted} />
                        <Text style={styles.miniStatText}>{formatNumber(creator.followers)}</Text>
                      </View>
                      <View style={styles.miniStat}>
                        <Ionicons name="eye-outline" size={11} color={TikTokTheme.colors.brand.cyan} />
                        <Text style={styles.miniStatText}>{formatNumber(creator.avgViewers)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Revenue */}
                  <View style={styles.revenueContainer}>
                    <Text style={styles.revenueValue}>${(creator.revenue / 100).toFixed(0)}</Text>
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
  globeIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  regionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: TikTokTheme.spacing.base },
  regionCard: { width: '48%', height: 100, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 2 },
  regionCardActive: { elevation: 6 },
  regionBlur: { flex: 1 },
  regionContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  regionFlag: { fontSize: 36, marginBottom: 8 },
  regionName: { fontSize: 13, fontWeight: '700', color: TikTokTheme.colors.text.primary, textAlign: 'center' },
  regionHeader: { height: 80, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  regionHeaderBlur: { flex: 1 },
  regionHeaderContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  regionHeaderFlag: { fontSize: 40 },
  regionHeaderText: { flex: 1 },
  regionHeaderTitle: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  regionHeaderSubtitle: { fontSize: 13, color: TikTokTheme.colors.text.secondary },
  regionBadge: { width: 56, height: 56, borderRadius: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, borderWidth: 2 },
  regionBadgeText: { fontSize: 16, fontWeight: '900' },
  creatorCard: { height: 90, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  creatorBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  creatorBlur: { flex: 1 },
  creatorContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  rankCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: TikTokTheme.colors.brand.cyan },
  rankText: { fontSize: 16, fontWeight: '900', color: TikTokTheme.colors.brand.cyan },
  avatarContainer: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  countryFlag: { position: 'absolute', bottom: -4, right: -4, fontSize: 20 },
  creatorInfo: { flex: 1 },
  creatorUsername: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  creatorCountry: { fontSize: 12, color: TikTokTheme.colors.text.secondary, marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 12 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniStatText: { fontSize: 11, color: TikTokTheme.colors.text.muted, fontWeight: '600' },
  revenueContainer: { alignItems: 'flex-end' },
  revenueValue: { fontSize: 18, fontWeight: '900', color: '#10B981' },
});