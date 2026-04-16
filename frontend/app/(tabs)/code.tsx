import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { TikTokColors, TikTokSpacing, TikTokBorderRadius, TikTokFontSize, ModelBrandColors } from '../../src/constants/tiktokTheme';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

interface CodingModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  languages: string;
  best_for: string;
}

export default function CodeAIScreen() {
  const { user } = useAuth();
  const [models, setModels] = useState<CodingModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('codex-gpt-5.2');
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('python');
  const [task, setTask] = useState<'generate' | 'fix' | 'explain' | 'optimize'>('generate');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true);

  const languages = ['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust', 'php', 'ruby', 'swift'];
  const tasks = [
    { id: 'generate', label: 'Generate', icon: 'code-slash' },
    { id: 'fix', label: 'Fix Bug', icon: 'bug' },
    { id: 'explain', label: 'Explain', icon: 'help-circle' },
    { id: 'optimize', label: 'Optimize', icon: 'flash' }
  ];

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${API_URL}/api/code/models`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const generateCode = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch(`${API_URL}/api/code/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          language,
          task
        })
      });

      const data = await response.json();
      
      if (data.error) {
        Alert.alert('Error', data.error);
      } else {
        setResult(data.code || data.text || 'No result');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate code');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getProviderColor = (provider: string): string => {
    const providerLower = provider.toLowerCase();
    if (providerLower.includes('openai')) return ModelBrandColors.openai;
    if (providerLower.includes('anthropic')) return ModelBrandColors.anthropic;
    if (providerLower.includes('google')) return ModelBrandColors.google;
    if (providerLower.includes('meta')) return ModelBrandColors.meta;
    if (providerLower.includes('microsoft')) return ModelBrandColors.microsoft;
    if (providerLower.includes('deepseek')) return ModelBrandColors.deepseek;
    if (providerLower.includes('hugging')) return ModelBrandColors.huggingface;
    if (providerLower.includes('qwen') || providerLower.includes('alibaba')) return ModelBrandColors.qwen;
    if (providerLower.includes('replit')) return ModelBrandColors.replit;
    return TikTokColors.accentCyan;
  };

  if (loadingModels) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={TikTokColors.pink} />
          <Text style={styles.loadingText}>Loading Code AI Models...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Ionicons name="code-slash" size={32} color={TikTokColors.pink} />
            <Text style={styles.headerTitle}>Code AI Studio</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {models.length}+ Coding Models • Powered by Emergent LLM Key
          </Text>
        </View>

        {/* Task Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task</Text>
          <View style={styles.taskGrid}>
            {tasks.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.taskButton,
                  task === t.id && styles.taskButtonActive
                ]}
                onPress={() => setTask(t.id as any)}
              >
                <Ionicons 
                  name={t.icon as any} 
                  size={20} 
                  color={task === t.id ? TikTokColors.white : TikTokColors.textSecondary} 
                />
                <Text style={[
                  styles.taskButtonText,
                  task === t.id && styles.taskButtonTextActive
                ]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.languageGrid}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageChip,
                    language === lang && styles.languageChipActive
                  ]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text style={[
                    styles.languageChipText,
                    language === lang && styles.languageChipTextActive
                  ]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Model Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Model</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.modelGrid}>
              {models.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[
                    styles.modelCard,
                    selectedModel === model.id && styles.modelCardActive
                  ]}
                  onPress={() => setSelectedModel(model.id)}
                >
                  <View style={[
                    styles.modelBadge,
                    { backgroundColor: getProviderColor(model.provider) }
                  ]} />
                  <Text style={styles.modelName}>{model.name}</Text>
                  <Text style={styles.modelProvider}>{model.provider}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Prompt Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prompt</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Describe what you want to ${task}...`}
            placeholderTextColor={TikTokColors.textTertiary}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={generateCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={TikTokColors.white} />
          ) : (
            <>
              <Ionicons name="flash" size={20} color={TikTokColors.white} />
              <Text style={styles.generateButtonText}>Generate with AI</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <View style={styles.section}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>Result</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  Alert.alert('Success', 'Code copied to clipboard');
                }}
              >
                <Ionicons name="copy-outline" size={18} color={TikTokColors.cyan} />
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.resultContainer} horizontal>
              <Text style={styles.resultText}>{result}</Text>
            </ScrollView>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: TikTokColors.textPrimary,
    fontSize: TikTokFontSize.md,
    marginTop: TikTokSpacing.md
  },
  header: {
    padding: TikTokSpacing.lg,
    paddingTop: TikTokSpacing.xxl
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: TikTokSpacing.sm
  },
  headerTitle: {
    fontSize: TikTokFontSize.display,
    fontWeight: '700',
    color: TikTokColors.textPrimary,
    marginLeft: TikTokSpacing.md
  },
  headerSubtitle: {
    fontSize: TikTokFontSize.sm,
    color: TikTokColors.textSecondary
  },
  section: {
    paddingHorizontal: TikTokSpacing.lg,
    marginBottom: TikTokSpacing.lg
  },
  sectionTitle: {
    fontSize: TikTokFontSize.lg,
    fontWeight: '600',
    color: TikTokColors.textPrimary,
    marginBottom: TikTokSpacing.md
  },
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TikTokSpacing.sm
  },
  taskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TikTokSpacing.sm,
    paddingHorizontal: TikTokSpacing.md,
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.lg,
    borderWidth: 1,
    borderColor: TikTokColors.border,
    gap: TikTokSpacing.sm
  },
  taskButtonActive: {
    backgroundColor: TikTokColors.pink,
    borderColor: TikTokColors.pink
  },
  taskButtonText: {
    fontSize: TikTokFontSize.md,
    color: TikTokColors.textSecondary,
    fontWeight: '600'
  },
  taskButtonTextActive: {
    color: TikTokColors.white
  },
  languageGrid: {
    flexDirection: 'row',
    gap: TikTokSpacing.sm
  },
  languageChip: {
    paddingVertical: TikTokSpacing.sm,
    paddingHorizontal: TikTokSpacing.md,
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.full,
    borderWidth: 1,
    borderColor: TikTokColors.border
  },
  languageChipActive: {
    backgroundColor: TikTokColors.cyan,
    borderColor: TikTokColors.cyan
  },
  languageChipText: {
    fontSize: TikTokFontSize.sm,
    color: TikTokColors.textSecondary,
    fontWeight: '600'
  },
  languageChipTextActive: {
    color: TikTokColors.black
  },
  modelGrid: {
    flexDirection: 'row',
    gap: TikTokSpacing.md
  },
  modelCard: {
    width: 140,
    padding: TikTokSpacing.md,
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.lg,
    borderWidth: 2,
    borderColor: TikTokColors.border
  },
  modelCardActive: {
    borderColor: TikTokColors.pink,
    backgroundColor: TikTokColors.surfaceLight
  },
  modelBadge: {
    width: 32,
    height: 32,
    borderRadius: TikTokBorderRadius.sm,
    marginBottom: TikTokSpacing.sm
  },
  modelName: {
    fontSize: TikTokFontSize.sm,
    fontWeight: '600',
    color: TikTokColors.textPrimary,
    marginBottom: 2
  },
  modelProvider: {
    fontSize: TikTokFontSize.xs,
    color: TikTokColors.textSecondary
  },
  textInput: {
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.lg,
    padding: TikTokSpacing.md,
    color: TikTokColors.textPrimary,
    fontSize: TikTokFontSize.md,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: TikTokColors.border
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TikTokColors.pink,
    marginHorizontal: TikTokSpacing.lg,
    padding: TikTokSpacing.md,
    borderRadius: TikTokBorderRadius.lg,
    gap: TikTokSpacing.sm
  },
  generateButtonDisabled: {
    opacity: 0.6
  },
  generateButtonText: {
    fontSize: TikTokFontSize.lg,
    fontWeight: '700',
    color: TikTokColors.white
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: TikTokSpacing.md
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  copyButtonText: {
    fontSize: TikTokFontSize.sm,
    color: TikTokColors.cyan,
    fontWeight: '600'
  },
  resultContainer: {
    backgroundColor: TikTokColors.surface,
    borderRadius: TikTokBorderRadius.lg,
    padding: TikTokSpacing.md,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: TikTokColors.border
  },
  resultText: {
    fontSize: TikTokFontSize.sm,
    color: TikTokColors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  }
});
