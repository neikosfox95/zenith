// ============================================================
// AI STUDIO TAB - ZENITH GRADE SUPER APP
// Complete AI Interface: Text, Image, Video, Voice, Music, Music Video, MCPs
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AIStudioScreen() {
  const [activeCategory, setActiveCategory] = useState('text');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const categories = [
    { id: 'text', name: 'Text Gen', icon: '💬', count: '40+' },
    { id: 'image', name: 'Image', icon: '🎨', count: '10+' },
    { id: 'video', name: 'Video', icon: '🎬', count: '10+' },
    { id: 'voice', name: 'Voice/TTS', icon: '🎤', count: '10+' },
    { id: 'music', name: 'Music', icon: '🎵', count: '18+' },
    { id: 'music-video', name: 'Music Video', icon: '📹', count: '10+' },
    { id: 'mcp', name: 'MCPs', icon: '🔗', count: '95+' },
    { id: 'mythos', name: 'Mythos', icon: '🧠', count: 'Reasoning' }
  ];

  useEffect(() => {
    loadModels();
  }, [activeCategory]);

  const loadModels = async () => {
    try {
      const endpoint = getModelsEndpoint(activeCategory);
      const response = await axios.get(`${API_URL}/api/ai-studio/${endpoint}`);
      
      let loadedModels = [];
      
      if (activeCategory === 'music') {
        // Flatten music categories
        Object.entries(response.data.categories).forEach(([category, models]) => {
          models.forEach(model => {
            loadedModels.push({ ...model, category });
          });
        });
      } else if (activeCategory === 'mcp') {
        loadedModels = response.data.top_50 || [];
      } else {
        loadedModels = response.data.models || [];
      }
      
      setModels(loadedModels);
      
      if (loadedModels.length > 0) {
        setSelectedModel(loadedModels[0]);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const getModelsEndpoint = (category) => {
    const endpoints = {
      'text': 'text/models',
      'image': 'image/models',
      'video': 'video/models',
      'voice': 'tts/models',
      'music': 'music/models',
      'music-video': 'music-video/models',
      'mcp': 'mcp/servers',
      'mythos': 'text/models' // Use same as text
    };
    return endpoints[category];
  };

  const handleGenerate = async () => {
    if (!prompt || !selectedModel) {
      alert('Please enter a prompt and select a model');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const endpoint = getGenerateEndpoint(activeCategory);
      const payload = buildPayload(activeCategory, prompt, selectedModel);
      
      const response = await axios.post(`${API_URL}/api/ai-studio/${endpoint}`, payload);
      setResult(response.data);
    } catch (error) {
      console.error('Generation error:', error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getGenerateEndpoint = (category) => {
    const endpoints = {
      'text': 'text/generate',
      'image': 'image/generate',
      'video': 'video/generate',
      'voice': 'tts/generate',
      'music': 'music/generate',
      'music-video': 'music-video/generate',
      'mcp': 'mcp/connect',
      'mythos': 'mythos/reason'
    };
    return endpoints[category];
  };

  const buildPayload = (category, prompt, model) => {
    const base = { prompt, model: model.id };
    
    switch (category) {
      case 'text':
        return {
          ...base,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000
        };
      case 'image':
        return { ...base, size: '1024x1024', n: 1 };
      case 'video':
        return { ...base, duration: 10, aspect_ratio: '16:9' };
      case 'voice':
        return { ...base, text: prompt, voice: 'default', language: 'en' };
      case 'music':
        return { ...base, duration: 120, genre: 'pop' };
      case 'music-video':
        return { ...base, audio_source: 'upload', format: '9:16', beat_sync: true };
      case 'mcp':
        return { server_id: model.id, config: {} };
      case 'mythos':
        return { ...base, loop_depth: 16, mode: 'balanced' };
      default:
        return base;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI STUDIO</Text>
        <Text style={styles.headerSubtitle}>Zenith Grade Super App</Text>
      </View>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryTab,
              activeCategory === cat.id && styles.categoryTabActive
            ]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[
              styles.categoryName,
              activeCategory === cat.id && styles.categoryNameActive
            ]}>
              {cat.name}
            </Text>
            <Text style={styles.categoryCount}>{cat.count}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Model Selector */}
      <View style={styles.modelSelector}>
        <Text style={styles.sectionLabel}>Select Model:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.modelList}
        >
          {models.map((model, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.modelChip,
                selectedModel?.id === model.id && styles.modelChipActive
              ]}
              onPress={() => setSelectedModel(model)}
            >
              <Text style={[
                styles.modelName,
                selectedModel?.id === model.id && styles.modelNameActive
              ]}>
                {model.name || model.id}
              </Text>
              {model.provider && (
                <Text style={styles.modelProvider}>
                  {model.provider}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Prompt Input */}
      <View style={styles.promptContainer}>
        <Text style={styles.sectionLabel}>Enter Prompt:</Text>
        <TextInput
          style={styles.promptInput}
          multiline
          numberOfLines={4}
          placeholder={getPlaceholder(activeCategory)}
          placeholderTextColor="#666"
          value={prompt}
          onChangeText={setPrompt}
        />
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateButton, loading && styles.generateButtonDisabled]}
        onPress={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.generateButtonText}>
            ✨ Generate with {selectedModel?.name || 'AI'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Result Display */}
      {result && (
        <ScrollView style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Result:</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultText}>
              {JSON.stringify(result, null, 2)}
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Model Info Footer */}
      {selectedModel && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            📊 Model: {selectedModel.name}
            {selectedModel.category && ` | 🏷️ ${selectedModel.category}`}
            {selectedModel.capabilities && ` | ⚡ ${selectedModel.capabilities.join(', ')}`}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function getPlaceholder(category) {
  const placeholders = {
    'text': 'Ask me anything... (40+ models available)',
    'image': 'Describe the image you want to create...',
    'video': 'Describe the video scene...',
    'voice': 'Enter text to convert to speech...',
    'music': 'Describe the song: genre, mood, lyrics...',
    'music-video': 'Paste Spotify/TikTok/YouTube link or describe...',
    'mcp': 'Configure MCP server connection...',
    'mythos': 'Complex reasoning prompt (up to 64 loop iterations)...'
  };
  return placeholders[category] || 'Enter your prompt...';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#00ff00'
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff00',
    letterSpacing: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
    letterSpacing: 2
  },
  categoryScroll: {
    maxHeight: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#222'
  },
  categoryTab: {
    padding: 15,
    margin: 5,
    borderRadius: 15,
    backgroundColor: '#111',
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#333'
  },
  categoryTabActive: {
    backgroundColor: '#00ff0020',
    borderColor: '#00ff00'
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 5
  },
  categoryName: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600'
  },
  categoryNameActive: {
    color: '#00ff00'
  },
  categoryCount: {
    fontSize: 10,
    color: '#666',
    marginTop: 2
  },
  modelSelector: {
    padding: 15
  },
  sectionLabel: {
    fontSize: 14,
    color: '#00ff00',
    marginBottom: 10,
    fontWeight: '600'
  },
  modelList: {
    maxHeight: 60
  },
  modelChip: {
    padding: 12,
    margin: 5,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center'
  },
  modelChipActive: {
    backgroundColor: '#00ff0020',
    borderColor: '#00ff00'
  },
  modelName: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600'
  },
  modelNameActive: {
    color: '#00ff00'
  },
  modelProvider: {
    fontSize: 9,
    color: '#666',
    marginTop: 2
  },
  promptContainer: {
    padding: 15
  },
  promptInput: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 14
  },
  generateButton: {
    margin: 15,
    backgroundColor: '#00ff00',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8
  },
  generateButtonDisabled: {
    backgroundColor: '#006600',
    shadowOpacity: 0.2
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000'
  },
  resultContainer: {
    flex: 1,
    padding: 15
  },
  resultLabel: {
    fontSize: 14,
    color: '#00ff00',
    marginBottom: 10,
    fontWeight: '600'
  },
  resultCard: {
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00ff00'
  },
  resultText: {
    color: '#00ff00',
    fontSize: 12,
    fontFamily: 'monospace'
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#0a0a0a'
  },
  footerText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center'
  }
});
