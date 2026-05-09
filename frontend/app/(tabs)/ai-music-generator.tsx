import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Dimensions, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TikTokColors } from '../../src/constants/tiktokTheme';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const MUSIC_MODELS = [
  { id: 'suno-v5.5', name: 'Suno v5.5', provider: 'Suno AI', color: '#EC4899', cost: '$0.015/song', logo: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=64&h=64&fit=crop' },
  { id: 'suno-v4.5', name: 'Suno v4.5', provider: 'Suno AI', color: '#EC4899', cost: '$0.02/song', logo: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=64&h=64&fit=crop' },
  { id: 'udio-pro', name: 'Udio Pro', provider: 'Udio', color: '#F59E0B', cost: '$0.005/song', logo: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=64&h=64&fit=crop' },
  { id: 'udio-standard', name: 'Udio Standard', provider: 'Udio', color: '#F59E0B', cost: '$0.00417/song', logo: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=64&h=64&fit=crop' },
  { id: 'musicgen', name: 'MusicGen', provider: 'Meta', color: '#0084FF', cost: '$0.80/min', logo: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=64&h=64&fit=crop' }
];

const GENRES = [
  { id: 'pop', label: 'Pop', icon: 'musical-note' },
  { id: 'rock', label: 'Rock', icon: 'flame' },
  { id: 'electronic', label: 'Electronic', icon: 'pulse' },
  { id: 'classical', label: 'Classical', icon: 'piano' },
  { id: 'jazz', label: 'Jazz', icon: 'bonfire' },
  { id: 'hip-hop', label: 'Hip Hop', icon: 'headset' },
  { id: 'ambient', label: 'Ambient', icon: 'cloud' },
  { id: 'lo-fi', label: 'Lo-Fi', icon: 'cafe' }
];

const DURATIONS = [{ id: '30s', label: '30 sec', value: 30 }, { id: '1min', label: '1 min', value: 60 }, { id: '2min', label: '2 min', value: 120 }, { id: '4min', label: '4 min', value: 240 }];

export default function AIMusicGenerator() {
  const [selectedModel, setSelectedModel] = useState(MUSIC_MODELS[0]);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [showModelSwitcher, setShowModelSwitcher] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai-studio/v2/generate/music`, { prompt: prompt.trim(), model: selectedModel.id, genre: selectedGenre.id, duration: duration.value });
      setResult(response.data.result.url);
    } catch (error: any) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=2000&fit=crop&q=80' }} style={styles.container} blurRadius={3}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
            <View style={styles.headerTop}>
              <View><Text style={styles.headerTitle}>Music Studio</Text><Text style={styles.headerSubtitle}>5 AI Models • Full Songs up to 4min</Text></View>
              <TouchableOpacity style={styles.historyButton}><Ionicons name="musical-notes" size={24} color="#EC4899" /></TouchableOpacity>
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
                {MUSIC_MODELS.map((model, index) => (
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
            <Text style={styles.sectionLabel}>Genre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {GENRES.map((genre) => (
                <TouchableOpacity key={genre.id} onPress={() => setSelectedGenre(genre)} activeOpacity={0.8}>
                  <LinearGradient colors={selectedGenre.id === genre.id ? ['rgba(236, 72, 153, 0.3)', 'rgba(236, 72, 153, 0.2)'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={[styles.genreCard, selectedGenre.id === genre.id && { borderColor: '#EC4899', borderWidth: 2 }]}>
                    <Ionicons name={genre.icon as any} size={24} color={selectedGenre.id === genre.id ? '#EC4899' : 'rgba(255, 255, 255, 0.6)'} />
                    <Text style={styles.genreLabel}>{genre.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <Text style={styles.sectionLabel}>Music Description</Text>
            <LinearGradient colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={styles.promptCard}>
              <TextInput style={styles.promptInput} placeholder="Describe the music style, mood, instruments..." placeholderTextColor="rgba(255, 255, 255, 0.4)" value={prompt} onChangeText={setPrompt} multiline numberOfLines={4} />
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.section}>
            <Text style={styles.sectionLabel}>Duration</Text>
            <View style={styles.durationGrid}>
              {DURATIONS.map((dur) => (
                <TouchableOpacity key={dur.id} onPress={() => setDuration(dur)} activeOpacity={0.8}>
                  <LinearGradient colors={duration.id === dur.id ? ['rgba(236, 72, 153, 0.3)', 'rgba(236, 72, 153, 0.2)'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={[styles.durationButton, duration.id === dur.id && { borderColor: '#EC4899', borderWidth: 2 }]}>
                    <Text style={styles.durationLabel}>{dur.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
            <TouchableOpacity onPress={generate} disabled={loading || !prompt.trim()} activeOpacity={0.9}>
              <LinearGradient colors={loading || !prompt.trim() ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'] : [selectedModel.color, `${selectedModel.color}CC`]} style={styles.generateButton}>
                {loading ? (<ActivityIndicator color="#FFFFFF" size="small" />) : (<><Ionicons name="play-circle" size={24} color="#FFFFFF" /><Text style={styles.generateText}>Generate Music</Text></>)}
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
  container: { flex: 1, backgroundColor: TikTokColors.background }, scrollView: { flex: 1 }, header: { marginTop: 60, marginHorizontal: 16, marginBottom: 24 }, headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, headerTitle: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 }, headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginTop: 4, fontWeight: '600' }, historyButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(236, 72, 153, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(236, 72, 153, 0.3)' }, section: { marginHorizontal: 16, marginBottom: 24 }, sectionLabel: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 12 }, selectedModelCard: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, selectedModelLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 }, selectedModelLogo: { width: 48, height: 48, borderRadius: 24 }, selectedModelName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' }, selectedModelProvider: { fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', marginTop: 2 }, selectedModelRight: { alignItems: 'flex-end', gap: 4 }, selectedModelCost: { fontSize: 14, fontWeight: '700' }, modelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }, modelGridItem: { width: (width - 56) / 2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }, modelGridLogo: { width: 40, height: 40, borderRadius: 20, marginBottom: 12 }, modelGridName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }, modelGridProvider: { fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 8 }, modelGridCost: { fontSize: 12, fontWeight: '600' }, modelGridBadge: { position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }, genreCard: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', marginRight: 12, minWidth: 80 }, genreLabel: { fontSize: 13, fontWeight: '600', color: '#FFFFFF', marginTop: 8 }, promptCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }, promptInput: { color: '#FFFFFF', fontSize: 16, minHeight: 80, textAlignVertical: 'top' }, durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, durationButton: { width: (width - 56) / 2, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center' }, durationLabel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' }, generateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 8 }, generateText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' }
});