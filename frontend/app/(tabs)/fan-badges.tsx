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
const CARD_WIDTH = (width - 48) / 2;

export default function FanBadgesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [badges] = useState([
    { id: 1, name: 'First Follower', icon: 'star', color: '#FFD700', description: 'Among the first 100 followers', earned: 45 },
    { id: 2, name: 'Gift Master', icon: 'gift', color: '#FF6B9D', description: 'Sent 100+ gifts', earned: 234 },
    { id: 3, name: 'Super Fan', icon: 'heart', color: '#FE2C55', description: 'Watched 50+ streams', earned: 567 },
    { id: 4, name: 'Diamond Donor', icon: 'diamond', color: '#00F2EA', description: 'Sent $1000+ in gifts', earned: 89 },
    { id: 5, name: 'Loyal Viewer', icon: 'eye', color: '#A855F7', description: '30-day streak', earned: 342 },
    { id: 6, name: 'Chat Champion', icon: 'chatbubbles', color: '#3B82F6', description: '1000+ messages sent', earned: 198 },
    { id: 7, name: 'Early Bird', icon: 'time', color: '#10B981', description: 'First 10 viewers', earned: 76 },
    { id: 8, name: 'Night Owl', icon: 'moon', color: '#6366F1', description: 'Watched late streams', earned: 123 },
  ]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

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
          <Animated.View entering={FadeIn} style={styles.badgeIcon}>
            <Ionicons name="ribbon" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Fan Badges
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Achievement system
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
        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsCard}>
          <BlurView intensity={40} style={styles.statsBlur}>
            <View style={styles.statsContent}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{badges.length}</Text>
                <Text style={styles.statLabel}>Total Badges</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{badges.reduce((sum, b) => sum + b.earned, 0)}</Text>
                <Text style={styles.statLabel}>Times Earned</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Badges Grid */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Available Badges</Text>
        </Animated.View>

        <View style={styles.badgesGrid}>
          {badges.map((badge, index) => (
            <Animated.View key={badge.id} entering={FadeInDown.delay(450 + index * 50)} style={styles.badgeCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1506994011460-5482746d30a1?w=400&q=80' }}
                style={styles.badgeBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.badgeBlur}>
                <View style={styles.badgeContent}>
                  <View style={[styles.badgeIconCircle, { backgroundColor: `${badge.color}20` }]}>
                    <Ionicons name={badge.icon as any} size={32} color={badge.color} />
                  </View>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDescription} numberOfLines={2}>{badge.description}</Text>
                  <View style={styles.earnedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={TikTokTheme.colors.status.success} />
                    <Text style={styles.earnedText}>{badge.earned} earned</Text>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          ))}
        </View>
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
  badgeIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  statsCard: { height: 80, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 2 },
  statsBlur: { flex: 1 },
  statsContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.brand.cyan, marginBottom: 4 },
  statLabel: { fontSize: 12, color: TikTokTheme.colors.text.muted },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: TikTokTheme.spacing.base },
  badgeCard: { width: CARD_WIDTH, height: 200, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  badgeBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  badgeBlur: { flex: 1 },
  badgeContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  badgeIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  badgeName: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 6, textAlign: 'center' },
  badgeDescription: { fontSize: 11, color: TikTokTheme.colors.text.secondary, textAlign: 'center', marginBottom: 8 },
  earnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  earnedText: { fontSize: 11, fontWeight: '700', color: TikTokTheme.colors.status.success },
});