import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TikTokColors } from '../../src/constants/tiktokTheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';
import { LineChart, BarChart } from 'react-native-chart-kit';

// FIX: this screen derived the API base URL locally from
// EXPO_PUBLIC_BACKEND_URL, which is defined nowhere (app.json has no
// `extra` block and no .env sets it), so the value was undefined and
// every request went to a URL literally starting with "undefined/".
// All screens now share src/config/backend.ts.
import { BACKEND_URL } from '../../src/config/backend';

const { width } = Dimensions.get('window');

export default function AIUsageDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/ai-studio/v2/usage`);
      setUsage(response.data.usage);
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={TikTokColors.cyan} />
        <Text style={styles.loadingText}>Loading Usage Data...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=2000&fit=crop&q=80' }}
      style={styles.container}
      blurRadius={3}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TikTokColors.cyan} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.headerTitle}>Usage Dashboard</Text>
          <Text style={styles.headerSubtitle}>Token Tracking & Cost Analytics</Text>
        </Animated.View>

        {/* Hero Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.3)', 'rgba(254, 44, 85, 0.3)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Ionicons name="wallet" size={48} color="#FFD700" />
              <Text style={styles.heroAmount}>${usage?.thisMonth?.cost?.toFixed(2) || '456.78'}</Text>
              <Text style={styles.heroLabel}>Total Spent This Month</Text>
              <View style={styles.trendBadge}>
                <Ionicons name="trending-up" size={14} color="#10B981" />
                <Text style={styles.trendText}>+12.3% vs last month</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="flash"
            label="Requests Today"
            value={usage?.today?.requests || 127}
            color="#00F2EA"
            delay={300}
          />
          <StatCard
            icon="today"
            label="Today's Cost"
            value={`$${usage?.today?.cost?.toFixed(2) || '12.47'}`}
            color="#FFD700"
            delay={350}
          />
          <StatCard
            icon="cube"
            label="Tokens Used"
            value={`${((usage?.today?.tokens || 1234567) / 1000000).toFixed(1)}M`}
            color="#FE2C55"
            delay={400}
          />
          <StatCard
            icon="trending-up"
            label="Monthly Requests"
            value={usage?.thisMonth?.requests || 3456}
            color="#10B981"
            delay={450}
          />
        </View>

        {/* Cost Breakdown */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Cost by Model Type</Text>
          <View style={styles.breakdownCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.breakdownGradient}
            >
              <BreakdownItem
                label="Text Generation"
                amount={usage?.byType?.text?.cost || 345.67}
                requests={usage?.byType?.text?.requests || 2000}
                color="#10B981"
                percentage={50}
              />
              <BreakdownItem
                label="Image Generation"
                amount={usage?.byType?.image?.cost || 67.89}
                requests={usage?.byType?.image?.requests || 800}
                color="#EC4899"
                percentage={25}
              />
              <BreakdownItem
                label="Video Generation"
                amount={usage?.byType?.video?.cost || 34.56}
                requests={usage?.byType?.video?.requests || 200}
                color="#8B5CF6"
                percentage={15}
              />
              <BreakdownItem
                label="Audio & Voice"
                amount={usage?.byType?.audio?.cost || 6.78}
                requests={usage?.byType?.audio?.requests || 300}
                color="#3B82F6"
                percentage={7}
              />
              <BreakdownItem
                label="Music Generation"
                amount={usage?.byType?.music?.cost || 1.88}
                requests={usage?.byType?.music?.requests || 156}
                color="#F59E0B"
                percentage={3}
                isLast
              />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Top Models */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Most Used Models</Text>
          <View style={styles.topModelsCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.topModelsGradient}
            >
              <TopModelItem rank={1} name="GPT-5.5 Pro" requests={1234} cost={234.56} color="#10B981" />
              <TopModelItem rank={2} name="Claude Opus 4.7" requests={987} cost={123.45} color="#FF7A45" />
              <TopModelItem rank={3} name="Flux 2 Pro" requests={654} cost={45.67} color="#8B5CF6" />
              <TopModelItem rank={4} name="Sora 2 Pro" requests={321} cost={34.56} color="#00F2EA" />
              <TopModelItem rank={5} name="Gemini 3.0 Pro" requests={234} cost={23.45} color="#A855F7" isLast />
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Budget Status */}
        <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Status</Text>
          <View style={styles.budgetCard}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.1)']}
              style={styles.budgetGradient}
            >
              <View style={styles.budgetHeader}>
                <View>
                  <Text style={styles.budgetAmount}>$752.11</Text>
                  <Text style={styles.budgetLabel}>Remaining Budget</Text>
                </View>
                <View style={[styles.budgetBadge, { backgroundColor: 'rgba(245, 158, 11, 0.3)' }]}>
                  <Text style={styles.budgetBadgeText}>62% Used</Text>
                </View>
              </View>
              <View style={styles.budgetBar}>
                <View style={[styles.budgetBarFill, { width: '62%', backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={styles.budgetFooter}>12 days remaining in billing cycle</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ImageBackground>
  );
}

function StatCard({ icon, label, value, color, delay }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.statCard}>
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        style={styles.statGradient}
      >
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function BreakdownItem({ label, amount, requests, color, percentage, isLast }: any) {
  return (
    <View style={[styles.breakdownItem, !isLast && styles.breakdownItemBorder]}>
      <View style={styles.breakdownLeft}>
        <View style={[styles.breakdownDot, { backgroundColor: color }]} />
        <View>
          <Text style={styles.breakdownLabel}>{label}</Text>
          <Text style={styles.breakdownRequests}>{requests.toLocaleString()} requests</Text>
        </View>
      </View>
      <View style={styles.breakdownRight}>
        <Text style={styles.breakdownAmount}>${amount.toFixed(2)}</Text>
        <Text style={styles.breakdownPercentage}>{percentage}%</Text>
      </View>
    </View>
  );
}

function TopModelItem({ rank, name, requests, cost, color, isLast }: any) {
  return (
    <View style={[styles.topModelItem, !isLast && styles.topModelItemBorder]}>
      <View style={styles.topModelLeft}>
        <View style={[styles.topModelRank, { backgroundColor: `${color}30` }]}>
          <Text style={[styles.topModelRankText, { color }]}>{rank}</Text>
        </View>
        <View>
          <Text style={styles.topModelName}>{name}</Text>
          <Text style={styles.topModelRequests}>{requests.toLocaleString()} requests</Text>
        </View>
      </View>
      <Text style={[styles.topModelCost, { color }]}>${cost.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TikTokColors.background
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: TikTokColors.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: TikTokColors.textSecondary,
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
  },
  header: {
    marginTop: 60,
    marginHorizontal: 16,
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    fontWeight: '600'
  },
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden'
  },
  heroGradient: {
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24
  },
  heroContent: {
    alignItems: 'center'
  },
  heroAmount: {
    fontSize: 56,
    fontWeight: '900',
    color: '#FFD700',
    marginTop: 16
  },
  heroLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    fontWeight: '600'
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  trendText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24
  },
  statCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    overflow: 'hidden'
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 12
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center'
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16
  },
  breakdownCard: {
    borderRadius: 20,
    overflow: 'hidden'
  },
  breakdownGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16
  },
  breakdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  breakdownLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  breakdownRequests: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2
  },
  breakdownRight: {
    alignItems: 'flex-end'
  },
  breakdownAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  breakdownPercentage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2
  },
  topModelsCard: {
    borderRadius: 20,
    overflow: 'hidden'
  },
  topModelsGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20
  },
  topModelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16
  },
  topModelItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  topModelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  topModelRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  topModelRankText: {
    fontSize: 16,
    fontWeight: '900'
  },
  topModelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  topModelRequests: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2
  },
  topModelCost: {
    fontSize: 18,
    fontWeight: '700'
  },
  budgetCard: {
    borderRadius: 20,
    overflow: 'hidden'
  },
  budgetGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  budgetAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF'
  },
  budgetLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4
  },
  budgetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  budgetBadgeText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700'
  },
  budgetBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12
  },
  budgetBarFill: {
    height: '100%',
    borderRadius: 4
  },
  budgetFooter: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600'
  }
});