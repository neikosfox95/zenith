import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';

// FIX: this screen derived the API base URL locally from
// EXPO_PUBLIC_BACKEND_URL, which is defined nowhere (app.json has no
// `extra` block and no .env sets it), so the value was undefined and
// every request went to a URL literally starting with "undefined/".
// All screens now share src/config/backend.ts.
import { BACKEND_URL as backendUrl } from '../../src/config/backend';

const { width } = Dimensions.get('window');

/**
 * FIX: `color` was inferred as `string[]`, but LinearGradient's `colors` prop
 * is `readonly [ColorValue, ColorValue, ...ColorValue[]]` — a tuple with at
 * least two entries. A plain array is not assignable to it, so every gradient
 * on this screen was a type error. `as const` makes each palette a readonly
 * tuple of literal colours, which is exactly what the prop wants.
 */
const AI_MODELS = [
  { id: 'gemini', name: 'Gemini', icon: '⚡', color: ['#4285F4', '#34A853'] as const, best: 'Speed' },
  { id: 'openai', name: 'GPT-5.2', icon: '🧠', color: ['#10a37f', '#1a7f64'] as const, best: 'Reasoning' },
  { id: 'claude', name: 'Claude', icon: '🎯', color: ['#CC785C', '#A85C4C'] as const, best: 'Analysis' },
  { id: 'grok', name: 'Grok', icon: '🚀', color: ['#1DA1F2', '#0c7abf'] as const, best: 'Real-time' },
];

/** Shape returned by POST /api/ai/analyze-sentiment (and the local error fallback). */
interface SentimentResult {
  overall?: string;
  score?: number;
  analysis?: string;
  [key: string]: unknown;
}

export default function AIScreen() {
  const { theme } = useTheme();
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  // FIX: `useState(null)` infers `null`, so the setter's type became
  // `(prevState: null) => null` and every read of `sentiment.overall` was
  // "Property does not exist on type never".
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [recommendations, setRecommendations] = useState('');

  const generateStreamSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/ai/stream-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: 'test123',
          model_provider: selectedModel,
        }),
      });
      const data = await response.json();
      setSummary(data.summary || 'No summary available');
    } catch (error) {
      setSummary('Error generating summary');
    }
    setLoading(false);
  };

  const analyzeSentiment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/ai/analyze-sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId: 'test123',
          model_provider: selectedModel,
        }),
      });
      const data = await response.json();
      setSentiment(data);
    } catch (error) {
      setSentiment({ overall: 'error', score: 0, analysis: 'Error analyzing sentiment' });
    }
    setLoading(false);
  };

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/ai/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: 'test123',
          model_provider: selectedModel,
        }),
      });
      const data = await response.json();
      setRecommendations(data.recommendations || 'No recommendations available');
    } catch (error) {
      setRecommendations('Error generating recommendations');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#FF0050', '#00f2ea']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🤖 AI Studio</Text>
        <Text style={styles.headerSubtitle}>Powered by Multi-Model AI</Text>
      </LinearGradient>

      {/* Model Selector */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Select AI Model</Text>
        <View style={styles.modelGrid}>
          {AI_MODELS.map((model) => (
            <TouchableOpacity
              key={model.id}
              onPress={() => setSelectedModel(model.id)}
              style={[
                styles.modelCard,
                selectedModel === model.id && styles.modelCardSelected,
              ]}
            >
              <LinearGradient
                colors={model.color}
                style={styles.modelGradient}
              >
                <Text style={styles.modelIcon}>{model.icon}</Text>
                <Text style={styles.modelName}>{model.name}</Text>
                <Text style={styles.modelBest}>{model.best}</Text>
                {selectedModel === model.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#fff" style={styles.checkmark} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* AI Features */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>AI Features</Text>

        {/* Stream Summary */}
        <TouchableOpacity
          style={[styles.featureButton, { backgroundColor: '#FF0050' }]}
          onPress={generateStreamSummary}
          disabled={loading}
        >
          <Ionicons name="document-text" size={24} color="#fff" />
          <Text style={styles.featureButtonText}>Generate Stream Summary</Text>
          {loading && <ActivityIndicator color="#fff" />}
        </TouchableOpacity>

        {summary ? (
          <View style={[styles.resultCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.resultTitle, { color: theme.text }]}>📝 Summary</Text>
            <Text style={[styles.resultText, { color: theme.textSecondary }]}>{summary}</Text>
          </View>
        ) : null}

        {/* Sentiment Analysis */}
        <TouchableOpacity
          style={[styles.featureButton, { backgroundColor: '#00f2ea' }]}
          onPress={analyzeSentiment}
          disabled={loading}
        >
          <Ionicons name="happy" size={24} color="#fff" />
          <Text style={styles.featureButtonText}>Analyze Sentiment</Text>
          {loading && <ActivityIndicator color="#fff" />}
        </TouchableOpacity>

        {sentiment && (
          <View style={[styles.resultCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.resultTitle, { color: theme.text }]}>
              😊 Sentiment: {sentiment.overall}
            </Text>
            <Text style={[styles.resultText, { color: theme.textSecondary }]}>
              Score: {sentiment.score} | {sentiment.analysis}
            </Text>
          </View>
        )}

        {/* Content Recommendations */}
        <TouchableOpacity
          style={[styles.featureButton, { backgroundColor: '#10a37f' }]}
          onPress={getRecommendations}
          disabled={loading}
        >
          <Ionicons name="bulb" size={24} color="#fff" />
          <Text style={styles.featureButtonText}>Get Content Ideas</Text>
          {loading && <ActivityIndicator color="#fff" />}
        </TouchableOpacity>

        {recommendations ? (
          <View style={[styles.resultCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.resultTitle, { color: theme.text }]}>💡 Recommendations</Text>
            <Text style={[styles.resultText, { color: theme.textSecondary }]}>{recommendations}</Text>
          </View>
        ) : null}
      </View>

      {/* Model Info */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>About AI Models</Text>
        <View style={styles.infoCard}>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            ⚡ <Text style={{ fontWeight: 'bold' }}>Gemini:</Text> Best for speed and efficiency
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            🧠 <Text style={{ fontWeight: 'bold' }}>GPT-5.2:</Text> Superior reasoning and creativity
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            🎯 <Text style={{ fontWeight: 'bold' }}>Claude:</Text> Deep analysis and long context
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            🚀 <Text style={{ fontWeight: 'bold' }}>Grok:</Text> Real-time data and web search
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 32,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modelCard: {
    width: (width - 64) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modelCardSelected: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  modelGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  modelIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  modelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  modelBest: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    gap: 12,
  },
  featureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 22,
  },
  infoCard: {
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
