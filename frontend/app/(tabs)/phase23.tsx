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
import Constants from 'expo-constants';

export default function Phase23Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [heartRate, setHeartRate] = useState('');
  const [steps, setSteps] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [metrics, setMetrics] = useState<any>(null);
  const [consultation, setConsultation] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [workout, setWorkout] = useState<any>(null);

  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

  const logMetrics = async () => {
    if (!heartRate || !steps || !sleepHours) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/health/metrics/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          heart_rate: parseInt(heartRate),
          steps: parseInt(steps),
          sleep_hours: parseFloat(sleepHours)
        })
      });
      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
        setHeartRate('');
        setSteps('');
        setSleepHours('');
      }
    } catch (error) {
      console.error('Log metrics error:', error);
    }
    setLoading(false);
  };

  const getAIConsultation = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/health/ai-consult`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          symptoms,
          medical_history: 'none'
        })
      });
      const data = await response.json();
      if (data.success) {
        setConsultation(data.consultation);
      }
    } catch (error) {
      console.error('AI consultation error:', error);
    }
    setLoading(false);
  };

  const loadMealPlan = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/health/meal-plan`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      if (data.success) {
        setMealPlan(data.meal_plan);
      }
    } catch (error) {
      console.error('Load meal plan error:', error);
    }
  };

  const generateWorkout = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/health/workout/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          fitness_level: 'intermediate',
          goals: 'strength'
        })
      });
      const data = await response.json();
      if (data.success) {
        setWorkout(data.workout);
      }
    } catch (error) {
      console.error('Generate workout error:', error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#EF4444', '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="fitness" size={48} color="white" />
        <Text style={styles.headerTitle}>Health & Wellness AI</Text>
        <Text style={styles.headerSubtitle}>Powered by Grok 4.3 Health AI</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Health Score */}
        {metrics && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.scoreContainer}>
              <View style={[styles.scoreCircle, { borderColor: '#10B981' }]}>
                <Text style={[styles.scoreValue, { color: '#10B981' }]}>{metrics.score}</Text>
                <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>Health Score</Text>
              </View>
              <View style={styles.insightsContainer}>
                <Text style={[styles.insightsTitle, { color: theme.text }]}>Insights</Text>
                {metrics.insights?.map((insight: string, idx: number) => (
                  <View key={idx} style={styles.insightRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={[styles.insightText, { color: theme.textSecondary }]}>{insight}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Log Health Metrics */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart" size={24} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Log Health Metrics</Text>
          </View>
          
          <View style={styles.metricsInputs}>
            <View style={styles.metricInput}>
              <Ionicons name="heart-circle" size={20} color="#EF4444" />
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Heart rate (bpm)"
                placeholderTextColor={theme.textSecondary}
                value={heartRate}
                onChangeText={setHeartRate}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.metricInput}>
              <Ionicons name="walk" size={20} color="#10B981" />
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Steps"
                placeholderTextColor={theme.textSecondary}
                value={steps}
                onChangeText={setSteps}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.metricInput}>
              <Ionicons name="moon" size={20} color="#8B5CF6" />
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Sleep (hours)"
                placeholderTextColor={theme.textSecondary}
                value={sleepHours}
                onChangeText={setSleepHours}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={logMetrics}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.actionButtonText}>Log Metrics</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* AI Health Consultation */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={24} color="#3B82F6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Health Assistant</Text>
          </View>
          
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Describe your symptoms..."
            placeholderTextColor={theme.textSecondary}
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={getAIConsultation}
            disabled={loading || !symptoms.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="sparkles" size={20} color="white" />
                <Text style={styles.actionButtonText}>Get AI Consultation</Text>
              </>
            )}
          </TouchableOpacity>

          {consultation && (
            <View style={[styles.consultationResult, { backgroundColor: theme.background }]}>
              <View style={styles.consultationHeader}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={[styles.consultationTitle, { color: theme.text }]}>AI Response</Text>
              </View>
              <Text style={[styles.consultationText, { color: theme.textSecondary }]}>{consultation.ai_response}</Text>
              <View style={styles.severityBadge}>
                <Text style={[styles.severityText, { color: consultation.severity === 'low' ? '#10B981' : '#F59E0B' }]}>
                  Severity: {consultation.severity}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Meal Plan */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant" size={24} color="#F59E0B" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Meal Plan</Text>
            <TouchableOpacity onPress={loadMealPlan} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#F59E0B" />
            </TouchableOpacity>
          </View>
          
          {mealPlan ? (
            <View>
              {['breakfast', 'lunch', 'dinner'].map((meal, idx) => (
                <View key={idx} style={[styles.mealCard, { backgroundColor: theme.background }]}>
                  <Ionicons name="restaurant-outline" size={20} color="#F59E0B" />
                  <View style={styles.mealInfo}>
                    <Text style={[styles.mealName, { color: theme.text }]}>{meal.charAt(0).toUpperCase() + meal.slice(1)}</Text>
                    <Text style={[styles.mealDetails, { color: theme.textSecondary }]}>
                      {mealPlan[meal]?.name}
                    </Text>
                    <View style={styles.mealMacros}>
                      <Text style={[styles.macroText, { color: '#10B981' }]}>{mealPlan[meal]?.calories} cal</Text>
                      <Text style={[styles.macroText, { color: '#3B82F6' }]}>{mealPlan[meal]?.protein}g protein</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Tap refresh to load meal plan</Text>
          )}
        </View>

        {/* Workout Generator */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="barbell" size={24} color="#8B5CF6" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Workout Generator</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={generateWorkout}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="flash" size={20} color="white" />
                <Text style={styles.actionButtonText}>Generate Workout</Text>
              </>
            )}
          </TouchableOpacity>

          {workout && (
            <View style={[styles.workoutContainer, { backgroundColor: theme.background }]}>
              <Text style={[styles.workoutName, { color: theme.text }]}>{workout.name}</Text>
              <View style={styles.workoutMeta}>
                <View style={styles.workoutMetaItem}>
                  <Ionicons name="time" size={16} color="#8B5CF6" />
                  <Text style={[styles.workoutMetaText, { color: theme.textSecondary }]}>{workout.duration} min</Text>
                </View>
                <View style={styles.workoutMetaItem}>
                  <Ionicons name="flame" size={16} color="#EF4444" />
                  <Text style={[styles.workoutMetaText, { color: theme.textSecondary }]}>{workout.difficulty}</Text>
                </View>
              </View>
              {workout.exercises?.map((ex: any, idx: number) => (
                <View key={idx} style={styles.exerciseRow}>
                  <Text style={[styles.exerciseName, { color: theme.text }]}>{ex.name}</Text>
                  <Text style={[styles.exerciseReps, { color: theme.textSecondary }]}>{ex.sets}x{ex.reps}</Text>
                </View>
              ))}
            </View>
          )}
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
  scoreContainer: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontSize: 36, fontWeight: 'bold' },
  scoreLabel: { fontSize: 12, marginTop: 4 },
  insightsContainer: { flex: 1 },
  insightsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  insightText: { fontSize: 13, flex: 1 },
  metricsInputs: { gap: 12, marginBottom: 16 },
  metricInput: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  textArea: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16, minHeight: 100, textAlignVertical: 'top' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  consultationResult: { marginTop: 16, padding: 16, borderRadius: 12 },
  consultationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  consultationTitle: { fontSize: 15, fontWeight: '600' },
  consultationText: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  severityBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  severityText: { fontSize: 12, fontWeight: '600' },
  mealCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  mealDetails: { fontSize: 13, marginBottom: 6 },
  mealMacros: { flexDirection: 'row', gap: 12 },
  macroText: { fontSize: 12, fontWeight: '600' },
  placeholderText: { fontSize: 14, textAlign: 'center', padding: 20 },
  workoutContainer: { marginTop: 16, padding: 16, borderRadius: 12 },
  workoutName: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  workoutMeta: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  workoutMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  workoutMetaText: { fontSize: 13 },
  exerciseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  exerciseName: { fontSize: 14, fontWeight: '600' },
  exerciseReps: { fontSize: 14 },
});