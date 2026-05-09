import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function AIInsightsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'content', 'audience', 'monetization', 'growth'];

  const [insights] = useState([
    {
      id: 1,
      category: 'content',
      priority: 'high',
      title: 'Optimal Content Length',
      description: 'Streams between 90-120 minutes show 45% higher retention rates',
      impact: '+45% retention',
      confidence: 94,
      icon: 'videocam',
      color: '#10B981',
      aiModel: 'GPT-5.2 Pro'
    },
    {
      id: 2,
      category: 'audience',
      priority: 'high',
      title: 'Peak Engagement Window',
      description: 'Your audience is most active Friday-Sunday, 7-10 PM',
      impact: '+35% viewers',
      confidence: 91,
      icon: 'time',
      color: TikTokTheme.colors.brand.cyan,
      aiModel: 'Gemini 3.0 Flash'
    },
    {
      id: 3,
      category: 'monetization',
      priority: 'medium',
      title: 'Gift Timing Strategy',
      description: 'Viewers send 2x more gifts during interactive segments',
      impact: '+120% gifts',
      confidence: 88,
      icon: 'gift',
      color: '#FE2C55',
      aiModel: 'Claude 4.5 Opus'
    },
    {
      id: 4,
      category: 'growth',
      priority: 'medium',
      title: 'Collaboration Opportunity',
      description: 'Similar creators in your niche show 3x growth with collabs',
      impact: '+200% growth',
      confidence: 82,
      icon: 'people',
      color: '#FFD700',
      aiModel: 'GPT-5.2 Pro'
    },
    {
      id: 5,
      category: 'content',
      priority: 'low',
      title: 'Thumbnail Optimization',
      description: 'Bright colors and faces increase click-through by 28%',
      impact: '+28% CTR',
      confidence: 85,
      icon: 'image',
      color: '#A855F7',
      aiModel: 'Gemini 3.0 Flash'
    },
  ]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return '#FE2C55';
    if (priority === 'medium') return '#F59E0B';
    return TikTokTheme.colors.text.muted;
  };

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(i => i.category === selectedCategory);

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
          <Animated.View entering={FadeIn} style={styles.lightbulbIcon}>
            <Ionicons name="bulb" size={36} color="#FFD700" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            AI Insights
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {filteredInsights.length} actionable insights
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
        {/* Category Filter */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive
                ]}
                onPress={() => {
                  setSelectedCategory(cat);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive
                ]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Insights List */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Insights</Text>
        </Animated.View>

        {filteredInsights.map((insight, index) => (
          <Animated.View key={insight.id} entering={FadeInDown.delay(450 + index * 50)}>
            <TouchableOpacity 
              style={styles.insightCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=400&q=80' }}
                style={styles.insightBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.insightBlur}>
                <View style={styles.insightContent}>
                  {/* Priority Badge */}
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(insight.priority) }]} />

                  {/* Icon */}
                  <View style={[styles.insightIcon, { backgroundColor: `${insight.color}20` }]}>
                    <Ionicons name={insight.icon as any} size={28} color={insight.color} />
                  </View>

                  {/* Content */}
                  <View style={styles.insightInfo}>
                    <View style={styles.insightHeader}>
                      <Text style={styles.insightTitle}>{insight.title}</Text>
                      <View style={[styles.impactBadge, { backgroundColor: `${insight.color}20` }]}>
                        <Text style={[styles.impactText, { color: insight.color }]}>{insight.impact}</Text>
                      </View>
                    </View>
                    <Text style={styles.insightDesc}>{insight.description}</Text>
                    <View style={styles.insightFooter}>
                      <View style={styles.confidenceBadge}>
                        <Ionicons name="analytics" size={12} color={TikTokTheme.colors.brand.cyan} />
                        <Text style={styles.confidenceText}>{insight.confidence}% confidence</Text>
                      </View>
                      <Text style={styles.aiModelText}>{insight.aiModel}</Text>
                    </View>
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
  lightbulbIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255, 215, 0, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#FFD700' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  categoriesScroll: { gap: 8, paddingBottom: 16 },
  categoryChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  categoryChipActive: { backgroundColor: 'rgba(0, 242, 234, 0.2)', borderColor: TikTokTheme.colors.brand.cyan },
  categoryText: { fontSize: 13, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  categoryTextActive: { color: TikTokTheme.colors.brand.cyan, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  insightCard: { borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  insightBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  insightBlur: { flex: 1 },
  insightContent: { padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', position: 'relative' },
  priorityDot: { position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: 5 },
  insightIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  insightInfo: { flex: 1 },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  insightTitle: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, flex: 1, marginRight: 8 },
  impactBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  impactText: { fontSize: 11, fontWeight: '900' },
  insightDesc: { fontSize: 13, color: TikTokTheme.colors.text.secondary, lineHeight: 18, marginBottom: 12 },
  insightFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confidenceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  confidenceText: { fontSize: 11, color: TikTokTheme.colors.brand.cyan, fontWeight: '600' },
  aiModelText: { fontSize: 10, color: TikTokTheme.colors.text.muted, fontStyle: 'italic' },
});