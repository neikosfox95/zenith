import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TikTokColors } from '../../src/constants/tiktokTheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const TEXT_MODELS = [
  { id: 'gpt-5.5-pro', name: 'GPT-5.5 Pro', provider: 'OpenAI', color: '#10B981', cost: '$30/$180' },
  { id: 'claude-opus-4.7', name: 'Claude Opus 4.7', provider: 'Anthropic', color: '#FF7A45', cost: '$5/$25' },
  { id: 'gemini-3.0-pro', name: 'Gemini 3.0 Pro', provider: 'Google', color: '#A855F7', cost: '$2/$12' },
  { id: 'deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek', color: '#3B82F6', cost: '$0.27/$1.1' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', color: '#A855F7', cost: '$0.1/$0.4' },
  { id: 'gpt-5.4', name: 'GPT-5.4', provider: 'OpenAI', color: '#10B981', cost: '$2.5/$15' },
  { id: 'qwen-3-32b', name: 'Qwen 3 32B', provider: 'Alibaba', color: '#EF4444', cost: '$0.12/$0.12' }
];

export default function AITextGenerator() {
  const [selectedModel, setSelectedModel] = useState(TEXT_MODELS[0]);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);

  const generate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai-studio/v2/generate/text`, {
        prompt: prompt.trim(),
        model: selectedModel.id,
        temperature,
        maxTokens
      });

      setResult(response.data.result.text);
    } catch (error: any) {
      console.error('Generation failed:', error);
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=2000&fit=crop&q=80' }}
      style={styles.container}
      blurRadius={3}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Text Generation</Text>
                <Text style={styles.headerSubtitle}>7 AI Models Available</Text>
              </View>
              <TouchableOpacity style={styles.historyButton}>
                <Ionicons name="time" size={24} color="#00F2EA" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Model Selector */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <Text style={styles.sectionLabel}>Select Model</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.modelScroll}
            >
              {TEXT_MODELS.map((model, index) => (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => setSelectedModel(model)}
                  activeOpacity={0.8}
                >
                  <Animated.View entering={FadeInDown.delay(250 + index * 50).duration(600)}>
                    <LinearGradient
                      colors={selectedModel.id === model.id
                        ? [`${model.color}30`, `${model.color}20`]
                        : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                      }
                      style={[
                        styles.modelCard,
                        selectedModel.id === model.id && { borderColor: model.color, borderWidth: 2 }
                      ]}
                    >
                      <View style={[styles.modelIcon, { backgroundColor: `${model.color}30` }]}>
                        <Ionicons name="sparkles" size={20} color={model.color} />
                      </View>
                      <Text style={styles.modelName}>{model.name}</Text>
                      <Text style={styles.modelProvider}>{model.provider}</Text>
                      <Text style={styles.modelCost}>{model.cost}</Text>
                      {selectedModel.id === model.id && (
                        <View style={[styles.selectedBadge, { backgroundColor: model.color }]}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </LinearGradient>
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Prompt Input */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <Text style={styles.sectionLabel}>Your Prompt</Text>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.promptCard}
            >
              <TextInput
                style={styles.promptInput}
                placeholder="Enter your prompt here..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={6}
              />
              <View style={styles.promptFooter}>
                <Text style={styles.promptCount}>{prompt.length} characters</Text>
                <TouchableOpacity onPress={() => setPrompt('')}>
                  <Ionicons name="close-circle" size={20} color="rgba(255, 255, 255, 0.4)" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Advanced Settings */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
            <Text style={styles.sectionLabel}>Advanced Settings</Text>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.settingsCard}
            >
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Temperature: {temperature.toFixed(1)}</Text>
                <View style={styles.settingButtons}>
                  <TouchableOpacity onPress={() => setTemperature(Math.max(0, temperature - 0.1))}>
                    <View style={styles.settingButton}>
                      <Ionicons name="remove" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setTemperature(Math.min(1, temperature + 0.1))}>
                    <View style={styles.settingButton}>
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Max Tokens: {maxTokens}</Text>
                <View style={styles.settingButtons}>
                  <TouchableOpacity onPress={() => setMaxTokens(Math.max(100, maxTokens - 500))}>
                    <View style={styles.settingButton}>
                      <Ionicons name="remove" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMaxTokens(Math.min(4000, maxTokens + 500))}>
                    <View style={styles.settingButton}>
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Generate Button */}
          <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.section}>
            <TouchableOpacity onPress={generate} disabled={loading || !prompt.trim()} activeOpacity={0.9}>
              <LinearGradient
                colors={loading || !prompt.trim() 
                  ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                  : [selectedModel.color, `${selectedModel.color}CC`]
                }
                style={styles.generateButton}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <><Ionicons name="flash" size={24} color="#FFFFFF" />
                  <Text style={styles.generateText}>Generate with {selectedModel.name}</Text></>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Result */}
          {result && (
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.section}>
              <Text style={styles.sectionLabel}>Generated Result</Text>
              <LinearGradient
                colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']}
                style={styles.resultCard}
              >
                <ScrollView style={styles.resultScroll}>
                  <Text style={styles.resultText}>{result}</Text>
                </ScrollView>
                <View style={styles.resultFooter}>
                  <TouchableOpacity style={styles.resultButton}>
                    <Ionicons name="copy" size={18} color="#00F2EA" />
                    <Text style={styles.resultButtonText}>Copy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resultButton}>
                    <Ionicons name="share" size={18} color="#00F2EA" />
                    <Text style={styles.resultButtonText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TikTokColors.background
  },
  scrollView: {
    flex: 1
  },
  header: {
    marginTop: 60,
    marginHorizontal: 16,
    marginBottom: 24
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    fontWeight: '600'
  },
  historyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 242, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.3)'
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12
  },
  modelScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16
  },
  modelCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  modelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  modelName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4
  },
  modelProvider: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8
  },
  modelCost: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600'
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  promptCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  promptInput: {
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top'
  },
  promptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)'
  },
  promptCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600'
  },
  settingsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  settingButtons: {
    flexDirection: 'row',
    gap: 8
  },
  settingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8
  },
  generateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  resultCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.3)',
    maxHeight: 300
  },
  resultScroll: {
    maxHeight: 200
  },
  resultText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 24
  },
  resultFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 242, 234, 0.2)'
  },
  resultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 242, 234, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 234, 0.3)'
  },
  resultButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00F2EA'
  }
});
