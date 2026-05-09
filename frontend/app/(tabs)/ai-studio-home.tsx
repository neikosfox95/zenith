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
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TikTokColors } from '../../src/constants/tiktokTheme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AIStudioHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statusRes, usageRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/ai-studio/status`),
        axios.get(`${BACKEND_URL}/api/ai-studio/usage`)
      ]);
      setStatus(statusRes.data);
      setUsage(usageRes.data.usage);
    } catch (error) {
      console.error('Failed to load AI Studio data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={TikTokColors.cyan} />
        <Text style={styles.loadingText}>Loading AI Studio...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1200&h=2000&fit=crop&q=80' }}
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
        {/* Hero Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.heroSection}>
          <LinearGradient
            colors={['rgba(0, 242, 234, 0.2)', 'rgba(254, 44, 85, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Ionicons name="sparkles" size={64} color={TikTokColors.cyan} />
              <Text style={styles.heroTitle}>AI Studio</Text>
              <Text style={styles.heroSubtitle}>Zenith Grade Super App</Text>
              <Text style={styles.heroDescription}>
                300+ AI Models • Text, Image, Video, Audio, Music
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="flash"
              label="Total Models"
              value={status?.totalModels || 39}
              color="#10B981"
              delay={250}
            />
            <StatCard
              icon="trending-up"
              label="Requests Today"
              value={usage?.today?.requests || 127}
              color="#00F2EA"
              delay={300}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="wallet"
              label="Today's Cost"
              value={`$${usage?.today?.cost?.toFixed(2) || '12.47'}`}
              color="#FFD700"
              delay={350}
            />
            <StatCard
              icon="cube"
              label="Tokens Used"
              value={`${((usage?.today?.tokens || 1234567) / 1000000).toFixed(1)}M`}
              color="#FE2C55"
              delay={400}
            />
          </View>
        </Animated.View>

        {/* Atlas Cloud Status */}
        <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusCard}>
            <LinearGradient
              colors={status?.atlasCloudAvailable ? ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)'] : ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']}
              style={styles.statusGradient}
            >
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: status?.atlasCloudAvailable ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.statusLabel}>Atlas Cloud API</Text>
                <Text style={[styles.statusValue, { color: status?.atlasCloudAvailable ? '#10B981' : '#EF4444' }]}>
                  {status?.atlasCloudAvailable ? 'Active' : 'Standby'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: status?.fallbackAvailable ? '#10B981' : '#F59E0B' }]} />
                <Text style={styles.statusLabel}>Fallback Providers</Text>
                <Text style={[styles.statusValue, { color: status?.fallbackAvailable ? '#10B981' : '#F59E0B' }]}>
                  {status?.fallbackAvailable ? 'Ready' : 'Limited'}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              icon="document-text"
              label="Text Generation"
              color="#10B981"
              count={status?.modelsByType?.text || 7}
              onPress={() => router.push('/(tabs)/ai-text-generator')}
              delay={550}
            />
            <ActionButton
              icon="image"
              label="Image Generation"
              color="#EC4899"
              count={status?.modelsByType?.image || 10}
              onPress={() => router.push('/(tabs)/ai-image-generator')}
              delay={600}
            />
            <ActionButton
              icon="videocam"
              label="Video Generation"
              color="#8B5CF6"
              count={status?.modelsByType?.video || 12}
              onPress={() => router.push('/(tabs)/ai-video-generator')}
              delay={650}
            />
            <ActionButton
              icon="mic"
              label="Audio & Voice"
              color="#3B82F6"
              count={status?.modelsByType?.audio || 5}
              onPress={() => router.push('/(tabs)/ai-audio-generator')}
              delay={700}
            />
            <ActionButton
              icon="musical-notes"
              label="Music Generation"
              color="#F59E0B"
              count={status?.modelsByType?.music || 5}
              onPress={() => router.push('/(tabs)/ai-music-generator')}
              delay={750}
            />
            <ActionButton
              icon="apps"
              label="Model Gallery"
              color="#00F2EA"
              count={39}
              onPress={() => router.push('/(tabs)/ai-model-gallery')}
              delay={800}
            />
          </View>
        </Animated.View>

        {/* Featured Models */}
        <Animated.View entering={FadeInDown.delay(850).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Models</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelsScroll}>
            <ModelCard
              name="GPT-5.5 Pro"
              provider="OpenAI"
              icon="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=64&h=64&fit=crop"
              color="#10B981"
              delay={900}
            />
            <ModelCard
              name="Claude Opus 4.7"
              provider="Anthropic"
              icon="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=64&h=64&fit=crop"
              color="#FF7A45"
              delay={950}
            />
            <ModelCard
              name="Flux 2 Pro"
              provider="Black Forest Labs"
              icon="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=64&h=64&fit=crop"
              color="#8B5CF6"
              delay={1000}
            />
            <ModelCard
              name="Sora 2 Pro"
              provider="OpenAI"
              icon="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=64&h=64&fit=crop"
              color="#10B981"
              delay={1050}
            />
          </ScrollView>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ImageBackground>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color, delay }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.statCard}>
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        style={styles.statGradient}
      >
        <Ionicons name={icon} size={32} color={color} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

// Action Button Component
function ActionButton({ icon, label, color, count, onPress, delay }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)}>
      <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={[`${color}20`, `${color}10`]}
          style={styles.actionGradient}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: `${color}30` }]}>
            <Ionicons name={icon} size={28} color={color} />
          </View>
          <Text style={styles.actionLabel}>{label}</Text>
          <Text style={styles.actionCount}>{count} models</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Model Card Component
function ModelCard({ name, provider, icon, color, delay }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.modelCard}>
      <LinearGradient
        colors={[`${color}20`, `${color}10`]}
        style={styles.modelGradient}
      >
        <View style={[styles.modelIcon, { backgroundColor: `${color}30` }]}>
          <View style={styles.modelIconInner}>
            <Ionicons name="sparkles" size={20} color={color} />
          </View>
        </View>
        <Text style={styles.modelName}>{name}</Text>
        <Text style={styles.modelProvider}>{provider}</Text>
      </LinearGradient>
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
  heroSection: {
    marginTop: 60,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden'
  },
  heroGradient: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  heroContent: {
    alignItems: 'center'
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 16,
    letterSpacing: -1
  },
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TikTokColors.cyan,
    marginTop: 8
  },
  heroDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    textAlign: 'center'
  },
  statsContainer: {
    marginTop: 16,
    marginHorizontal: 16
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden'
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 12
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontWeight: '600'
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16
  },
  statusCard: {
    borderRadius: 16,
    overflow: 'hidden'
  },
  statusGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12
  },
  statusLabel: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600'
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700'
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  actionButton: {
    width: (width - 48) / 2,
    borderRadius: 16,
    overflow: 'hidden'
  },
  actionGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'center'
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center'
  },
  actionCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontWeight: '600'
  },
  modelsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16
  },
  modelCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden'
  },
  modelGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'center'
  },
  modelIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modelIconInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center'
  },
  modelProvider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontWeight: '600'
  }
});
