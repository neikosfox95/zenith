import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';

export default function TrendsScreen() {
  const trendData = [
    { x: 'Mon', y: 12 },
    { x: 'Tue', y: 18 },
    { x: 'Wed', y: 15 },
    { x: 'Thu', y: 22 },
    { x: 'Fri', y: 28 },
    { x: 'Sat', y: 35 },
    { x: 'Sun', y: 30 },
  ];

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
          <Animated.View entering={FadeIn} style={styles.trendIcon}>
            <Ionicons name="trending-up" size={36} color="#10B981" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Growth Trends
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            +28% this week
          </Animated.Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(300)} style={styles.chartCard}>
          <BlurView intensity={40} style={styles.chartBlur}>
            <Text style={styles.chartTitle}>Weekly Revenue Trend</Text>
            <VictoryChart theme={VictoryTheme.material} height={200}>
              <VictoryLine
                data={trendData}
                style={{
                  data: { stroke: '#10B981', strokeWidth: 3 }
                }}
              />
            </VictoryChart>
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Key Insights</Text>
        </Animated.View>

        {[
          { icon: 'trending-up', text: 'Revenue up 28% this week', color: '#10B981' },
          { icon: 'people', text: 'Audience growing 15% monthly', color: TikTokTheme.colors.brand.cyan },
          { icon: 'gift', text: 'Gifts increased 40% weekend', color: '#FE2C55' },
        ].map((insight, index) => (
          <Animated.View key={index} entering={FadeInDown.delay(450 + index * 50)} style={styles.insightCard}>
            <BlurView intensity={30} style={styles.insightBlur}>
              <View style={styles.insightContent}>
                <View style={[styles.insightIcon, { backgroundColor: `${insight.color}20` }]}>
                  <Ionicons name={insight.icon as any} size={24} color={insight.color} />
                </View>
                <Text style={styles.insightText}>{insight.text}</Text>
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
  trendIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#10B981' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#10B981' },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  chartCard: { height: 280, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  chartBlur: { flex: 1, padding: TikTokTheme.spacing.base },
  chartTitle: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  insightCard: { height: 70, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  insightBlur: { flex: 1 },
  insightContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  insightIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  insightText: { flex: 1, fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.primary },
});