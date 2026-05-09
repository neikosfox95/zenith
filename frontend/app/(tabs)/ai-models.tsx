import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function AIModelsScreen() {
  const [selectedProvider, setSelectedProvider] = useState('all');

  const providers = ['all', 'openai', 'google', 'anthropic', 'xai'];

  const [models] = useState([
    {
      id: 1,
      name: 'GPT-5.2 Pro',
      provider: 'OpenAI',
      providerKey: 'openai',
      description: 'Most advanced language model for text generation and analysis',
      capabilities: ['Text', 'Code', 'Analysis'],
      status: 'active',
      speed: 'Fast',
      cost: 'Premium',
      icon: '🤖',
      color: '#10B981'
    },
    {
      id: 2,
      name: 'Gemini 3.0 Flash',
      provider: 'Google',
      providerKey: 'google',
      description: 'Lightning-fast multimodal AI with vision capabilities',
      capabilities: ['Text', 'Vision', 'Audio'],
      status: 'active',
      speed: 'Ultra Fast',
      cost: 'Standard',
      icon: '✨',
      color: TikTokTheme.colors.brand.cyan
    },
    {
      id: 3,
      name: 'Claude 4.5 Opus',
      provider: 'Anthropic',
      providerKey: 'anthropic',
      description: 'Constitutional AI with enhanced reasoning and safety',
      capabilities: ['Text', 'Analysis', 'Ethics'],
      status: 'active',
      speed: 'Moderate',
      cost: 'Premium',
      icon: '🧠',
      color: '#FE2C55'
    },
    {
      id: 4,
      name: 'Grok 4 Premium',
      provider: 'xAI',
      providerKey: 'xai',
      description: 'Real-time knowledge with humor and personality',
      capabilities: ['Text', 'Real-time', 'Web'],
      status: 'available',
      speed: 'Fast',
      cost: 'Standard',
      icon: '🚀',
      color: '#FFD700'
    },
    {
      id: 5,
      name: 'Sora 2 Pro',
      provider: 'OpenAI',
      providerKey: 'openai',
      description: 'Advanced video generation from text prompts',
      capabilities: ['Video', 'Generation'],
      status: 'available',
      speed: 'Slow',
      cost: 'Premium',
      icon: '🎬',
      color: '#A855F7'
    },
    {
      id: 6,
      name: 'Nano Banana',
      provider: 'Google',
      providerKey: 'google',
      description: 'Image generation optimized for speed and quality',
      capabilities: ['Image', 'Generation'],
      status: 'active',
      speed: 'Fast',
      cost: 'Standard',
      icon: '🎨',
      color: '#3B82F6'
    },
  ]);

  const filteredModels = selectedProvider === 'all' 
    ? models 
    : models.filter(m => m.providerKey === selectedProvider);

  const getSpeedColor = (speed: string) => {
    if (speed === 'Ultra Fast' || speed === 'Fast') return '#10B981';
    if (speed === 'Moderate') return '#F59E0B';
    return TikTokTheme.colors.text.muted;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1506994011460-5482746d30a1?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.cubeIcon}>
            <Ionicons name="cube" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            AI Models
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {filteredModels.length} models available
          </Animated.Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Provider Filter */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Filter by Provider</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providersScroll}>
            {providers.map((provider) => (
              <TouchableOpacity
                key={provider}
                style={[
                  styles.providerChip,
                  selectedProvider === provider && styles.providerChipActive
                ]}
                onPress={() => {
                  setSelectedProvider(provider);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[
                  styles.providerText,
                  selectedProvider === provider && styles.providerTextActive
                ]}>{provider.charAt(0).toUpperCase() + provider.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Models Grid */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Available Models</Text>
        </Animated.View>

        {filteredModels.map((model, index) => (
          <Animated.View key={model.id} entering={FadeInDown.delay(450 + index * 50)}>
            <TouchableOpacity 
              style={styles.modelCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
                style={styles.modelBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.modelBlur}>
                <LinearGradient
                  colors={[`${model.color}15`, `${model.color}05`]}
                  style={styles.modelContent}
                >
                  {/* Header */}
                  <View style={styles.modelHeader}>
                    <Text style={styles.modelIcon}>{model.icon}</Text>
                    <View style={styles.modelTitleContainer}>
                      <Text style={styles.modelName}>{model.name}</Text>
                      <Text style={styles.modelProvider}>{model.provider}</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: model.status === 'active' ? '#10B981' : '#F59E0B' }]} />
                  </View>

                  {/* Description */}
                  <Text style={styles.modelDesc}>{model.description}</Text>

                  {/* Capabilities */}
                  <View style={styles.capabilitiesRow}>
                    {model.capabilities.map((cap) => (
                      <View key={cap} style={styles.capabilityBadge}>
                        <Text style={styles.capabilityText}>{cap}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Specs */}
                  <View style={styles.specsRow}>
                    <View style={styles.specItem}>
                      <Ionicons name="flash" size={14} color={getSpeedColor(model.speed)} />
                      <Text style={[styles.specText, { color: getSpeedColor(model.speed) }]}>{model.speed}</Text>
                    </View>
                    <View style={styles.specItem}>
                      <Ionicons name="cash-outline" size={14} color={TikTokTheme.colors.text.secondary} />
                      <Text style={styles.specText}>{model.cost}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.activateButton, { backgroundColor: `${model.color}30`, borderColor: model.color }]}
                      onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
                    >
                      <Text style={[styles.activateText, { color: model.color }]}>
                        {model.status === 'active' ? 'Active' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  heroContainer: { height: 160, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cubeIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  providersScroll: { gap: 8, paddingBottom: 16 },
  providerChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  providerChipActive: { backgroundColor: 'rgba(0, 242, 234, 0.2)', borderColor: TikTokTheme.colors.brand.cyan },
  providerText: { fontSize: 13, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  providerTextActive: { color: TikTokTheme.colors.brand.cyan, fontWeight: '700' },
  modelCard: { borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  modelBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  modelBlur: { flex: 1 },
  modelContent: { padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  modelHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  modelIcon: { fontSize: 40 },
  modelTitleContainer: { flex: 1 },
  modelName: { fontSize: 18, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  modelProvider: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  modelDesc: { fontSize: 13, color: TikTokTheme.colors.text.secondary, lineHeight: 18, marginBottom: 12 },
  capabilitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  capabilityBadge: { backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  capabilityText: { fontSize: 11, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  specsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specText: { fontSize: 12, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  activateButton: { marginLeft: 'auto', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5 },
  activateText: { fontSize: 12, fontWeight: '900' },
});