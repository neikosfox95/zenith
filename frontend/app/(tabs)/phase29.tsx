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

export default function Phase29Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [athleteId, setAthleteId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [performance, setPerformance] = useState<any>(null);
  const [gameAnalysis, setGameAnalysis] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [injuryAssessment, setInjuryAssessment] = useState<any>(null);

  const logPerformance = async () => {
    if (!athleteId.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/sports/performance/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          athlete_id: athleteId,
          metrics: {
            speed: 28.5,
            endurance: 85,
            strength: 92
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setPerformance(data.performance);
        setAthleteId('');
      }
    } catch (error) {
      console.error('Log performance error:', error);
    }
    setLoading(false);
  };

  const analyzeGame = async () => {
    if (!videoUrl.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/sports/game/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          video_url: videoUrl,
          sport: 'soccer'
        })
      });
      const data = await response.json();
      if (data.success) {
        setGameAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Analyze game error:', error);
    }
    setLoading(false);
  };

  const loadRoster = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/sports/team/roster`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      if (data.success) {
        setRoster(data.roster);
      }
    } catch (error) {
      console.error('Load roster error:', error);
    }
  };

  const assessInjuryRisk = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/sports/injury/assess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          athlete_id: 'athlete_123',
          biomechanics: {}
        })
      });
      const data = await response.json();
      if (data.success) {
        setInjuryAssessment(data.assessment);
      }
    } catch (error) {
      console.error('Assess injury error:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#EF4444', '#DC2626']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="football" size={48} color="white" />
        <Text style={styles.headerTitle}>Sports & Fitness Analytics</Text>
        <Text style={styles.headerSubtitle}>Professional sports AI</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Performance Tracking */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={24} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance Tracking</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Athlete ID..."
            placeholderTextColor={theme.textSecondary}
            value={athleteId}
            onChangeText={setAthleteId}
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={logPerformance}
            disabled={loading || !athleteId.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>Log Performance</Text>
              </>
            )}
          </TouchableOpacity>

          {performance && (
            <View style={[styles.performanceBox, { backgroundColor: theme.background }]}>
              <Text style={[styles.performanceScore, { color: '#EF4444' }]}>Score: {performance.score}</Text>
              <Text style={[styles.performanceImprovement, { color: '#10B981' }]}>{performance.improvement} improvement</Text>
            </View>
          )}
        </View>

        {/* Game Analysis */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="videocam" size={24} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Game Analysis</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Game video URL..."
            placeholderTextColor={theme.textSecondary}
            value={videoUrl}
            onChangeText={setVideoUrl}
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={analyzeGame}
            disabled={loading || !videoUrl.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="play-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>Analyze Game</Text>
              </>
            )}
          </TouchableOpacity>

          {gameAnalysis && (
            <View style={[styles.analysisBox, { backgroundColor: theme.background }]}>
              <Text style={[styles.analysisTitle, { color: theme.text }]}>Highlights</Text>
              {gameAnalysis.highlights?.map((highlight: string, idx: number) => (
                <Text key={idx} style={[styles.highlightText, { color: theme.textSecondary }]}>• {highlight}</Text>
              ))}

              <Text style={[styles.analysisTitle, { color: theme.text, marginTop: 16 }]}>Statistics</Text>
              {Object.entries(gameAnalysis.statistics || {}).map(([key, value]: [string, any], idx) => (
                <View key={idx} style={styles.statRow}>
                  <Text style={[styles.statKey, { color: theme.textSecondary }]}>{key}:</Text>
                  <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
                </View>
              ))}

              <Text style={[styles.analysisTitle, { color: theme.text, marginTop: 16 }]}>Insights</Text>
              {gameAnalysis.insights?.map((insight: string, idx: number) => (
                <Text key={idx} style={[styles.insightText, { color: '#10B981' }]}>✓ {insight}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Team Roster */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Team Roster</Text>
            <TouchableOpacity onPress={loadRoster} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
          
          {roster.length > 0 ? (
            roster.map((player, idx) => (
              <View key={idx} style={[styles.playerCard, { backgroundColor: theme.background }]}>
                <View style={[styles.playerNumber, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.playerNumberText}>{player.number}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={[styles.playerName, { color: theme.text }]}>{player.name}</Text>
                  <Text style={[styles.playerPosition, { color: theme.textSecondary }]}>{player.position}</Text>
                </View>
                <View style={styles.playerStats}>
                  <View style={styles.statBadge}>
                    <Ionicons name="football" size={12} color="#EF4444" />
                    <Text style={[styles.statBadgeText, { color: theme.textSecondary }]}>{player.stats.goals}</Text>
                  </View>
                  <View style={styles.statBadge}>
                    <Ionicons name="hand-right" size={12} color="#3B82F6" />
                    <Text style={[styles.statBadgeText, { color: theme.textSecondary }]}>{player.stats.assists}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Tap refresh to load roster</Text>
          )}
        </View>

        {/* Injury Risk Assessment */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medkit" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Injury Risk Assessment</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
            onPress={assessInjuryRisk}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="analytics" size={20} color="white" />
                <Text style={styles.actionButtonText}>Assess Risk</Text>
              </>
            )}
          </TouchableOpacity>

          {injuryAssessment && (
            <View style={[styles.riskBox, { backgroundColor: theme.background }]}>
              <View style={[styles.riskLevel, { backgroundColor: injuryAssessment.risk_level === 'high' ? '#EF4444' : injuryAssessment.risk_level === 'medium' ? '#F59E0B' : '#10B981' }]}>
                <Text style={styles.riskLevelText}>{injuryAssessment.risk_level} risk</Text>
              </View>

              <Text style={[styles.analysisTitle, { color: theme.text, marginTop: 16 }]}>Risk Areas</Text>
              {injuryAssessment.risk_areas?.map((area: any, idx: number) => (
                <View key={idx} style={[styles.riskAreaCard, { backgroundColor: theme.card }]}>
                  <Text style={[styles.riskAreaName, { color: theme.text }]}>{area.area}</Text>
                  <View style={styles.riskMeter}>
                    <View style={[styles.riskFill, { width: `${area.risk}%`, backgroundColor: area.risk > 70 ? '#EF4444' : '#F59E0B' }]} />
                  </View>
                  <Text style={[styles.riskRec, { color: theme.textSecondary }]}>{area.recommendation}</Text>
                </View>
              ))}

              <Text style={[styles.analysisTitle, { color: theme.text, marginTop: 16 }]}>Prevention Plan</Text>
              {injuryAssessment.prevention_plan?.map((plan: string, idx: number) => (
                <Text key={idx} style={[styles.planText, { color: theme.textSecondary }]}>{idx + 1}. {plan}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Nutrition Plan */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="nutrition" size={24} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Athlete Nutrition</Text>
          </View>
          
          <View style={[styles.nutritionCard, { backgroundColor: theme.background }]}>
            <Text style={[styles.nutritionTitle, { color: theme.text }]}>Daily Targets</Text>
            <View style={styles.macrosGrid}>
              {[
                { label: 'Calories', value: '3500', color: '#EF4444' },
                { label: 'Protein', value: '175g', color: '#10B981' },
                { label: 'Carbs', value: '525g', color: '#3B82F6' },
                { label: 'Fats', value: '97g', color: '#F59E0B' },
              ].map((macro, idx) => (
                <View key={idx} style={[styles.macroBox, { backgroundColor: theme.card }]}>
                  <Text style={[styles.macroValue, { color: macro.color }]}>{macro.value}</Text>
                  <Text style={[styles.macroLabel, { color: theme.textSecondary }]}>{macro.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
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
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  performanceBox: { marginTop: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  performanceScore: { fontSize: 32, fontWeight: '700', marginBottom: 8 },
  performanceImprovement: { fontSize: 16, fontWeight: '600' },
  analysisBox: { marginTop: 16, padding: 16, borderRadius: 12 },
  analysisTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  highlightText: { fontSize: 13, marginBottom: 6, paddingLeft: 8 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statKey: { fontSize: 14, textTransform: 'capitalize' },
  statValue: { fontSize: 14, fontWeight: '600' },
  insightText: { fontSize: 13, marginBottom: 6, paddingLeft: 8 },
  playerCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  playerNumber: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  playerNumberText: { color: 'white', fontSize: 16, fontWeight: '700' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  playerPosition: { fontSize: 12 },
  playerStats: { flexDirection: 'row', gap: 12 },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statBadgeText: { fontSize: 12, fontWeight: '600' },
  placeholderText: { fontSize: 14, textAlign: 'center', padding: 20 },
  riskBox: { marginTop: 16, padding: 16, borderRadius: 12 },
  riskLevel: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  riskLevelText: { color: 'white', fontSize: 14, fontWeight: '700', textTransform: 'uppercase' },
  riskAreaCard: { padding: 12, borderRadius: 12, marginBottom: 12 },
  riskAreaName: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  riskMeter: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  riskFill: { height: '100%', borderRadius: 4 },
  riskRec: { fontSize: 12 },
  planText: { fontSize: 13, marginBottom: 6 },
  nutritionCard: { padding: 16, borderRadius: 12 },
  nutritionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  macrosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  macroBox: { flex: 1, minWidth: '45%', padding: 12, borderRadius: 12, alignItems: 'center' },
  macroValue: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  macroLabel: { fontSize: 11 },
});