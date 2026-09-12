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
  Platform,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TikTokColors } from '../../src/constants/tiktokTheme';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import axios from 'axios';

// FIX: this screen derived the API base URL locally from
// EXPO_PUBLIC_BACKEND_URL, which is defined nowhere (app.json has no
// `extra` block and no .env sets it), so the value was undefined and
// every request went to a URL literally starting with "undefined/".
// All screens now share src/config/backend.ts.
import { BACKEND_URL } from '../../src/config/backend';

const { width } = Dimensions.get('window');

const IMAGE_MODELS = [
  { id: 'dall-e-3', name: 'DALL-E 3', provider: 'OpenAI', color: '#10B981', cost: '$0.04-0.08', logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=64&h=64&fit=crop' },
  { id: 'flux-2-pro', name: 'Flux 2 Pro', provider: 'Black Forest Labs', color: '#8B5CF6', cost: '$0.055', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&h=64&fit=crop' },
  { id: 'flux-2-schnell', name: 'Flux 2 Schnell', provider: 'Black Forest Labs', color: '#8B5CF6', cost: '$0.003', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&h=64&fit=crop' },
  { id: 'stable-diffusion-xl', name: 'Stable Diffusion XL', provider: 'Stability AI', color: '#06B6D4', cost: '$0.01', logo: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=64&h=64&fit=crop' },
  { id: 'stable-diffusion-3.5', name: 'Stable Diffusion 3.5', provider: 'Stability AI', color: '#06B6D4', cost: '$0.035', logo: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=64&h=64&fit=crop' },
  { id: 'midjourney-v7', name: 'Midjourney v7', provider: 'Midjourney', color: '#3B82F6', cost: '$30/mo', logo: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=64&h=64&fit=crop' },
  { id: 'nano-banana', name: 'Nano Banana', provider: 'Google', color: '#A855F7', cost: '$0.04', logo: 'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=64&h=64&fit=crop' },
  { id: 'recraft-v3', name: 'Recraft V3', provider: 'Recraft', color: '#F59E0B', cost: '$0.02', logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=64&h=64&fit=crop' },
  { id: 'ideogram-v2', name: 'Ideogram V2', provider: 'Ideogram', color: '#EC4899', cost: '$0.08', logo: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=64&h=64&fit=crop' },
  { id: 'playground-v3', name: 'Playground V3', provider: 'Playground AI', color: '#14B8A6', cost: '$0.02', logo: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=64&h=64&fit=crop' }
];

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square', value: '1024x1024' },
  { id: '16:9', label: 'Landscape', value: '1920x1080' },
  { id: '9:16', label: 'Portrait', value: '1080x1920' },
  { id: '4:3', label: 'Classic', value: '1600x1200' }
];

export default function AIImageGenerator() {
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0]);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [showModelSwitcher, setShowModelSwitcher] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai-studio/v2/generate/image`, {
        prompt: prompt.trim(),
        model: selectedModel.id,
        size: aspectRatio.value
      });

      setResult(response.data.result.url);
    } catch (error: any) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1200&h=2000&fit=crop&q=80' }}
      style={styles.container}
      blurRadius={3}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Image Studio</Text>
                <Text style={styles.headerSubtitle}>10 AI Models • Professional Quality</Text>
              </View>
              <TouchableOpacity style={styles.historyButton}>
                <Ionicons name="images" size={24} color="#EC4899" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* GOD TIER MODEL SWITCHER */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <TouchableOpacity onPress={() => setShowModelSwitcher(!showModelSwitcher)} activeOpacity={0.9}>
              <LinearGradient
                colors={[`${selectedModel.color}30`, `${selectedModel.color}20`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.selectedModelCard}
              >
                <View style={styles.selectedModelLeft}>
                  <Image source={{ uri: selectedModel.logo }} style={styles.selectedModelLogo} />
                  <View>
                    <Text style={styles.selectedModelName}>{selectedModel.name}</Text>
                    <Text style={styles.selectedModelProvider}>{selectedModel.provider}</Text>
                  </View>
                </View>
                <View style={styles.selectedModelRight}>
                  <Text style={[styles.selectedModelCost, { color: selectedModel.color }]}>{selectedModel.cost}</Text>
                  <Ionicons name={showModelSwitcher ? "chevron-up" : "chevron-down"} size={24} color={selectedModel.color} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* ENTERPRISE MODEL GRID SWITCHER */}
            {showModelSwitcher && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.modelGrid}>
                {IMAGE_MODELS.map((model, index) => (
                  <TouchableOpacity
                    key={model.id}
                    onPress={() => {
                      setSelectedModel(model);
                      setShowModelSwitcher(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Animated.View entering={FadeInDown.delay(index * 30).duration(400)}>
                      <LinearGradient
                        colors={selectedModel.id === model.id
                          ? [`${model.color}40`, `${model.color}20`]
                          : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                        }
                        style={[
                          styles.modelGridItem,
                          selectedModel.id === model.id && { borderColor: model.color, borderWidth: 2 }
                        ]}
                      >
                        <Image source={{ uri: model.logo }} style={styles.modelGridLogo} />
                        <Text style={styles.modelGridName} numberOfLines={1}>{model.name}</Text>
                        <Text style={styles.modelGridProvider} numberOfLines={1}>{model.provider}</Text>
                        <Text style={[styles.modelGridCost, { color: model.color }]}>{model.cost}</Text>
                        {selectedModel.id === model.id && (
                          <View style={[styles.modelGridBadge, { backgroundColor: model.color }]}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </LinearGradient>
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </Animated.View>

          {/* Prompt Input */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <Text style={styles.sectionLabel}>Image Description</Text>
            <LinearGradient colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={styles.promptCard}>
              <TextInput
                style={styles.promptInput}
                placeholder="Describe the image you want to create..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={4}
              />
            </LinearGradient>
          </Animated.View>

          {/* Aspect Ratio Selector */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <Text style={styles.sectionLabel}>Aspect Ratio</Text>
            <View style={styles.aspectGrid}>
              {ASPECT_RATIOS.map((ratio) => (
                <TouchableOpacity key={ratio.id} onPress={() => setAspectRatio(ratio)} activeOpacity={0.8}>
                  <LinearGradient
                    colors={aspectRatio.id === ratio.id
                      ? ['rgba(236, 72, 153, 0.3)', 'rgba(236, 72, 153, 0.2)']
                      : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                    }
                    style={[styles.aspectButton, aspectRatio.id === ratio.id && { borderColor: '#EC4899', borderWidth: 2 }]}
                  >
                    <Text style={styles.aspectLabel}>{ratio.label}</Text>
                    <Text style={styles.aspectValue}>{ratio.id}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Generate Button */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
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
                  <><Ionicons name="camera" size={24} color="#FFFFFF" />
                  <Text style={styles.generateText}>Generate Image</Text></>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Result */}
          {result && (
            <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.section}>
              <Text style={styles.sectionLabel}>Generated Image</Text>
              <LinearGradient colors={['rgba(236, 72, 153, 0.15)', 'rgba(236, 72, 153, 0.05)']} style={styles.resultCard}>
                <Image source={{ uri: result }} style={styles.resultImage} resizeMode="contain" />
                <View style={styles.resultFooter}>
                  <TouchableOpacity style={styles.resultButton}>
                    <Ionicons name="download" size={18} color="#EC4899" />
                    <Text style={styles.resultButtonText}>Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resultButton}>
                    <Ionicons name="share" size={18} color="#EC4899" />
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
  container: { flex: 1, backgroundColor: TikTokColors.background },
  scrollView: { flex: 1 },
  header: { marginTop: 60, marginHorizontal: 16, marginBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginTop: 4, fontWeight: '600' },
  historyButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(236, 72, 153, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.3)' },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 },
  selectedModelCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedModelLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  selectedModelLogo: { width: 48, height: 48, borderRadius: 24 },
  selectedModelName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  selectedModelProvider: { fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 },
  selectedModelRight: { alignItems: 'flex-end', gap: 4 },
  selectedModelCost: { fontSize: 14, fontWeight: '700' },
  modelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  modelGridItem: { width: (width - 56) / 2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  modelGridLogo: { width: 40, height: 40, borderRadius: 20, marginBottom: 12 },
  modelGridName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  modelGridProvider: { fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 8 },
  modelGridCost: { fontSize: 12, fontWeight: '600' },
  modelGridBadge: { position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  promptCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  promptInput: { color: '#FFFFFF', fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  aspectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  aspectButton: { width: (width - 56) / 2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center' },
  aspectLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  aspectValue: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' },
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 8 },
  generateText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  resultCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.3)' },
  resultImage: { width: '100%', height: 300, borderRadius: 12, marginBottom: 16 },
  resultFooter: { flexDirection: 'row', gap: 12 },
  resultButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(236, 72, 153, 0.1)', borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.3)' },
  resultButtonText: { fontSize: 13, fontWeight: '600', color: '#EC4899' }
});