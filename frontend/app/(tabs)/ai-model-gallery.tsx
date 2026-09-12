import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TikTokColors } from '../../src/constants/tiktokTheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';

// FIX: this screen derived the API base URL locally from
// EXPO_PUBLIC_BACKEND_URL, which is defined nowhere (app.json has no
// `extra` block and no .env sets it), so the value was undefined and
// every request went to a URL literally starting with "undefined/".
// All screens now share src/config/backend.ts.
import { BACKEND_URL } from '../../src/config/backend';

const { width } = Dimensions.get('window');

export default function AIModelGallery() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState('all');

  const modelTypes = [
    { id: 'all', name: 'All Models', icon: 'apps', count: 39 },
    { id: 'text', name: 'Text', icon: 'document-text', count: 7 },
    { id: 'image', name: 'Image', icon: 'image', count: 10 },
    { id: 'video', name: 'Video', icon: 'videocam', count: 12 },
    { id: 'audio', name: 'Audio', icon: 'mic', count: 5 },
    { id: 'music', name: 'Music', icon: 'musical-notes', count: 5 }
  ];

  useEffect(() => {
    loadModels();
  }, [selectedType]);

  const loadModels = async () => {
    try {
      const endpoint = selectedType === 'all' 
        ? `${BACKEND_URL}/api/ai-studio/v2/models`
        : `${BACKEND_URL}/api/ai-studio/v2/models?type=${selectedType}`;
      
      const response = await axios.get(endpoint);
      
      if (selectedType === 'all') {
        setModels(response.data.models || []);
      } else {
        const modelData = response.data.models || {};
        const modelArray = Object.keys(modelData).map(key => ({
          id: key,
          ...modelData[key]
        }));
        setModels(modelArray);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadModels();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={TikTokColors.cyan} />
        <Text style={styles.loadingText}>Loading Model Gallery...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&h=2000&fit=crop&q=80' }}
      style={styles.container}
      blurRadius={3}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TikTokColors.cyan} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.headerTitle}>Model Gallery</Text>
          <Text style={styles.headerSubtitle}>Browse 39 AI Models</Text>
        </Animated.View>

        {/* Type Filter */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {modelTypes.map((type, index) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSelectedType(type.id)}
                activeOpacity={0.8}
              >
                <Animated.View entering={FadeInDown.delay(250 + index * 50).duration(600)}>
                  <LinearGradient
                    colors={selectedType === type.id 
                      ? ['rgba(0, 242, 234, 0.3)', 'rgba(254, 44, 85, 0.3)']
                      : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                    }
                    style={styles.filterChip}
                  >
                    <Ionicons 
                      name={type.icon as any} 
                      size={20} 
                      color={selectedType === type.id ? TikTokColors.cyan : 'rgba(255, 255, 255, 0.7)'} 
                    />
                    <Text style={[
                      styles.filterText,
                      selectedType === type.id && styles.filterTextActive
                    ]}>
                      {type.name}
                    </Text>
                    <View style={[
                      styles.filterBadge,
                      selectedType === type.id && styles.filterBadgeActive
                    ]}>
                      <Text style={styles.filterBadgeText}>{type.count}</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Model Grid */}
        <View style={styles.modelsGrid}>
          {models.map((model, index) => (
            <ModelCard key={model.id} model={model} index={index} />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ImageBackground>
  );
}

function ModelCard({ model, index }: any) {
  const getProviderName = (provider: string) => {
    const names: any = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      deepseek: 'DeepSeek',
      alibaba: 'Alibaba',
      blackforest: 'Black Forest Labs',
      stability: 'Stability AI',
      midjourney: 'Midjourney',
      runway: 'Runway',
      pika: 'Pika Labs',
      kling: 'Kling AI',
      luma: 'Luma AI',
      bytedance: 'ByteDance',
      vidu: 'Vidu AI',
      haiper: 'Haiper',
      morph: 'Morph Studio',
      elevenlabs: 'ElevenLabs',
      playht: 'PlayHT',
      suno: 'Suno AI',
      udio: 'Udio',
      meta: 'Meta',
      recraft: 'Recraft',
      ideogram: 'Ideogram',
      playground: 'Playground AI'
    };
    return names[provider] || provider;
  };

  const getPricingDisplay = () => {
    if (model.pricing?.input && model.pricing?.output) {
      return `$${model.pricing.input}/$${model.pricing.output} per 1M`;
    }
    if (model.pricing?.perImage) {
      return `$${model.pricing.perImage} per image`;
    }
    if (model.pricing?.perSecond) {
      return `$${model.pricing.perSecond}/sec`;
    }
    if (model.pricing?.per1kChars) {
      return `$${model.pricing.per1kChars}/1K chars`;
    }
    if (model.pricing?.perSong) {
      return `$${model.pricing.perSong} per song`;
    }
    if (model.pricing?.subscription) {
      return `$${model.pricing.subscription}/mo`;
    }
    return 'Custom pricing';
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(400 + index * 50).duration(600)}
      style={styles.modelCard}
    >
      <TouchableOpacity activeOpacity={0.9}>
        <LinearGradient
          colors={[`${model.color}20`, `${model.color}10`]}
          style={styles.modelGradient}
        >
          {/* Model Icon */}
          <View style={[styles.modelIconContainer, { backgroundColor: `${model.color}30` }]}>
            <Image 
              source={{ uri: model.logo }} 
              style={styles.modelLogo}
            />
          </View>

          {/* Model Name */}
          <Text style={styles.modelName} numberOfLines={2}>
            {model.id.split('-').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </Text>

          {/* Provider */}
          <View style={styles.providerBadge}>
            <Text style={styles.providerText}>{getProviderName(model.provider)}</Text>
          </View>

          {/* Stats */}
          <View style={styles.modelStats}>
            {model.contextWindow && (
              <View style={styles.statItem}>
                <Ionicons name="layers" size={14} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.statText}>{(model.contextWindow / 1000).toFixed(0)}K</Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Ionicons name="pricetag" size={14} color={model.color} />
              <Text style={[styles.statText, { color: model.color }]}>
                {getPricingDisplay()}
              </Text>
            </View>
          </View>

          {/* Status Dot */}
          <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />

          {/* Try Button */}
          <TouchableOpacity style={[styles.tryButton, { borderColor: model.color }]}>
            <Text style={[styles.tryButtonText, { color: model.color }]}>Try Model</Text>
            <Ionicons name="arrow-forward" size={14} color={model.color} />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TikTokColors.background
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: TikTokColors.background,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: TikTokColors.textSecondary,
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
  },
  header: {
    marginTop: 60,
    marginHorizontal: 16,
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    fontWeight: '600'
  },
  filterScroll: {
    marginBottom: 24
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    gap: 8
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600'
  },
  filterTextActive: {
    color: '#FFFFFF'
  },
  filterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(0, 242, 234, 0.3)'
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  modelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12
  },
  modelCard: {
    width: (width - 44) / 2,
    marginBottom: 12
  },
  modelGradient: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 240
  },
  modelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  modelLogo: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  modelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    minHeight: 40
  },
  providerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12
  },
  providerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600'
  },
  modelStats: {
    gap: 6,
    marginBottom: 12
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '600'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 16,
    right: 16
  },
  tryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
    marginTop: 8
  },
  tryButtonText: {
    fontSize: 13,
    fontWeight: '700'
  }
});
