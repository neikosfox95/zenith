import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function CategoryLeadersScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('gaming');

  const categories = [
    { id: 'gaming', name: 'Gaming', icon: 'game-controller', color: '#00F2EA' },
    { id: 'music', name: 'Music', icon: 'musical-notes', color: '#FE2C55' },
    { id: 'education', name: 'Education', icon: 'school', color: '#FFD700' },
    { id: 'cooking', name: 'Cooking', icon: 'restaurant', color: '#10B981' },
    { id: 'fitness', name: 'Fitness', icon: 'barbell', color: '#A855F7' },
    { id: 'tech', name: 'Tech', icon: 'hardware-chip', color: '#3B82F6' },
  ];

  const [leaders] = useState([
    {
      rank: 1,
      username: '@progamer2026',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      followers: 890000,
      avgViewers: 18000,
      totalStreams: 142,
      hoursStreamed: 568,
      specialty: 'FPS Games'
    },
    {
      rank: 2,
      username: '@gamemaster',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      followers: 750000,
      avgViewers: 15000,
      totalStreams: 128,
      hoursStreamed: 512,
      specialty: 'RPG Games'
    },
    {
      rank: 3,
      username: '@esportspro',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      followers: 680000,
      avgViewers: 14000,
      totalStreams: 156,
      hoursStreamed: 624,
      specialty: 'Esports'
    },
    {
      rank: 4,
      username: '@casualgamer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      followers: 590000,
      avgViewers: 12000,
      totalStreams: 98,
      hoursStreamed: 392,
      specialty: 'Casual Gaming'
    },
    {
      rank: 5,
      username: '@strategyking',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      followers: 520000,
      avgViewers: 11000,
      totalStreams: 112,
      hoursStreamed: 448,
      specialty: 'Strategy Games'
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

  const currentCategory = categories.find(c => c.id === selectedCategory);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.categoryIcon}>
            <Ionicons name="ribbon" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Category Leaders
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Top creators by category
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
        {/* Categories */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Select Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive
                ]}
                onPress={() => {
                  setSelectedCategory(category.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <BlurView intensity={40} style={styles.categoryBlur}>
                  <LinearGradient
                    colors={[
                      selectedCategory === category.id ? `${category.color}30` : 'rgba(255, 255, 255, 0.05)',
                      selectedCategory === category.id ? `${category.color}10` : 'rgba(255, 255, 255, 0.02)'
                    ]}
                    style={styles.categoryContent}
                  >
                    <Ionicons 
                      name={category.icon as any} 
                      size={24} 
                      color={selectedCategory === category.id ? category.color : TikTokTheme.colors.text.secondary} 
                    />
                    <Text style={[
                      styles.categoryText,
                      selectedCategory === category.id && { color: category.color, fontWeight: '700' }
                    ]}>{category.name}</Text>
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Category Header */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.categoryHeader}>
          <BlurView intensity={50} style={styles.categoryHeaderBlur}>
            <LinearGradient
              colors={[`${currentCategory?.color}25`, `${currentCategory?.color}10`]}
              style={styles.categoryHeaderContent}
            >
              <View style={[styles.categoryHeaderIcon, { backgroundColor: `${currentCategory?.color}30`, borderColor: currentCategory?.color }]}>
                <Ionicons name={currentCategory?.icon as any} size={28} color={currentCategory?.color} />
              </View>
              <View style={styles.categoryHeaderText}>
                <Text style={styles.categoryHeaderTitle}>{currentCategory?.name}</Text>
                <Text style={styles.categoryHeaderSubtitle}>Top 5 Leaders</Text>
              </View>
              <View style={styles.categoryStats}>
                <Text style={[styles.categoryStatsValue, { color: currentCategory?.color }]}>5</Text>
                <Text style={styles.categoryStatsLabel}>Creators</Text>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Leaders List */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
        </Animated.View>

        {leaders.map((leader, index) => (
          <Animated.View key={leader.rank} entering={FadeInDown.delay(550 + index * 50)}>
            <TouchableOpacity 
              style={styles.leaderCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1604941878418-b0fbf86e3590?w=400&q=80' }}
                style={styles.leaderBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.leaderBlur}>
                <View style={styles.leaderContent}>
                  {/* Rank Badge */}
                  <View style={[styles.rankBadge, { borderColor: currentCategory?.color }]}>
                    <LinearGradient
                      colors={[`${currentCategory?.color}40`, `${currentCategory?.color}20`]}
                      style={styles.rankGradient}
                    >
                      <Text style={[styles.rankText, { color: currentCategory?.color }]}>{leader.rank}</Text>
                    </LinearGradient>
                  </View>

                  {/* Avatar */}
                  <Image source={{ uri: leader.avatar }} style={styles.leaderAvatar} />

                  {/* Info */}
                  <View style={styles.leaderInfo}>
                    <Text style={styles.leaderUsername}>{leader.username}</Text>
                    <View style={styles.specialtyBadge}>
                      <Ionicons name={currentCategory?.icon as any} size={11} color={currentCategory?.color} />
                      <Text style={[styles.specialtyText, { color: currentCategory?.color }]}>{leader.specialty}</Text>
                    </View>
                    <View style={styles.leaderStats}>
                      <View style={styles.statPill}>
                        <Ionicons name="people-outline" size={10} color={TikTokTheme.colors.text.muted} />
                        <Text style={styles.statPillText}>{formatNumber(leader.followers)}</Text>
                      </View>
                      <View style={styles.statPill}>
                        <Ionicons name="eye-outline" size={10} color={TikTokTheme.colors.brand.cyan} />
                        <Text style={styles.statPillText}>{formatNumber(leader.avgViewers)}</Text>
                      </View>
                      <View style={styles.statPill}>
                        <Ionicons name="videocam-outline" size={10} color={TikTokTheme.colors.brand.pink} />
                        <Text style={styles.statPillText}>{leader.totalStreams}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Hours */}
                  <View style={styles.hoursContainer}>
                    <Ionicons name="time-outline" size={16} color={currentCategory?.color} />
                    <Text style={[styles.hoursValue, { color: currentCategory?.color }]}>{leader.hoursStreamed}h</Text>
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
  categoryIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  categoriesScroll: { gap: 8, paddingBottom: 16 },
  categoryChip: { width: 120, height: 80, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 2 },
  categoryChipActive: { elevation: 6 },
  categoryBlur: { flex: 1 },
  categoryContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  categoryText: { fontSize: 12, fontWeight: '600', color: TikTokTheme.colors.text.secondary, marginTop: 6 },
  categoryHeader: { height: 90, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  categoryHeaderBlur: { flex: 1 },
  categoryHeaderContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  categoryHeaderIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  categoryHeaderText: { flex: 1 },
  categoryHeaderTitle: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  categoryHeaderSubtitle: { fontSize: 13, color: TikTokTheme.colors.text.secondary },
  categoryStats: { alignItems: 'center' },
  categoryStatsValue: { fontSize: 24, fontWeight: '900' },
  categoryStatsLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted, marginTop: 2 },
  leaderCard: { height: 100, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  leaderBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  leaderBlur: { flex: 1 },
  leaderContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  rankBadge: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 2 },
  rankGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rankText: { fontSize: 16, fontWeight: '900' },
  leaderAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  leaderInfo: { flex: 1 },
  leaderUsername: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 6 },
  specialtyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 6 },
  specialtyText: { fontSize: 10, fontWeight: '700' },
  leaderStats: { flexDirection: 'row', gap: 8 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statPillText: { fontSize: 10, color: TikTokTheme.colors.text.muted, fontWeight: '600' },
  hoursContainer: { alignItems: 'center', gap: 4 },
  hoursValue: { fontSize: 14, fontWeight: '900' },
});