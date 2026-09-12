import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
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

export default function Phase30Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [carbonData, setCarbonData] = useState<any>(null);
  const [sustainabilityScore, setSustainabilityScore] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [environmentalData, setEnvironmentalData] = useState<any>(null);

  const calculateCarbon = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/environment/carbon/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          activities: {
            transportation: 100,
            energy: 200,
            food: 50
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setCarbonData(data.footprint);
      }
    } catch (error) {
      console.error('Calculate carbon error:', error);
    }
    setLoading(false);
  };

  const scoreSustainability = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/environment/sustainability/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          company_data: {}
        })
      });
      const data = await response.json();
      if (data.success) {
        setSustainabilityScore(data.score);
      }
    } catch (error) {
      console.error('Score sustainability error:', error);
    }
    setLoading(false);
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/environment/recommendations`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Load recommendations error:', error);
    }
  };

  const loadEnvironmentalData = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/environment/data/NYC`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      if (data.success) {
        setEnvironmentalData(data.data);
      }
    } catch (error) {
      console.error('Load environmental data error:', error);
    }
  };

  React.useEffect(() => {
    loadRecommendations();
    loadEnvironmentalData();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="leaf" size={48} color="white" />
        <Text style={styles.headerTitle}>Environmental & Sustainability</Text>
        <Text style={styles.headerSubtitle}>Green AI platform</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Carbon Footprint Calculator */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Carbon Footprint</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={calculateCarbon}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="calculator" size={20} color="white" />
                <Text style={styles.actionButtonText}>Calculate Footprint</Text>
              </>
            )}
          </TouchableOpacity>

          {carbonData && (
            <View style={[styles.carbonBox, { backgroundColor: theme.background }]}>
              <View style={styles.carbonHeader}>
                <Text style={[styles.carbonValue, { color: '#EF4444' }]}>{carbonData.total_co2}</Text>
                <Text style={[styles.carbonUnit, { color: theme.textSecondary }]}>{carbonData.unit}</Text>
              </View>

              <Text style={[styles.comparisonText, { color: theme.textSecondary }]}>Comparison: {carbonData.comparison}</Text>

              <Text style={[styles.analysisTitle, { color: theme.text, marginTop: 16 }]}>Breakdown</Text>
              {Object.entries(carbonData.breakdown || {}).map(([key, value]: [string, any], idx) => (
                <View key={idx} style={styles.breakdownRow}>
                  <View style={styles.breakdownInfo}>
                    <Ionicons name={key === 'transportation' ? 'car' : key === 'energy' ? 'flash' : 'restaurant'} size={16} color="#10B981" />
                    <Text style={[styles.breakdownLabel, { color: theme.textSecondary }]}>{key}</Text>
                  </View>
                  <Text style={[styles.breakdownValue, { color: theme.text }]}>{value} tons</Text>
                </View>
              ))}

              <View style={[styles.reductionBox, { backgroundColor: '#10B981' + '20' }]}>
                <Ionicons name="trending-down" size={20} color="#10B981" />
                <Text style={[styles.reductionText, { color: '#10B981' }]}>Potential reduction: {carbonData.reduction_potential} tons/year</Text>
              </View>
            </View>
          )}
        </View>

        {/* Sustainability Score */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={24} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Sustainability Score</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={scoreSustainability}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="stats-chart" size={20} color="white" />
                <Text style={styles.actionButtonText}>Calculate Score</Text>
              </>
            )}
          </TouchableOpacity>

          {sustainabilityScore && (
            <View style={[styles.scoreBox, { backgroundColor: theme.background }]}>
              <View style={styles.scoreCircle}>
                <Text style={[styles.scoreValue, { color: sustainabilityScore.overall >= 80 ? '#10B981' : sustainabilityScore.overall >= 60 ? '#F59E0B' : '#EF4444' }]}>{sustainabilityScore.overall}</Text>
                <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Overall Score</Text>
              </View>

              <View style={[styles.ratingBadge, { backgroundColor: '#10B981' + '20' }]}>
                <Text style={[styles.ratingText, { color: '#10B981' }]}>Rating: {sustainabilityScore.rating}</Text>
              </View>

              <Text style={[styles.analysisTitle, { color: theme.text, marginTop: 16 }]}>Category Scores</Text>
              {Object.entries(sustainabilityScore.categories || {}).map(([key, value]: [string, any], idx) => (
                <View key={idx} style={styles.categoryRow}>
                  <Text style={[styles.categoryName, { color: theme.textSecondary }]}>{key}</Text>
                  <View style={styles.categoryBar}>
                    <View style={[styles.categoryFill, { width: `${value}%`, backgroundColor: value >= 80 ? '#10B981' : value >= 60 ? '#F59E0B' : '#EF4444' }]} />
                  </View>
                  <Text style={[styles.categoryValue, { color: theme.text }]}>{value}</Text>
                </View>
              ))}

              <Text style={[styles.analysisTitle, { color: theme.text, marginTop: 16 }]}>Improvement Areas</Text>
              {sustainabilityScore.improvements?.map((improvement: string, idx: number) => (
                <Text key={idx} style={[styles.improvementText, { color: theme.textSecondary }]}>{idx + 1}. {improvement}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Green Recommendations */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Green Recommendations</Text>
            <TouchableOpacity onPress={loadRecommendations} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#F59E0B" />
            </TouchableOpacity>
          </View>
          
          {recommendations.map((rec, idx) => (
            <View key={idx} style={[styles.recCard, { backgroundColor: theme.background }]}>
              <View style={[styles.impactBadge, { backgroundColor: rec.impact === 'high' ? '#10B981' + '20' : '#F59E0B' + '20' }]}>
                <Ionicons name="leaf" size={16} color={rec.impact === 'high' ? '#10B981' : '#F59E0B'} />
                <Text style={[styles.impactText, { color: rec.impact === 'high' ? '#10B981' : '#F59E0B' }]}>{rec.impact} impact</Text>
              </View>
              <Text style={[styles.recTitle, { color: theme.text }]}>{rec.title}</Text>
              <Text style={[styles.recSavings, { color: '#10B981' }]}>Savings: {rec.savings}</Text>
            </View>
          ))}
        </View>

        {/* Environmental Data */}
        {environmentalData && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cloud" size={24} color="#06B6D4" />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Environmental Data</Text>
              <TouchableOpacity onPress={loadEnvironmentalData} style={styles.refreshButton}>
                <Ionicons name="refresh" size={20} color="#06B6D4" />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.locationText, { color: theme.textSecondary, marginBottom: 16 }]}>Location: {environmentalData.location}</Text>

            <View style={[styles.dataCard, { backgroundColor: theme.background }]}>
              <Text style={[styles.dataTitle, { color: theme.text }]}>Air Quality</Text>
              <View style={styles.aqiRow}>
                <Text style={[styles.aqiValue, { color: '#10B981' }]}>{environmentalData.air_quality.aqi}</Text>
                <Text style={[styles.aqiLevel, { color: '#10B981' }]}>{environmentalData.air_quality.level}</Text>
              </View>
              <View style={styles.pollutants}>
                {Object.entries(environmentalData.air_quality.pollutants || {}).map(([key, value]: [string, any], idx) => (
                  <Text key={idx} style={[styles.pollutantText, { color: theme.textSecondary }]}>{key.toUpperCase()}: {value}</Text>
                ))}
              </View>
            </View>

            <View style={[styles.dataCard, { backgroundColor: theme.background }]}>
              <Text style={[styles.dataTitle, { color: theme.text }]}>Weather</Text>
              <Text style={[styles.tempText, { color: theme.text }]}>{environmentalData.weather.temperature}°C</Text>
              <Text style={[styles.conditionsText, { color: theme.textSecondary }]}>{environmentalData.weather.conditions} • {environmentalData.weather.humidity}% humidity</Text>
            </View>

            <View style={[styles.dataCard, { backgroundColor: theme.background }]}>
              <Text style={[styles.dataTitle, { color: theme.text }]}>Climate Trends</Text>
              <View style={styles.trendRow}>
                <Ionicons name="trending-up" size={16} color="#EF4444" />
                <Text style={[styles.trendText, { color: theme.textSecondary }]}>Avg temp change: {environmentalData.climate_data.avg_temp_change}</Text>
              </View>
              <View style={styles.trendRow}>
                <Ionicons name="water" size={16} color="#3B82F6" />
                <Text style={[styles.trendText, { color: theme.textSecondary }]}>Rainfall change: {environmentalData.climate_data.rainfall_change}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 60, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 12 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  content: { padding: 16 },
  section: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  refreshButton: { padding: 4 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  carbonBox: { marginTop: 16, padding: 16, borderRadius: 12 },
  carbonHeader: { alignItems: 'center', marginBottom: 8 },
  carbonValue: { fontSize: 48, fontWeight: '700' },
  carbonUnit: { fontSize: 14, marginTop: 4 },
  comparisonText: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  analysisTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  breakdownInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownLabel: { fontSize: 14, textTransform: 'capitalize' },
  breakdownValue: { fontSize: 14, fontWeight: '600' },
  reductionBox: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginTop: 16, gap: 8 },
  reductionText: { fontSize: 13, fontWeight: '600' },
  scoreBox: { marginTop: 16, padding: 16, borderRadius: 12 },
  scoreCircle: { alignSelf: 'center', alignItems: 'center', marginBottom: 16 },
  scoreValue: { fontSize: 56, fontWeight: '700' },
  scoreLabel: { fontSize: 13, marginTop: 4 },
  ratingBadge: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 12, marginBottom: 16 },
  ratingText: { fontSize: 14, fontWeight: '700' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  categoryName: { fontSize: 13, width: 80, textTransform: 'capitalize' },
  categoryBar: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' },
  categoryFill: { height: '100%', borderRadius: 4 },
  categoryValue: { fontSize: 13, fontWeight: '600', width: 40, textAlign: 'right' },
  improvementText: { fontSize: 13, marginBottom: 6 },
  recCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  impactBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 12, gap: 6 },
  impactText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  recTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  recSavings: { fontSize: 13, fontWeight: '600' },
  locationText: { fontSize: 13 },
  dataCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  dataTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  aqiRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  aqiValue: { fontSize: 36, fontWeight: '700' },
  aqiLevel: { fontSize: 18, fontWeight: '600' },
  pollutants: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pollutantText: { fontSize: 12 },
  tempText: { fontSize: 36, fontWeight: '700', marginBottom: 8 },
  conditionsText: { fontSize: 14 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  trendText: { fontSize: 13 },
});