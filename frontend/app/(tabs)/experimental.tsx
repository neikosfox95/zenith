import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function ExperimentalScreen() {
  const experiments = [
    { id: 1, title: 'Neural Stream Prediction', desc: 'AI predicts optimal stream times', status: 'beta', icon: 'flask', color: '#A855F7' },
    { id: 2, title: 'Quantum Analytics', desc: 'Next-gen performance metrics', status: 'alpha', icon: 'atom', color: TikTokTheme.colors.brand.cyan },
    { id: 3, title: 'Holographic UI', desc: '3D interface elements', status: 'concept', icon: 'cube', color: '#FE2C55' },
    { id: 4, title: 'Blockchain Rewards', desc: 'Crypto gifts & NFTs', status: 'beta', icon: 'logo-bitcoin', color: '#FFD700' },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'beta') return '#10B981';
    if (status === 'alpha') return '#F59E0B';
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
          <Animated.View entering={FadeIn} style={styles.flaskIcon}>
            <Ionicons name="flask" size={36} color="#A855F7" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Experimental
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Future features preview
          </Animated.Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(300)} style={styles.warning}>
          <BlurView intensity={40} style={styles.warningBlur}>
            <View style={styles.warningContent}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>Experimental features may be unstable</Text>
            </View>
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Available Experiments</Text>
        </Animated.View>

        {experiments.map((exp, index) => (
          <Animated.View key={exp.id} entering={FadeInDown.delay(450 + index * 50)}>
            <TouchableOpacity 
              style={styles.experimentCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=400&q=80' }}
                style={styles.experimentBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.experimentBlur}>
                <LinearGradient
                  colors={[`${exp.color}15`, `${exp.color}05`]}
                  style={styles.experimentContent}
                >
                  <View style={[styles.experimentIcon, { backgroundColor: `${exp.color}20` }]}>
                    <Ionicons name={exp.icon as any} size={32} color={exp.color} />
                  </View>
                  <View style={styles.experimentInfo}>
                    <View style={styles.experimentHeader}>
                      <Text style={styles.experimentTitle}>{exp.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(exp.status)}20` }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(exp.status) }]}>{exp.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.experimentDesc}>{exp.desc}</Text>
                  </View>
                  <TouchableOpacity style={[styles.tryButton, { backgroundColor: `${exp.color}30`, borderColor: exp.color }]}>
                    <Text style={[styles.tryText, { color: exp.color }]}>Try</Text>
                  </TouchableOpacity>
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
  flaskIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(168, 85, 247, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#A855F7' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  warning: { height: 50, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base },
  warningBlur: { flex: 1 },
  warningContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)' },
  warningText: { fontSize: 13, fontWeight: '600', color: '#F59E0B' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  experimentCard: { borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  experimentBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  experimentBlur: { flex: 1 },
  experimentContent: { flexDirection: 'row', alignItems: 'center', padding: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  experimentIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  experimentInfo: { flex: 1 },
  experimentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  experimentTitle: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: '900' },
  experimentDesc: { fontSize: 13, color: TikTokTheme.colors.text.secondary, lineHeight: 18 },
  tryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5 },
  tryText: { fontSize: 13, fontWeight: '900' },
});