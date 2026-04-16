import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

// Category tabs for media types
const MEDIA_CATEGORIES = [
  { id: 'image', name: 'Image', icon: 'image', color: ['#FF6B6B', '#FF8E53'] },
  { id: 'audio', name: 'Audio', icon: 'musical-notes', color: ['#4ECDC4', '#44A08D'] },
  { id: 'video', name: 'Video', icon: 'videocam', color: ['#667EEA', '#764BA2'] },
];

// Image generation models
const IMAGE_MODELS = [
  { id: 'nano-banana-2', name: 'Nano Banana 2', provider: 'Google', speed: '1-3s' },
  { id: 'nano-banana-pro', name: 'Nano Banana Pro', provider: 'Google', speed: 'Slower' },
  { id: 'gpt-image-1.5', name: 'GPT Image 1.5', provider: 'OpenAI', speed: '4x faster' },
  { id: 'gpt-image-1-mini', name: 'GPT Image Mini', provider: 'OpenAI', speed: 'Fastest' },
  { id: 'grok-imagine-speed', name: 'Grok Speed', provider: 'xAI', speed: 'Very Fast' },
];

// Audio models
const AUDIO_MODELS = [
  { id: 'whisper', name: 'Whisper', provider: 'OpenAI', features: 'Transcription' },
  { id: 'fish-audio-instant', name: 'Fish Audio Instant', provider: 'Fish', features: 'Voice Clone' },
  { id: 'voicebox-2.0', name: 'VoiceBox 2.0', provider: 'Meta', features: '50+ Languages' },
];

// Video models
const VIDEO_MODELS = [
  { id: 'veo-3.1-fast', name: 'Veo 3.1 Fast', provider: 'Google', duration: '8s' },
  { id: 'veo-3.1', name: 'Veo 3.1', provider: 'Google', duration: '8s (4K)' },
  { id: 'sora-2-pro', name: 'Sora 2 Pro', provider: 'OpenAI', duration: '60s' },
  { id: 'grok-imagine-video-speed', name: 'Grok Video', provider: 'xAI', duration: '15s' },
];

export default function MediaScreen() {
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('image');
  const [selectedModel, setSelectedModel] = useState('nano-banana-2');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

  // Get models based on active category
  const getModels = () => {
    if (activeCategory === 'image') return IMAGE_MODELS;
    if (activeCategory === 'audio') return AUDIO_MODELS;
    return VIDEO_MODELS;
  };

  // Generate media based on category
  const generateMedia = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let endpoint = '';
      let body = {};

      if (activeCategory === 'image') {
        endpoint = '/api/media/image/generate';
        body = { prompt, model: selectedModel, size: '1024x1024' };
      } else if (activeCategory === 'audio') {
        endpoint = '/api/media/audio/transcribe';
        body = { audio_file: prompt, model: selectedModel };
      } else if (activeCategory === 'video') {
        endpoint = '/api/media/video/generate';
        body = { prompt, model: selectedModel, duration: 8 };
      }

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dummy-token',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to generate media' });
    }

    setLoading(false);
  };

  const currentModels = getModels();
  const currentCategory = MEDIA_CATEGORIES.find((c) => c.id === activeCategory);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={currentCategory?.color || ['#667EEA', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🎨 Media AI Studio</Text>
        <Text style={styles.headerSubtitle}>
          Generate images, audio, and video with 50+ AI models
        </Text>
      </LinearGradient>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        {MEDIA_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              activeCategory === category.id && {
                backgroundColor: theme.primary + '20',
                borderColor: theme.primary,
              },
            ]}
            onPress={() => {
              setActiveCategory(category.id);
              setSelectedModel(
                category.id === 'image'
                  ? 'nano-banana-2'
                  : category.id === 'audio'
                  ? 'whisper'
                  : 'veo-3.1-fast'
              );
              setResult(null);
            }}
          >
            <Ionicons
              name={category.icon as any}
              size={24}
              color={activeCategory === category.id ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                styles.categoryText,
                {
                  color:
                    activeCategory === category.id ? theme.primary : theme.textSecondary,
                },
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Model Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Select {activeCategory === 'image' ? 'Image' : activeCategory === 'audio' ? 'Audio' : 'Video'} Model
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {currentModels.map((model) => (
            <TouchableOpacity
              key={model.id}
              style={[
                styles.modelCard,
                {
                  backgroundColor: theme.surface,
                  borderColor:
                    selectedModel === model.id ? theme.primary : 'transparent',
                  borderWidth: selectedModel === model.id ? 2 : 0,
                },
              ]}
              onPress={() => setSelectedModel(model.id)}
            >
              {selectedModel === model.id && (
                <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
              <Text style={[styles.modelName, { color: theme.text }]}>
                {model.name}
              </Text>
              <Text style={[styles.modelProvider, { color: theme.textSecondary }]}>
                {model.provider}
              </Text>
              <Text style={[styles.modelSpeed, { color: theme.primary }]}>
                {activeCategory === 'image' || activeCategory === 'video'
                  ? model.speed || model.duration
                  : model.features}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Prompt Input */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {activeCategory === 'audio' ? 'Audio File / Text' : 'Describe what you want'}
        </Text>
        <TextInput
          style={[
            styles.promptInput,
            { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
          ]}
          placeholder={
            activeCategory === 'image'
              ? 'e.g., A futuristic city at sunset...'
              : activeCategory === 'audio'
              ? 'Audio file path or text to transcribe'
              : 'e.g., A drone flying over mountains...'
          }
          placeholderTextColor={theme.textSecondary}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateButton, { opacity: loading ? 0.6 : 1 }]}
        onPress={generateMedia}
        disabled={loading}
      >
        <LinearGradient
          colors={currentCategory?.color || ['#667EEA', '#764BA2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.buttonText}>
                Generate {activeCategory === 'image' ? 'Image' : activeCategory === 'audio' ? 'Audio' : 'Video'}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Result Display */}
      {result && (
        <View style={[styles.resultCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.resultTitle, { color: theme.text }]}>
            ✨ Generation Result
          </Text>
          {result.error ? (
            <Text style={[styles.errorText, { color: '#FF6B6B' }]}>{result.error}</Text>
          ) : (
            <ScrollView style={styles.resultContent}>
              <Text style={[styles.resultText, { color: theme.text }]}>
                {JSON.stringify(result, null, 2)}
              </Text>
            </ScrollView>
          )}
        </View>
      )}

      {/* About Section */}
      <View style={[styles.aboutSection, { backgroundColor: theme.surface }]}>
        <Text style={[styles.aboutTitle, { color: theme.text }]}>
          🎯 About Media AI Studio
        </Text>
        <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
          Generate professional media content using cutting-edge AI models from Google,
          OpenAI, xAI, Meta, and more. Choose from 50+ specialized models for images,
          audio transcription, voice cloning, and video generation.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  categoryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  categoryTab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modelCard: {
    width: 140,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modelName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  modelProvider: {
    fontSize: 12,
    marginBottom: 4,
  },
  modelSpeed: {
    fontSize: 11,
    fontWeight: '600',
  },
  promptInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  generateButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  resultContent: {
    maxHeight: 300,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  aboutSection: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
