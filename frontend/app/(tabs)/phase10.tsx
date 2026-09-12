import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { TikTokColors } from '../../src/constants/tiktokTheme';

// FIX: this screen derived the API base URL locally from
// EXPO_PUBLIC_BACKEND_URL, which is defined nowhere (app.json has no
// `extra` block and no .env sets it), so the value was undefined and
// every request went to a URL literally starting with "undefined/".
// All screens now share src/config/backend.ts.
import { BACKEND_URL as backendUrl } from '../../src/config/backend';

const { width } = Dimensions.get('window');

// ------------------------------------------------------------
// Payload types for the Phase 10 prediction endpoints.
//
// FIX: these five states were declared `useState(null)`, which infers `null`
// and turns the setter into `(prevState: null) => null`. Nothing could be
// stored in a type-checked way and every `viralPrediction.viral_score` read
// reported "Property does not exist on type never" — so the whole screen's
// rendering was unverifiable by the compiler.
// ------------------------------------------------------------
interface ViralPrediction {
  viral_score?: number;
  predicted_views?: number;
  predicted_engagement?: number;
  confidence?: number;
  recommendations?: string[];
  [key: string]: unknown;
}

interface GrowthForecast {
  current_followers?: number;
  predicted_followers?: number;
  growth_rate?: number;
  factors?: string[];
  [key: string]: unknown;
}

/** Revenue figures arrive as `{ monthly, yearly }` objects. */
interface Money {
  monthly?: number;
  yearly?: number;
  [key: string]: unknown;
}

interface RevenueInsights {
  current_revenue?: Money | number;
  potential_revenue?: Money | number;
  optimization_opportunities?: string[];
  [key: string]: unknown;
}

/**
 * Every prediction field is optional because the API may return a partial
 * payload. Without a default these rendered as `NaN`, `Infinity` or threw on
 * `undefined.toFixed()`.
 */
const monthlyOf = (value?: Money | number): number => {
  if (typeof value === 'number') return value;
  return Number(value?.monthly ?? 0);
};

interface SentimentSnapshot {
  overall?: string;
  score?: number;
  positive?: number;
  negative?: number;
  neutral?: number;
  [key: string]: unknown;
}

interface CompetitorSnapshot {
  competitors?: unknown[];
  [key: string]: unknown;
}

