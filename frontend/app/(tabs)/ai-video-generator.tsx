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

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const VIDEO_MODELS = [
  { id: 'sora-2-pro', name: 'Sora 2 Pro', provider: 'OpenAI', color: '#10B981', cost: '$0.30/sec', logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=64&h=64&fit=crop' },
  { id: 'sora-2', name: 'Sora 2 Standard', provider: 'OpenAI', color: '#10B981', cost: '$0.10/sec', logo: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=64&h=64&fit=crop' },
  { id: 'runway-gen-4.5', name: 'Runway Gen-4.5', provider: 'Runway', color: '#8B5CF6', cost: '$0.25/sec', logo: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=64&h=64&fit=crop' },
  { id: 'runway-gen-3-turbo', name: 'Gen-3 Alpha Turbo', provider: 'Runway', color: '#8B5CF6', cost: '$0.15/sec', logo: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=64&h=64&fit=crop' },
  { id: 'kling-3.0-pro', name: 'Kling 3.0 Pro', provider: 'Kling AI', color: '#F59E0B', cost: '$0.07/sec', logo: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=64&h=64&fit=crop' },
  { id: 'kling-3.0-std', name: 'Kling 3.0 Standard', provider: 'Kling AI', color: '#F59E0B', cost: '$0.05/sec', logo: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=64&h=64&fit=crop' },
  { id: 'pika-2.0', name: 'Pika 2.0', provider: 'Pika Labs', color: '#EC4899', cost: '$0.20/sec', logo: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=64&h=64&fit=crop' },
  { id: 'luma-dream-machine', name: 'Dream Machine', provider: 'Luma AI', color: '#06B6D4', cost: '$0.12/sec', logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=64&h=64&fit=crop' },
  { id: 'seedance-2.0', name: 'Seedance 2.0', provider: 'ByteDance', color: '#EF4444', cost: '$0.08/sec', logo: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=64&h=64&fit=crop' },
  { id: 'vidu-ai', name: 'Vidu AI', provider: 'Vidu', color: '#14B8A6', cost: '$0.06/sec', logo: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=64&h=64&fit=crop' },
  { id: 'haiper-2.0', name: 'Haiper 2.0', provider: 'Haiper', color: '#A855F7', cost: '$0.09/sec', logo: 'https://images.unsplash.com/photo-1519810755548-39cd217da494?w=64&h=64&fit=crop' },
  { id: 'morph-studio', name: 'Morph Studio', provider: 'Morph', color: '#10B981', cost: '$0.11/sec', logo: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=64&h=64&fit=crop' }
];

const DURATIONS = [
  { id: '3s', label: '3 seconds', value: 3 },
  { id: '5s', label: '5 seconds', value: 5 },
  { id: '10s', label: '10 seconds', value: 10 },
  { id: '15s', label: '15 seconds', value: 15 }
];

export default function AIVideoGenerator() {
  const [selectedModel, setSelectedModel] = useState(VIDEO_MODELS[0]);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [showModelSwitcher, setShowModelSwitcher] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai-studio/v2/generate/video`, {
        prompt: prompt.trim(),
        model: selectedModel.id,
        duration: duration.value
      });
      setResult(response.data.result.url);
    } catch (error: any) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&h=2000&fit=crop&q=80' }} style={styles.container} blurRadius={3}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>Video Studio</Text>
                <Text style={styles.headerSubtitle}>12 AI Models • Cinematic Quality</Text>
              </View>
              <TouchableOpacity style={styles.historyButton}>
                <Ionicons name="videocam" size={24} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* GOD TIER MODEL SWITCHER */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <TouchableOpacity onPress={() => setShowModelSwitcher(!showModelSwitcher)} activeOpacity={0.9}>
              <LinearGradient colors={[`${selectedModel.color}30`, `${selectedModel.color}20`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.selectedModelCard}>
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

            {showModelSwitcher && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.modelGrid}>
                {VIDEO_MODELS.map((model, index) => (
                  <TouchableOpacity key={model.id} onPress={() => { setSelectedModel(model); setShowModelSwitcher(false); }} activeOpacity={0.8}>
                    <Animated.View entering={FadeInDown.delay(index * 30).duration(400)}>
                      <LinearGradient colors={selectedModel.id === model.id ? [`${model.color}40`, `${model.color}20`] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={[styles.modelGridItem, selectedModel.id === model.id && { borderColor: model.color, borderWidth: 2 }]}>
                        <Image source={{ uri: model.logo }} style={styles.modelGridLogo} />
                        <Text style={styles.modelGridName} numberOfLines={1}>{model.name}</Text>
                        <Text style={styles.modelGridProvider} numberOfLines={1}>{model.provider}</Text>
                        <Text style={[styles.modelGridCost, { color: model.color }]}>{model.cost}</Text>
                        {selectedModel.id === model.id && (<View style={[styles.modelGridBadge, { backgroundColor: model.color }]}><Ionicons name="checkmark" size={12} color="#FFFFFF" /></View>)}
                      </LinearGradient>
                    </Animated.View>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <Text style={styles.sectionLabel}>Video Description</Text>
            <LinearGradient colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={styles.promptCard}>
              <TextInput style={styles.promptInput} placeholder="Describe your video scene..." placeholderTextColor="rgba(255, 255, 255, 0.4)" value={prompt} onChangeText={setPrompt} multiline numberOfLines={4} />
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <Text style={styles.sectionLabel}>Duration</Text>
            <View style={styles.durationGrid}>
              {DURATIONS.map((dur) => (
                <TouchableOpacity key={dur.id} onPress={() => setDuration(dur)} activeOpacity={0.8}>
                  <LinearGradient colors={duration.id === dur.id ? ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.2)'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={[styles.durationButton, duration.id === dur.id && { borderColor: '#8B5CF6', borderWidth: 2 }]}>
                    <Text style={styles.durationLabel}>{dur.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
            <TouchableOpacity onPress={generate} disabled={loading || !prompt.trim()} activeOpacity={0.9}>
              <LinearGradient colors={loading || !prompt.trim() ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] : [selectedModel.color, `${selectedModel.color}CC`]} style={styles.generateButton}>
                {loading ? (<ActivityIndicator color="#FFFFFF" size="small" />) : (<><Ionicons name="film" size={24} color="#FFFFFF" /><Text style={styles.generateText}>Generate Video</Text></>)}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

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
  historyButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(139, 92, 246, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' },
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
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  durationButton: { width: (width - 56) / 2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center' },
  durationLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 8 },
  generateText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' }
});