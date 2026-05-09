import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function ForecastsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const [forecasts] = useState([
    {
      id: 1,
      metric: 'Revenue',
      current: 4560,
      predicted: 5890,
      change: 29.2,
      confidence: 94,
      icon: 'cash',
      color: '#10B981'
    },
    {
      id: 2,
      metric: 'Viewers',
      current: 3200,
      predicted: 4100,
      change: 28.1,
      confidence: 91,
      icon: 'people',
      color: TikTokTheme.colors.brand.cyan
    },
    {
      id: 3,
      metric: 'Engagement',
      current: 8.7,
      predicted: 10.2,
      change: 17.2,
      confidence: 88,
      icon: 'heart',
      color: '#FE2C55'
    },
    {
      id: 4,
      metric: 'Followers',
      current: 145000,
      predicted: 168000,
      change: 15.9,
      confidence: 85,
      icon: 'person-add',
      color: '#FFD700'
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
          <Animated.View entering={FadeIn} style={styles.crystalIcon}>
            <Ionicons name="analytics" size={36} color="#A855F7" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            AI Forecasts
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Next 30 days predictions
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
        <Animated.View entering={FadeInDown.delay(300)} style={styles.aiBadge}>
          <BlurView intensity={40} style={styles.aiBadgeBlur}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.2)', 'rgba(168, 85, 247, 0.05)']}
              style={styles.aiBadgeContent}
            >
              <Ionicons name="sparkles" size={20} color="#A855F7" />
              <Text style={styles.aiBadgeText}>Powered by GPT-5.2 Pro Predictive Engine</Text>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Key Predictions</Text>
        </Animated.View>

        {forecasts.map((forecast, index) => (
          <Animated.View key={forecast.id} entering={FadeInDown.delay(450 + index * 50)}>
            <TouchableOpacity 
              style={styles.forecastCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
                style={styles.forecastBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.forecastBlur}>
                <LinearGradient
                  colors={[`${forecast.color}15`, `${forecast.color}05`]}
                  style={styles.forecastContent}
                >
                  <View style={[styles.forecastIcon, { backgroundColor: `${forecast.color}20` }]}>
                    <Ionicons name={forecast.icon as any} size={28} color={forecast.color} />
                  </View>

                  <View style={styles.forecastInfo}>
                    <Text style={styles.forecastMetric}>{forecast.metric}</Text>
                    <View style={styles.forecastValues}>
                      <View style={styles.valueItem}>
                        <Text style={styles.valueLabel}>Current</Text>
                        <Text style={styles.valueCurrent}>{formatNumber(forecast.current)}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={20} color={TikTokTheme.colors.text.muted} />
                      <View style={styles.valueItem}>
                        <Text style={styles.valueLabel}>Predicted</Text>
                        <Text style={[styles.valuePredicted, { color: forecast.color }]}>{formatNumber(forecast.predicted)}</Text>
                      </View>
                    </View>
                    <View style={styles.forecastFooter}>
                      <View style={[styles.changeBadge, { backgroundColor: `${forecast.color}20` }]}>
                        <Ionicons name="trending-up" size={12} color={forecast.color} />
                        <Text style={[styles.changeText, { color: forecast.color }]}>+{forecast.change}%</Text>
                      </View>
                      <View style={styles.confidenceBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                        <Text style={styles.confidenceText}>{forecast.confidence}% confidence</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
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
  crystalIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(168, 85, 247, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#A855F7' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  aiBadge: { height: 60, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 2 },
  aiBadgeBlur: { flex: 1 },
  aiBadgeContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)' },
  aiBadgeText: { fontSize: 13, fontWeight: '700', color: '#A855F7' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  forecastCard: { borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  forecastBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  forecastBlur: { flex: 1 },
  forecastContent: { flexDirection: 'row', padding: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  forecastIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  forecastInfo: { flex: 1 },
  forecastMetric: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  forecastValues: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  valueItem: { alignItems: 'center' },
  valueLabel: { fontSize: 10, color: TikTokTheme.colors.text.muted, marginBottom: 4 },
  valueCurrent: { fontSize: 18, fontWeight: '900', color: TikTokTheme.colors.text.primary },
  valuePredicted: { fontSize: 18, fontWeight: '900' },
  forecastFooter: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  changeText: { fontSize: 12, fontWeight: '900' },
  confidenceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  confidenceText: { fontSize: 11, color: '#10B981', fontWeight: '600' },
});