export default function Phase10AnalyticsScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viralPrediction, setViralPrediction] = useState<ViralPrediction | null>(null);
  const [growthForecast, setGrowthForecast] = useState<GrowthForecast | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentSnapshot | null>(null);
  const [competitorData, setCompetitorData] = useState<CompetitorSnapshot | null>(null);
  const [revenueInsights, setRevenueInsights] = useState<RevenueInsights | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch viral prediction
      const viralRes = await fetch(`${backendUrl}/api/analytics/predict-viral`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          content_type: 'video',
          description: 'Amazing TikTok content',
          hashtags: ['fyp', 'viral', 'trending'],
          posting_time: new Date().toISOString()
        })
      });
      const viralData = await viralRes.json();
      setViralPrediction(viralData);

      // Fetch growth forecast
      const growthRes = await fetch(`${backendUrl}/api/analytics/growth-forecast?creator_id=test&days=30`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const growthData = await growthRes.json();
      setGrowthForecast(growthData);

      // Fetch revenue insights
      const revenueRes = await fetch(`${backendUrl}/api/analytics/revenue-insights?creator_id=test`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const revenueData = await revenueRes.json();
      setRevenueInsights(revenueData);

    } catch (error) {
      console.error('Analytics fetch error:', error);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const renderStatCard = (icon: string, title: string, value: string, subtitle: string, color: string) => (
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon as any} size={28} color={color} />
        <Text style={[styles.statTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TikTokColors.pink} />}
    >
      {/* Header */}
      <LinearGradient
        colors={[TikTokColors.pink, TikTokColors.cyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Advanced Analytics</Text>
        <Text style={styles.headerSubtitle}>AI-Powered Business Intelligence</Text>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TikTokColors.pink} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading analytics...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Viral Prediction */}
          {viralPrediction && (
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={24} color={TikTokColors.pink} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Viral Potential</Text>
              </View>
              <View style={styles.viralScore}>
                <Text style={[styles.viralScoreValue, { color: TikTokColors.pink }]}>
                  {Math.round(viralPrediction.viral_score ?? 0)}/100
                </Text>
                <Text style={[styles.viralScoreLabel, { color: theme.textSecondary }]}>Viral Score</Text>
              </View>
              <View style={styles.predictionGrid}>
                <View style={styles.predictionItem}>
                  <Text style={[styles.predictionValue, { color: theme.text }]}>
                    {((viralPrediction.predicted_views ?? 0) / 1000).toFixed(1)}K
                  </Text>
                  <Text style={[styles.predictionLabel, { color: theme.textSecondary }]}>Predicted Views</Text>
                </View>
                <View style={styles.predictionItem}>
                  <Text style={[styles.predictionValue, { color: theme.text }]}>
                    {((viralPrediction.predicted_engagement ?? 0) / 1000).toFixed(1)}K
                  </Text>
                  <Text style={[styles.predictionLabel, { color: theme.textSecondary }]}>Engagement</Text>
                </View>
                <View style={styles.predictionItem}>
                  <Text style={[styles.predictionValue, { color: theme.text }]}>
                    {Math.round((viralPrediction.confidence ?? 0) * 100)}%
                  </Text>
                  <Text style={[styles.predictionLabel, { color: theme.textSecondary }]}>Confidence</Text>
                </View>
              </View>
              <View style={styles.recommendations}>
                <Text style={[styles.recommendationsTitle, { color: theme.text }]}>AI Recommendations:</Text>
                {viralPrediction.recommendations?.slice(0, 3).map((rec: string, idx: number) => (
                  <View key={idx} style={styles.recommendationItem}>
                    <Ionicons name="checkmark-circle" size={16} color={TikTokColors.cyan} />
                    <Text style={[styles.recommendationText, { color: theme.textSecondary }]}>{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Growth Forecast */}
          {growthForecast && (
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="stats-chart" size={24} color={TikTokColors.cyan} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Growth Forecast (30 Days)</Text>
              </View>
              <View style={styles.statsRow}>
                {renderStatCard(
                  'people',
                  'Current',
                  `${((growthForecast.current_followers ?? 0) / 1000).toFixed(1)}K`,
                  'Followers',
                  TikTokColors.pink
                )}
                {renderStatCard(
                  'arrow-up',
                  'Predicted',
                  `${((growthForecast.predicted_followers ?? 0) / 1000).toFixed(1)}K`,
                  `+${Math.round((growthForecast.growth_rate ?? 0) * 100)}% Growth`,
                  TikTokColors.cyan
                )}
              </View>
              <View style={styles.factorsContainer}>
                <Text style={[styles.factorsTitle, { color: theme.text }]}>Growth Factors:</Text>
                {Object.entries(growthForecast.factors || {}).map(([key, value], idx) => (
                  <View key={idx} style={styles.factorItem}>
                    <Text style={[styles.factorKey, { color: theme.textSecondary }]}>
                      {key.replace(/_/g, ' ')}:
                    </Text>
                    <Text style={[styles.factorValue, { color: TikTokColors.pink }]}>
                      {value as string}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Revenue Insights */}
          {revenueInsights && (
            <View style={[styles.section, { backgroundColor: theme.card }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cash" size={24} color="#10B981" />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Revenue Optimization</Text>
              </View>
              <View style={styles.revenueGrid}>
                <View style={styles.revenueItem}>
                  <Text style={[styles.revenueLabel, { color: theme.textSecondary }]}>Current Monthly</Text>
                  <Text style={[styles.revenueValue, { color: theme.text }]}>
                    ${monthlyOf(revenueInsights.current_revenue).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.revenueItem}>
                  <Text style={[styles.revenueLabel, { color: theme.textSecondary }]}>Potential Monthly</Text>
                  <Text style={[styles.revenueValue, { color: '#10B981' }]}>
                    ${monthlyOf(revenueInsights.potential_revenue).toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.opportunitiesContainer}>
                <Text style={[styles.opportunitiesTitle, { color: theme.text }]}>Top Opportunities:</Text>
                {revenueInsights.optimization_opportunities?.slice(0, 2).map((opp: any, idx: number) => (
                  <TouchableOpacity key={idx} style={[styles.opportunityCard, { backgroundColor: theme.background }]}>
                    <View style={styles.opportunityHeader}>
                      <Text style={[styles.opportunityCategory, { color: theme.text }]}>{opp.category}</Text>
                      <Text style={[styles.opportunityPotential, { color: '#10B981' }]}>
                        +${opp.potential}
                      </Text>
                    </View>
                    <Text style={[styles.opportunityDifficulty, { color: theme.textSecondary }]}>
                      {opp.difficulty} difficulty • {opp.timeline}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: TikTokColors.pink }]}
              onPress={fetchAnalytics}
            >
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.actionButtonText}>Refresh Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  content: {
    padding: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  viralScore: {
    alignItems: 'center',
    marginBottom: 24,
  },
  viralScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  viralScoreLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  predictionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  predictionItem: {
    alignItems: 'center',
  },
  predictionValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  predictionLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  recommendations: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
  },
  factorsContainer: {
    marginTop: 16,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  factorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  factorKey: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  factorValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  revenueGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  revenueItem: {
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  opportunitiesContainer: {
    marginTop: 16,
  },
  opportunitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  opportunityCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  opportunityCategory: {
    fontSize: 14,
    fontWeight: '600',
  },
  opportunityPotential: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  opportunityDifficulty: {
    fontSize: 12,
  },
  actionsSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});