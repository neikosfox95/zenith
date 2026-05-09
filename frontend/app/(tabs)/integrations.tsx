import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function IntegrationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const [integrations] = useState([
    { id: 1, name: 'YouTube', connected: true, icon: 'logo-youtube', color: '#FF0000' },
    { id: 2, name: 'Instagram', connected: true, icon: 'logo-instagram', color: '#E1306C' },
    { id: 3, name: 'Twitter', connected: false, icon: 'logo-twitter', color: '#1DA1F2' },
    { id: 4, name: 'Discord', connected: true, icon: 'logo-discord', color: '#5865F2' },
    { id: 5, name: 'Twitch', connected: false, icon: 'logo-twitch', color: '#9146FF' },
    { id: 6, name: 'Spotify', connected: false, icon: 'musical-notes', color: '#1DB954' },
  ]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
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
          <Animated.View entering={FadeIn} style={styles.linkIcon}>
            <Ionicons name="link" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Integrations
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {integrations.filter(i => i.connected).length} connected
          </Animated.Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TikTokTheme.colors.brand.cyan} colors={[TikTokTheme.colors.brand.cyan]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Connected Services</Text>
        </Animated.View>

        {integrations.map((integration, index) => (
          <Animated.View key={integration.id} entering={FadeInDown.delay(350 + index * 50)}>
            <TouchableOpacity 
              style={styles.integrationCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <BlurView intensity={40} style={styles.integrationBlur}>
                <LinearGradient
                  colors={integration.connected ? [`${integration.color}15`, `${integration.color}05`] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                  style={styles.integrationContent}
                >
                  <View style={[styles.integrationIcon, { backgroundColor: `${integration.color}20` }]}>
                    <Ionicons name={integration.icon as any} size={28} color={integration.color} />
                  </View>
                  <View style={styles.integrationInfo}>
                    <Text style={styles.integrationName}>{integration.name}</Text>
                    <Text style={[styles.integrationStatus, { color: integration.connected ? '#10B981' : TikTokTheme.colors.text.muted }]}>
                      {integration.connected ? 'Connected' : 'Not connected'}
                    </Text>
                  </View>
                  {integration.connected ? (
                    <View style={styles.connectedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.connectButton}>
                      <Text style={styles.connectText}>Connect</Text>
                    </TouchableOpacity>
                  )}
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
  linkIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  integrationCard: { height: 90, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  integrationBlur: { flex: 1 },
  integrationContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  integrationIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  integrationInfo: { flex: 1 },
  integrationName: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  integrationStatus: { fontSize: 12, fontWeight: '600' },
  connectedBadge: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  connectButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(0, 242, 234, 0.2)', borderWidth: 1, borderColor: TikTokTheme.colors.brand.cyan },
  connectText: { fontSize: 13, fontWeight: '700', color: TikTokTheme.colors.brand.cyan },
});