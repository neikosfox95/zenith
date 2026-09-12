import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Dimensions, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
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

const AUDIO_MODELS = [
  { id: 'elevenlabs-v3-turbo', name: 'ElevenLabs v3 Turbo', provider: 'ElevenLabs', color: '#7C3AED', cost: '$0.22/1K', logo: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=64&h=64&fit=crop' },
  { id: 'elevenlabs-v2.5', name: 'ElevenLabs v2.5', provider: 'ElevenLabs', color: '#7C3AED', cost: '$0.11/1K', logo: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=64&h=64&fit=crop' },
  { id: 'gemini-3.1-flash-tts', name: 'Gemini 3.1 Flash TTS', provider: 'Google', color: '#A855F7', cost: '$0.05/1K', logo: 'https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=64&h=64&fit=crop' },
  { id: 'playht-dialog', name: 'PlayHT Dialog', provider: 'PlayHT', color: '#3B82F6', cost: '$0.0975/1K', logo: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=64&h=64&fit=crop' },
  { id: 'playht-standard', name: 'PlayHT Standard', provider: 'PlayHT', color: '#3B82F6', cost: '$0.19/1K', logo: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=64&h=64&fit=crop' }
];

const VOICES = [
  { id: 'alloy', label: 'Alloy', gender: 'Neutral' },
  { id: 'echo', label: 'Echo', gender: 'Male' },
  { id: 'fable', label: 'Fable', gender: 'British' },
  { id: 'onyx', label: 'Onyx', gender: 'Deep' },
  { id: 'nova', label: 'Nova', gender: 'Female' },
  { id: 'shimmer', label: 'Shimmer', gender: 'Soft' }
];

export default function AIAudioGenerator() {
  const [selectedModel, setSelectedModel] = useState(AUDIO_MODELS[0]);
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
  const [showModelSwitcher, setShowModelSwitcher] = useState(false);

  const generate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai-studio/v2/generate/audio`, { text: text.trim(), model: selectedModel.id, voice: selectedVoice.id });
      setResult(response.data.result.url);
    } catch (error: any) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200&h=2000&fit=crop&q=80' }} style={styles.container} blurRadius={3}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.headerTop}>
              <View><Text style={styles.headerTitle}>Audio Studio</Text><Text style={styles.headerSubtitle}>5 AI Voice Models • 70+ Languages</Text></View>
              <TouchableOpacity style={styles.historyButton}><Ionicons name="mic" size={24} color="#7C3AED" /></TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <TouchableOpacity onPress={() => setShowModelSwitcher(!showModelSwitcher)} activeOpacity={0.9}>
              <LinearGradient colors={[`${selectedModel.color}30`, `${selectedModel.color}20`]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.selectedModelCard}>
                <View style={styles.selectedModelLeft}>
                  <Image source={{ uri: selectedModel.logo }} style={styles.selectedModelLogo} />
                  <View><Text style={styles.selectedModelName}>{selectedModel.name}</Text><Text style={styles.selectedModelProvider}>{selectedModel.provider}</Text></View>
                </View>
                <View style={styles.selectedModelRight}>
                  <Text style={[styles.selectedModelCost, { color: selectedModel.color }]}>{selectedModel.cost}</Text>
                  <Ionicons name={showModelSwitcher ? "chevron-up" : "chevron-down"} size={24} color={selectedModel.color} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {showModelSwitcher && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.modelGrid}>
                {AUDIO_MODELS.map((model, index) => (
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
            <Text style={styles.sectionLabel}>Voice Selection</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {VOICES.map((voice) => (
                <TouchableOpacity key={voice.id} onPress={() => setSelectedVoice(voice)} activeOpacity={0.8}>
                  <LinearGradient colors={selectedVoice.id === voice.id ? ['rgba(124, 58, 237, 0.3)', 'rgba(124, 58, 237, 0.2)'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={[styles.voiceCard, selectedVoice.id === voice.id && { borderColor: '#7C3AED', borderWidth: 2 }]}>
                    <Ionicons name="person-circle" size={32} color={selectedVoice.id === voice.id ? '#7C3AED' : 'rgba(255, 255, 255, 0.6)'} />
                    <Text style={styles.voiceName}>{voice.label}</Text>
                    <Text style={styles.voiceGender}>{voice.gender}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <Text style={styles.sectionLabel}>Text to Speech</Text>
            <LinearGradient colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={styles.textCard}>
              <TextInput style={styles.textInput} placeholder="Enter text to convert to speech..." placeholderTextColor="rgba(255, 255, 255, 0.4)" value={text} onChangeText={setText} multiline numberOfLines={6} />
              <Text style={styles.charCount}>{text.length} characters</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
            <TouchableOpacity onPress={generate} disabled={loading || !text.trim()} activeOpacity={0.9}>
              <LinearGradient colors={loading || !text.trim() ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] : [selectedModel.color, `${selectedModel.color}CC`]} style={styles.generateButton}>
                {loading ? (<ActivityIndicator color="#FFFFFF" size="small" />) : (<><Ionicons name="mic-circle" size={24} color="#FFFFFF" /><Text style={styles.generateText}>Generate Audio</Text></>)}
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
  container: { flex: 1, backgroundColor: TikTokColors.background }, scrollView: { flex: 1 }, header: { marginTop: 60, marginHorizontal: 16, marginBottom: 24 }, headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, headerTitle: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 }, headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginTop: 4, fontWeight: '600' }, historyButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(124, 58, 237, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.3)' }, section: { marginHorizontal: 16, marginBottom: 24 }, sectionLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }, selectedModelCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, selectedModelLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 }, selectedModelLogo: { width: 48, height: 48, borderRadius: 24 }, selectedModelName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' }, selectedModelProvider: { fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 }, selectedModelRight: { alignItems: 'flex-end', gap: 4 }, selectedModelCost: { fontSize: 14, fontWeight: '700' }, modelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }, modelGridItem: { width: (width - 56) / 2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }, modelGridLogo: { width: 40, height: 40, borderRadius: 20, marginBottom: 12 }, modelGridName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }, modelGridProvider: { fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 8 }, modelGridCost: { fontSize: 12, fontWeight: '600' }, modelGridBadge: { position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }, voiceCard: { width: 100, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', marginRight: 12 }, voiceName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginTop: 8 }, voiceGender: { fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 }, textCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }, textInput: { color: '#FFFFFF', fontSize: 16, minHeight: 120, textAlignVertical: 'top', marginBottom: 12 }, charCount: { fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', fontWeight: '600' }, generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 8 }, generateText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' }
});