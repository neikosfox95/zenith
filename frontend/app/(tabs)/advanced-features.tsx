import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function AdvancedFeaturesScreen() {
  const features = [
    { icon: 'rocket', title: 'Voice Commands', desc: 'Control app with voice', color: TikTokTheme.colors.brand.cyan },
    { icon: 'videocam', title: 'Multi-Stream', desc: 'Stream to 5+ platforms', color: '#FE2C55' },
    { icon: 'cloud-upload', title: 'Cloud Recording', desc: 'Automatic backups', color: '#10B981' },
    { icon: 'shield-checkmark', title: 'Advanced Security', desc: '2FA & encryption', color: '#FFD700' },
    { icon: 'bar-chart', title: 'Deep Analytics', desc: 'AI-powered insights', color: '#A855F7' },
    { icon: 'planet', title: 'Global CDN', desc: 'Ultra-low latency', color: '#3B82F6' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.rocketIcon}>
            <Ionicons name="rocket" size={36} color="#FFD700" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Advanced Features
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Zenith Grade capabilities
          </Animated.Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(300)} style={styles.banner}>
          <BlurView intensity={50} style={styles.bannerBlur}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)']}
              style={styles.bannerContent}
            >
              <Ionicons name="star" size={28} color="#FFD700" />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Zenith Grade Access</Text>
                <Text style={styles.bannerDesc}>All premium features unlocked</Text>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(400 + index * 50)} style={styles.featureCardWrapper}>
              <TouchableOpacity style={styles.featureCard}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
                  style={styles.featureBackground}
                  blurRadius={5}
                />
                <BlurView intensity={50} style={styles.featureBlur}>
                  <LinearGradient
                    colors={[`${feature.color}15`, `${feature.color}05`]}
                    style={styles.featureContent}
                  >
                    <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                      <Ionicons name={feature.icon as any} size={32} color={feature.color} />
                    </View>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDesc}>{feature.desc}</Text>
                  </LinearGradient>
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
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
  rocketIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255, 215, 0, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#FFD700' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#FFD700' },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  banner: { height: 90, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 6 },
  bannerBlur: { flex: 1 },
  bannerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 16, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)' },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 18, fontWeight: '900', color: '#FFD700', marginBottom: 4 },
  bannerDesc: { fontSize: 13, color: TikTokTheme.colors.text.secondary },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCardWrapper: { width: '48%' },
  featureCard: { height: 160, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  featureBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featureBlur: { flex: 1 },
  featureContent: { flex: 1, padding: 12, justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  featureIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  featureTitle: { fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.text.primary, textAlign: 'center' },
  featureDesc: { fontSize: 11, color: TikTokTheme.colors.text.secondary, textAlign: 'center' },
});