import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function ROIScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const [roiMetrics] = useState({
    totalInvestment: 12000,
    totalReturn: 45600,
    roi: 280,
    period: '90 days'
  });

  const [investments] = useState([
    { id: 1, category: 'Equipment', amount: 4500, return: 18900, roi: 320, icon: 'videocam', color: TikTokTheme.colors.brand.cyan },
    { id: 2, category: 'Marketing', amount: 3200, return: 12800, roi: 300, icon: 'megaphone', color: '#FE2C55' },
    { id: 3, category: 'Software', amount: 2800, return: 8960, roi: 220, icon: 'laptop', color: '#10B981' },
    { id: 4, category: 'Training', amount: 1500, return: 4950, roi: 230, icon: 'school', color: '#FFD700' },
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
          source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.roiIcon}>
            <Ionicons name="stats-chart" size={36} color="#10B981" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            ROI Analysis
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {roiMetrics.roi}% return
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
        {/* Summary Card */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.summaryCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=400&q=80' }}
            style={styles.summaryBackground}
            blurRadius={4}
          />
          <BlurView intensity={50} style={styles.summaryBlur}>
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
              style={styles.summaryContent}
            >
              <Text style={styles.summaryTitle}>Overall ROI</Text>
              <Text style={styles.summaryROI}>{roiMetrics.roi}%</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Invested</Text>
                  <Text style={styles.summaryValue}>${(roiMetrics.totalInvestment / 100).toFixed(0)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Returned</Text>
                  <Text style={styles.summaryValue}>${(roiMetrics.totalReturn / 100).toFixed(0)}</Text>
                </View>
              </View>
              <Text style={styles.summaryPeriod}>Last {roiMetrics.period}</Text>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Investment Breakdown */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Investment Breakdown</Text>
        </Animated.View>

        {investments.map((investment, index) => (
          <Animated.View key={investment.id} entering={FadeInDown.delay(450 + index * 50)} style={styles.investmentCard}>
            <BlurView intensity={40} style={styles.investmentBlur}>
              <LinearGradient
                colors={[`${investment.color}10`, `${investment.color}03`]}
                style={styles.investmentContent}
              >
                <View style={[styles.investmentIcon, { backgroundColor: `${investment.color}20` }]}>
                  <Ionicons name={investment.icon as any} size={24} color={investment.color} />
                </View>
                <View style={styles.investmentInfo}>
                  <Text style={styles.investmentCategory}>{investment.category}</Text>
                  <View style={styles.investmentRow}>
                    <Text style={styles.investmentAmount}>${(investment.amount / 100).toFixed(0)}</Text>
                    <Ionicons name="arrow-forward" size={16} color={TikTokTheme.colors.text.muted} />
                    <Text style={[styles.investmentReturn, { color: investment.color }]}>${(investment.return / 100).toFixed(0)}</Text>
                  </View>
                </View>
                <View style={[styles.roiBadge, { backgroundColor: `${investment.color}20`, borderColor: investment.color }]}>
                  <Text style={[styles.roiText, { color: investment.color }]}>{investment.roi}%</Text>
                </View>
              </LinearGradient>
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
  roiIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(16, 185, 129, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#10B981' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#10B981' },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  summaryCard: { height: 200, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 6 },
  summaryBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  summaryBlur: { flex: 1 },
  summaryContent: { flex: 1, padding: TikTokTheme.spacing.base, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  summaryROI: { fontSize: 48, fontWeight: '900', color: '#10B981', textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '900', color: TikTokTheme.colors.text.primary },
  summaryDivider: { width: 1, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  summaryPeriod: { fontSize: 12, color: TikTokTheme.colors.text.secondary, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  investmentCard: { height: 90, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  investmentBlur: { flex: 1 },
  investmentContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  investmentIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  investmentInfo: { flex: 1 },
  investmentCategory: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 8 },
  investmentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  investmentAmount: { fontSize: 14, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  investmentReturn: { fontSize: 16, fontWeight: '900' },
  roiBadge: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  roiText: { fontSize: 14, fontWeight: '900' },
});