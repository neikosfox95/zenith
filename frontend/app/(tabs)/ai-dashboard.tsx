import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

const { width } = Dimensions.get('window');

export default function AIDashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const [aiStats] = useState({
    activeModels: 12,
    totalRequests: 45600,
    avgResponseTime: 1.2,
    accuracy: 97.8,
  });

  const [activeModels] = useState([
    { id: 1, name: 'GPT-5.2 Pro', provider: 'OpenAI', status: 'active', usage: 85, color: '#10B981' },
    { id: 2, name: 'Gemini 3.0 Flash', provider: 'Google', status: 'active', usage: 72, color: '#00F2EA' },
    { id: 3, name: 'Claude 4.5 Opus', provider: 'Anthropic', status: 'active', usage: 68, color: '#FE2C55' },
    { id: 4, name: 'Grok 4 Premium', provider: 'xAI', status: 'standby', usage: 12, color: '#FFD700' },
  ]);

  const [recentInsights] = useState([
    { id: 1, type: 'optimization', title: 'Peak Time Detected', desc: 'Friday 8PM shows 35% higher engagement', icon: 'trending-up', color: '#10B981' },
    { id: 2, type: 'alert', title: 'Content Suggestion', desc: 'Gaming content performs 2x better', icon: 'bulb', color: '#FFD700' },
    { id: 3, type: 'prediction', title: 'Revenue Forecast', desc: 'Next month: $4.2K expected revenue', icon: 'analytics', color: TikTokTheme.colors.brand.cyan },
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
          source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.aiIcon}>
            <Ionicons name="sparkles" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            AI Command Center
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {aiStats.activeModels} models active
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
        {/* AI Stats Grid */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsGrid}>
          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="cube" size={24} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.statValue}>{aiStats.activeModels}</Text>
                <Text style={styles.statLabel}>Active Models</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="flash" size={24} color="#10B981" />
                <Text style={styles.statValue}>{formatNumber(aiStats.totalRequests)}</Text>
                <Text style={styles.statLabel}>Total Requests</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(254, 44, 85, 0.15)', 'rgba(254, 44, 85, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="time" size={24} color={TikTokTheme.colors.brand.pink} />
                <Text style={styles.statValue}>{aiStats.avgResponseTime}s</Text>
                <Text style={styles.statLabel}>Avg Response</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
                <Text style={styles.statValue}>{aiStats.accuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Active Models */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Active AI Models</Text>
        </Animated.View>

        {activeModels.map((model, index) => (
          <Animated.View key={model.id} entering={FadeInDown.delay(450 + index * 50)}>
            <TouchableOpacity 
              style={styles.modelCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
                style={styles.modelBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.modelBlur}>
                <View style={styles.modelContent}>
                  <View style={[styles.statusDot, { backgroundColor: model.status === 'active' ? '#10B981' : '#F59E0B' }]} />
                  
                  <View style={styles.modelInfo}>
                    <Text style={styles.modelName}>{model.name}</Text>
                    <Text style={styles.modelProvider}>{model.provider}</Text>
                    <View style={styles.usageBar}>
                      <View style={styles.usageBarBg}>
                        <LinearGradient
                          colors={[model.color, `${model.color}80`]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.usageBarFill, { width: `${model.usage}%` }]}
                        />
                      </View>
                      <Text style={styles.usageText}>{model.usage}%</Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: `${model.status === 'active' ? '#10B981' : '#F59E0B'}20` }]}>
                    <Text style={[styles.statusText, { color: model.status === 'active' ? '#10B981' : '#F59E0B' }]}>
                      {model.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Recent Insights */}
        <Animated.View entering={FadeInDown.delay(650)}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
        </Animated.View>

        {recentInsights.map((insight, index) => (
          <Animated.View key={insight.id} entering={FadeInDown.delay(700 + index * 50)} style={styles.insightCard}>
            <BlurView intensity={40} style={styles.insightBlur}>
              <View style={styles.insightContent}>
                <View style={[styles.insightIcon, { backgroundColor: `${insight.color}20` }]}>
                  <Ionicons name={insight.icon as any} size={24} color={insight.color} />
                </View>
                <View style={styles.insightText}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDesc}>{insight.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={TikTokTheme.colors.text.muted} />
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
  aiIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: TikTokTheme.spacing.base },
  statCard: { width: '48%', height: 110, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  statBlur: { flex: 1 },
  statContent: { flex: 1, padding: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statValue: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 8 },
  statLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  modelCard: { height: 100, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  modelBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  modelBlur: { flex: 1 },
  modelContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  modelInfo: { flex: 1 },
  modelName: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  modelProvider: { fontSize: 12, color: TikTokTheme.colors.text.secondary, marginBottom: 8 },
  usageBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  usageBarBg: { flex: 1, height: 6, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, overflow: 'hidden' },
  usageBarFill: { height: '100%' },
  usageText: { fontSize: 11, fontWeight: '700', color: TikTokTheme.colors.text.secondary, width: 35 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '900' },
  insightCard: { height: 80, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  insightBlur: { flex: 1 },
  insightContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  insightIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  insightText: { flex: 1 },
  insightTitle: { fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  insightDesc: { fontSize: 12, color: TikTokTheme.colors.text.secondary, lineHeight: 16 },
});