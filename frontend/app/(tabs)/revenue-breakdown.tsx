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

export default function RevenueBreakdownScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [breakdown] = useState([
    { source: 'Gifts', amount: 245000, percentage: 72.5, icon: 'gift', color: '#FFD700' },
    { source: 'Battles', amount: 56000, percentage: 16.6, icon: 'trophy', color: TikTokTheme.colors.brand.pink },
    { source: 'Subscriptions', amount: 28000, percentage: 8.3, icon: 'card', color: TikTokTheme.colors.brand.cyan },
    { source: 'Tips', amount: 8900, percentage: 2.6, icon: 'cash', color: '#10B981' },
  ]);

  const totalRevenue = breakdown.reduce((sum, item) => sum + item.amount, 0);

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
          source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.moneyIcon}>
            <Ionicons name="cash" size={36} color="#10B981" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Revenue Breakdown
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Income source analysis
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
        {/* Total Revenue Card */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.totalCard}>
          <BlurView intensity={50} style={styles.totalBlur}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
              style={styles.totalContent}
            >
              <Text style={styles.totalLabel}>Total Revenue</Text>
              <Text style={styles.totalValue}>${(totalRevenue / 100).toFixed(2)}</Text>
              <View style={styles.totalBadge}>
                <Ionicons name="trending-up" size={16} color="#10B981" />
                <Text style={styles.totalBadgeText}>+15.3% this month</Text>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Breakdown List */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Revenue Sources</Text>
        </Animated.View>

        {breakdown.map((item, index) => (
          <Animated.View key={item.source} entering={FadeInDown.delay(450 + index * 50)} style={styles.sourceCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
              style={styles.sourceBackground}
              blurRadius={5}
            />
            <BlurView intensity={50} style={styles.sourceBlur}>
              <View style={styles.sourceContent}>
                <View style={[styles.sourceIcon, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon as any} size={28} color={item.color} />
                </View>
                <View style={styles.sourceInfo}>
                  <Text style={styles.sourceName}>{item.source}</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <LinearGradient
                        colors={[item.color, `${item.color}80`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${item.percentage}%` }]}
                      />
                    </View>
                    <Text style={styles.progressPercentage}>{item.percentage.toFixed(1)}%</Text>
                  </View>
                </View>
                <View style={styles.sourceAmount}>
                  <Text style={styles.sourceValue}>${(item.amount / 100).toFixed(0)}</Text>
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
  heroContainer: { height: 160, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  moneyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#10B981' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  totalCard: { height: 140, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  totalBlur: { flex: 1 },
  totalContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  totalLabel: { fontSize: 14, color: TikTokTheme.colors.text.secondary, marginBottom: 8 },
  totalValue: { fontSize: 40, fontWeight: '900', color: '#10B981', marginBottom: 12 },
  totalBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  totalBadgeText: { fontSize: 13, fontWeight: '700', color: '#10B981' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  sourceCard: { height: 100, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  sourceBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  sourceBlur: { flex: 1 },
  sourceContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', gap: 12 },
  sourceIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  sourceInfo: { flex: 1 },
  sourceName: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 8 },
  progressBarContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%' },
  progressPercentage: { fontSize: 12, fontWeight: '700', color: TikTokTheme.colors.text.secondary, width: 45 },
  sourceAmount: { alignItems: 'flex-end' },
  sourceValue: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.brand.cyan },
});