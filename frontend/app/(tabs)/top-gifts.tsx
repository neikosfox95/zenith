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

export default function TopGiftsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [gifts] = useState([
    { id: 1, name: 'Diamond', emoji: '💎', value: 10000, count: 890, color: '#00F2EA' },
    { id: 2, name: 'Crown', emoji: '👑', value: 5000, count: 560, color: '#FFD700' },
    { id: 3, name: 'Rose', emoji: '🌹', value: 2000, count: 3420, color: '#FE2C55' },
    { id: 4, name: 'Heart', emoji: '❤️', value: 1000, count: 2340, color: '#FF6B9D' },
    { id: 5, name: 'Star', emoji: '⭐', value: 500, count: 4560, color: '#FFD700' },
    { id: 6, name: 'Fire', emoji: '🔥', value: 200, count: 1890, color: '#FF6B00' },
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.diamondIcon}>
            <Text style={styles.diamondEmoji}>💎</Text>
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Top Gifts
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Most valuable gifts
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
              source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=400&q=80' }}
              style={styles.podiumBackground}
              blurRadius={4}
            />
            <BlurView intensity={60} style={styles.podiumBlur}>
              <View style={styles.podiumContent}>
                <View style={styles.podiumRow}>
                  {/* 2nd Place */}
                  <View style={styles.podiumPlace}>
                    <Text style={styles.podiumEmoji}>{gifts[1].emoji}</Text>
                    <View style={[styles.podiumRank, { backgroundColor: 'rgba(192, 192, 192, 0.3)' }]}>
                      <Text style={[styles.podiumRankText, { color: '#C0C0C0' }]}>2</Text>
                    </View>
                    <Text style={styles.podiumName}>{gifts[1].name}</Text>
                    <Text style={styles.podiumValue}>${(gifts[1].value / 100).toFixed(0)}</Text>
                  </View>

                  {/* 1st Place */}
                  <View style={[styles.podiumPlace, styles.firstPlace]}>
                    <Text style={[styles.podiumEmoji, { fontSize: 56 }]}>{gifts[0].emoji}</Text>
                    <View style={[styles.podiumRank, { backgroundColor: 'rgba(255, 215, 0, 0.3)', width: 48, height: 48 }]}>
                      <Ionicons name="trophy" size={20} color="#FFD700" />
                      <Text style={[styles.podiumRankText, { color: '#FFD700', fontSize: 20 }]}>1</Text>
                    </View>
                    <Text style={[styles.podiumName, { fontSize: 18 }]}>{gifts[0].name}</Text>
                    <Text style={[styles.podiumValue, { fontSize: 16 }]}>${(gifts[0].value / 100).toFixed(0)}</Text>
                  </View>

                  {/* 3rd Place */}
                  <View style={styles.podiumPlace}>
                    <Text style={styles.podiumEmoji}>{gifts[2].emoji}</Text>
                    <View style={[styles.podiumRank, { backgroundColor: 'rgba(205, 127, 50, 0.3)' }]}>
                      <Text style={[styles.podiumRankText, { color: '#CD7F32' }]}>3</Text>
                    </View>
                    <Text style={styles.podiumName}>{gifts[2].name}</Text>
                    <Text style={styles.podiumValue}>${(gifts[2].value / 100).toFixed(0)}</Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </View>
        </Animated.View>

        {/* Gift Grid */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>All Top Gifts</Text>
        </Animated.View>

        <View style={styles.giftsGrid}>
          {gifts.map((gift, index) => (
            <Animated.View key={gift.id} entering={FadeInDown.delay(450 + index * 50)} style={styles.giftCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1506994011460-5482746d30a1?w=400&q=80' }}
                style={styles.giftBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.giftBlur}>
                <LinearGradient
                  colors={[`${gift.color}20`, `${gift.color}05`]}
                  style={styles.giftContent}
                >
                  <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                  <Text style={styles.giftName}>{gift.name}</Text>
                  <View style={styles.giftStats}>
                    <Text style={styles.giftValue}>${(gift.value / 100).toFixed(0)}</Text>
                    <Text style={styles.giftCount}>{formatNumber(gift.count)} sent</Text>
                  </View>
                </LinearGradient>
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
  diamondIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  diamondEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  podiumSection: { marginBottom: TikTokTheme.spacing.base },
  podiumCard: { height: 220, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  podiumBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  podiumBlur: { flex: 1 },
  podiumContent: { flex: 1, justifyContent: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  podiumRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  podiumPlace: { alignItems: 'center', flex: 1 },
  firstPlace: { marginBottom: 16 },
  podiumEmoji: { fontSize: 40, marginBottom: 8 },
  podiumRank: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  podiumRankText: { fontSize: 16, fontWeight: '900' },
  podiumName: { fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  podiumValue: { fontSize: 13, color: TikTokTheme.colors.brand.cyan, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  giftsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: TikTokTheme.spacing.base },
  giftCard: { width: CARD_WIDTH, height: 180, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  giftBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  giftBlur: { flex: 1 },
  giftContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  giftEmoji: { fontSize: 48, marginBottom: 12 },
  giftName: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 8 },
  giftStats: { alignItems: 'center' },
  giftValue: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.brand.cyan, marginBottom: 4 },
  giftCount: { fontSize: 11, color: TikTokTheme.colors.text.secondary },
});