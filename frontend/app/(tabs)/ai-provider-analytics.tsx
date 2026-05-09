import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TikTokColors } from '../../src/constants/tiktokTheme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';

const { width } = Dimensions.get('window');
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AIProviderAnalytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/ai-studio/v2/provider-analytics`);
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Failed to load provider analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const resetAnalytics = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/ai-studio/v2/provider-analytics/reset`);
      loadData();
    } catch (error) {
      console.error('Failed to reset analytics:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={TikTokColors.cyan} />
        <Text style={styles.loadingText}>Loading Provider Analytics...</Text>
      </View>
    );
  }

  const { total, byProvider, recentRequests } = analytics || {};

  return (
    <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=2000&fit=crop&q=80' }} style={styles.container} blurRadius={3}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TikTokColors.cyan} />}>
        
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Provider Analytics</Text>
              <Text style={styles.headerSubtitle}>Real-Time Cost Tracking</Text>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={resetAnalytics}>
              <Ionicons name=\"refresh\" size={24} color=\"#FF6B6B\" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Total Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.heroCard}>
          <LinearGradient colors={['rgba(0, 242, 234, 0.3)', 'rgba(254, 44, 85, 0.3)']} style={styles.heroGradient}>
            <Text style={styles.heroLabel}>Total Requests</Text>
            <Text style={styles.heroValue}>{total?.requests || 0}</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>${(total?.cost || 0).toFixed(4)}</Text>
                <Text style={styles.heroStatLabel}>Total Cost</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{((total?.tokens || 0) / 1000).toFixed(1)}K</Text>
                <Text style={styles.heroStatLabel}>Tokens Used</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Provider Breakdown */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Provider Breakdown</Text>
          
          {/* Emergent Primary */}
          <ProviderCard provider=\"emergent\" data={byProvider?.emergent} color=\"#10B981\" delay={350} />
          
          {/* Atlas Backup */}
          <ProviderCard provider=\"atlas\" data={byProvider?.atlas} color=\"#3B82F6\" delay={400} />
          
          {/* Mock Fallback */}
          <ProviderCard provider=\"mock\" data={byProvider?.mock} color=\"#6B7280\" delay={450} />
        </Animated.View>

        {/* Recent Requests */}
        <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          {recentRequests?.slice(0, 10).map((req: any, index: number) => (
            <RequestCard key={req.id} request={req} delay={550 + index * 30} />
          ))}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ImageBackground>
  );
}

function ProviderCard({ provider, data, color, delay }: any) {
  const getProviderName = (p: string) => {
    if (p === 'emergent') return 'Emergent LLM Key';
    if (p === 'atlas') return 'Atlas Cloud';
    return 'Mock Mode';
  };

  const getIcon = (p: string) => {
    if (p === 'emergent') return 'shield-checkmark';
    if (p === 'atlas') return 'cloud';
    return 'alert-circle';
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.providerCard}>
      <LinearGradient colors={[`${color}20`, `${color}10`]} style={styles.providerGradient}>
        <View style={styles.providerHeader}>
          <View style={styles.providerLeft}>
            <View style={[styles.providerIcon, { backgroundColor: `${color}30` }]}>
              <Ionicons name={getIcon(provider) as any} size={24} color={color} />
            </View>
            <View>
              <Text style={styles.providerName}>{getProviderName(provider)}</Text>
              <Text style={styles.providerSubtitle}>{provider === 'emergent' ? 'PRIMARY' : provider === 'atlas' ? 'BACKUP' : 'FALLBACK'}</Text>
            </View>
          </View>
          <View style={[styles.providerBadge, { backgroundColor: `${color}30` }]}>
            <Text style={[styles.providerPercentage, { color }]}>{data?.percentage || 0}%</Text>
          </View>
        </View>
        
        <View style={styles.providerStats}>
          <View style={styles.providerStat}>
            <Text style={styles.providerStatValue}>{data?.requests || 0}</Text>
            <Text style={styles.providerStatLabel}>Requests</Text>
          </View>
          <View style={styles.providerStat}>
            <Text style={styles.providerStatValue}>${(data?.cost || 0).toFixed(4)}</Text>
            <Text style={styles.providerStatLabel}>Cost</Text>
          </View>
          <View style={styles.providerStat}>
            <Text style={styles.providerStatValue}>{data?.success || 0}</Text>
            <Text style={styles.providerStatLabel}>Success</Text>
          </View>
          <View style={styles.providerStat}>
            <Text style={styles.providerStatValue}>{data?.failed || 0}</Text>
            <Text style={styles.providerStatLabel}>Failed</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function RequestCard({ request, delay }: any) {
  const getProviderColor = (source: string) => {
    if (source === 'emergent-primary') return '#10B981';
    if (source?.includes('atlas')) return '#3B82F6';
    return '#6B7280';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'text') return 'document-text';
    if (type === 'image') return 'image';
    if (type === 'video') return 'videocam';
    if (type === 'audio') return 'mic';
    return 'musical-notes';
  };

  const color = getProviderColor(request.source);

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.requestCard}>
      <LinearGradient colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']} style={styles.requestGradient}>
        <View style={styles.requestHeader}>
          <View style={[styles.requestIcon, { backgroundColor: `${color}30` }]}>
            <Ionicons name={getTypeIcon(request.type) as any} size={16} color={color} />
          </View>
          <View style={styles.requestInfo}>
            <Text style={styles.requestModel}>{request.model}</Text>
            <Text style={styles.requestSource}>{request.source}</Text>
          </View>
          <Text style={[styles.requestCost, { color }]}>${(request.cost || 0).toFixed(4)}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokColors.background },
  loadingContainer: { flex: 1, backgroundColor: TikTokColors.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: TikTokColors.textSecondary, fontSize: 16, marginTop: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
  header: { marginTop: 60, marginHorizontal: 16, marginBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', marginTop: 4, fontWeight: '600' },
  resetButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 107, 107, 0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.3)' },
  heroCard: { marginHorizontal: 16, marginBottom: 24, borderRadius: 24, overflow: 'hidden' },
  heroGradient: { padding: 32, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 24, alignItems: 'center' },
  heroLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600', marginBottom: 8 },
  heroValue: { fontSize: 56, fontWeight: '900', color: '#FFFFFF' },
  heroStats: { flexDirection: 'row', gap: 32, marginTop: 24 },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  heroStatLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginTop: 4 },
  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 16 },
  providerCard: { marginBottom: 16, borderRadius: 20, overflow: 'hidden' },
  providerGradient: { padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 20 },
  providerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  providerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  providerIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  providerName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  providerSubtitle: { fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2, fontWeight: '600' },
  providerBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  providerPercentage: { fontSize: 16, fontWeight: '900' },
  providerStats: { flexDirection: 'row', justifyContent: 'space-around' },
  providerStat: { alignItems: 'center' },
  providerStatValue: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  providerStatLabel: { fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', marginTop: 4 },
  requestCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  requestGradient: { padding: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  requestInfo: { flex: 1 },
  requestModel: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  requestSource: { fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 },
  requestCost: { fontSize: 14, fontWeight: '700' }
});
