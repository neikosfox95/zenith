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

export default function BestTimesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations] = useState([
    {
      id: 1,
      day: 'Friday',
      time: '8:00 PM',
      score: 95,
      expectedViewers: 2400,
      avgRevenue: 34000,
      engagement: 'Very High',
      color: '#10B981'
    },
    {
      id: 2,
      day: 'Saturday',
      time: '7:00 PM',
      score: 92,
      expectedViewers: 2200,
      avgRevenue: 31000,
      engagement: 'Very High',
      color: '#00F2EA'
    },
    {
      id: 3,
      day: 'Wednesday',
      time: '3:00 PM',
      score: 87,
      expectedViewers: 1800,
      avgRevenue: 25000,
      engagement: 'High',
      color: '#FFD700'
    },
    {
      id: 4,
      day: 'Sunday',
      time: '6:00 PM',
      score: 84,
      expectedViewers: 1600,
      avgRevenue: 22000,
      engagement: 'High',
      color: '#FE2C55'
    },
    {
      id: 5,
      day: 'Monday',
      time: '7:30 PM',
      score: 78,
      expectedViewers: 1400,
      avgRevenue: 18000,
      engagement: 'Medium',
      color: '#A855F7'
    },
  ]);

  const [insights] = useState([
    { icon: 'trending-up', text: 'Peak engagement on Friday evenings', color: '#10B981' },
    { icon: 'people', text: 'Weekends attract 35% more viewers', color: TikTokTheme.colors.brand.cyan },
    { icon: 'time', text: 'Avoid streaming before 2 PM on weekdays', color: '#F59E0B' },
    { icon: 'sunny', text: 'Afternoon slots work best for tutorials', color: '#FFD700' },
  ]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatNumber = (num: number) => {
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
          <Animated.View entering={FadeIn} style={styles.aiIcon}>
            <Ionicons name="analytics" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Best Times to Stream
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            AI-powered recommendations
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
        {/* AI Badge */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.aiBadgeCard}>
          <BlurView intensity={40} style={styles.aiBadgeBlur}>
            <LinearGradient
              colors={['rgba(0, 242, 234, 0.2)', 'rgba(168, 85, 247, 0.1)']}
              style={styles.aiBadgeContent}
            >
              <Ionicons name="sparkles" size={24} color={TikTokTheme.colors.brand.cyan} />
              <View style={styles.aiTextContainer}>
                <Text style={styles.aiBadgeTitle}>AI Analysis Active</Text>
                <Text style={styles.aiBadgeText}>Based on your last 30 streams and audience patterns</Text>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Top Recommendations */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Recommended Time Slots</Text>
        </Animated.View>

        {recommendations.map((rec, index) => (
          <Animated.View key={rec.id} entering={FadeInDown.delay(450 + index * 50)} style={styles.recCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=400&q=80' }}
              style={styles.recBackground}
              blurRadius={5}
            />
            <BlurView intensity={50} style={styles.recBlur}>
              <View style={styles.recContent}>
                {/* Score Badge */}
                <View style={[styles.scoreBadge, { backgroundColor: `${rec.color}20`, borderColor: rec.color }]}>
                  <Text style={[styles.scoreText, { color: rec.color }]}>{rec.score}</Text>
                </View>

                {/* Time Info */}
                <View style={styles.timeInfo}>
                  <View style={styles.timeHeader}>
                    <Text style={styles.dayText}>{rec.day}</Text>
                    <View style={[styles.engagementBadge, { backgroundColor: `${rec.color}15` }]}>
                      <Text style={[styles.engagementText, { color: rec.color }]}>{rec.engagement}</Text>
                    </View>
                  </View>
                  <Text style={styles.timeText}>{rec.time}</Text>
                  
                  <View style={styles.metricsRow}>
                    <View style={styles.metric}>
                      <Ionicons name="eye-outline" size={14} color={TikTokTheme.colors.brand.cyan} />
                      <Text style={styles.metricValue}>{formatNumber(rec.expectedViewers)}</Text>
                    </View>
                    <View style={styles.metric}>
                      <Ionicons name="cash-outline" size={14} color="#10B981" />
                      <Text style={styles.metricValue}>${(rec.avgRevenue / 100).toFixed(0)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        ))}

        {/* Insights */}
        <Animated.View entering={FadeInDown.delay(700)}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
        </Animated.View>

        {insights.map((insight, index) => (
          <Animated.View key={index} entering={FadeInDown.delay(750 + index * 50)} style={styles.insightCard}>
            <BlurView intensity={30} style={styles.insightBlur}>
              <View style={styles.insightContent}>
                <View style={[styles.insightIcon, { backgroundColor: `${insight.color}20` }]}>
                  <Ionicons name={insight.icon as any} size={20} color={insight.color} />
                </View>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            </BlurView>
          </Animated.View>
        ))}

        {/* Footer Note */}
        <Animated.View entering={FadeInDown.delay(900)} style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={16} color={TikTokTheme.colors.text.muted} />
          <Text style={styles.footerText}>Recommendations update daily based on your performance</Text>
        </Animated.View>
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
  aiIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  aiBadgeCard: { height: 80, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 2 },
  aiBadgeBlur: { flex: 1 },
  aiBadgeContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.3)' },
  aiTextContainer: { flex: 1 },
  aiBadgeTitle: { fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.brand.cyan, marginBottom: 4 },
  aiBadgeText: { fontSize: 12, color: TikTokTheme.colors.text.secondary, lineHeight: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  recCard: { height: 120, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  recBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  recBlur: { flex: 1 },
  recContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  scoreBadge: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  scoreText: { fontSize: 20, fontWeight: '900' },
  timeInfo: { flex: 1 },
  timeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  dayText: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  engagementBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  engagementText: { fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 20, fontWeight: '900', color: TikTokTheme.colors.brand.cyan, marginBottom: 12 },
  metricsRow: { flexDirection: 'row', gap: 20 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metricValue: { fontSize: 13, fontWeight: '700', color: TikTokTheme.colors.text.secondary },
  insightCard: { height: 60, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 8, elevation: 2 },
  insightBlur: { flex: 1 },
  insightContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  insightIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  insightText: { flex: 1, fontSize: 14, color: TikTokTheme.colors.text.primary, fontWeight: '600' },
  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingHorizontal: 24 },
  footerText: { fontSize: 12, color: TikTokTheme.colors.text.muted, textAlign: 'center', flex: 1 },
});