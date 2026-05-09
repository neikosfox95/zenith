import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function AutomationScreen() {
  const [autoStream, setAutoStream] = useState(true);
  const [autoClip, setAutoClip] = useState(false);
  const [autoPost, setAutoPost] = useState(true);

  const handleToggle = (setter: (val: boolean) => void, currentValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(!currentValue);
  };

  const automations = [
    {
      id: 'stream',
      title: 'Auto-Start Streams',
      desc: 'Automatically start scheduled streams',
      value: autoStream,
      setter: setAutoStream,
      icon: 'play-circle',
      color: TikTokTheme.colors.brand.cyan
    },
    {
      id: 'clip',
      title: 'Auto-Clip Highlights',
      desc: 'AI creates highlight clips from streams',
      value: autoClip,
      setter: setAutoClip,
      icon: 'cut',
      color: '#FE2C55'
    },
    {
      id: 'post',
      title: 'Auto-Post to Social',
      desc: 'Share clips to other platforms',
      value: autoPost,
      setter: setAutoPost,
      icon: 'share-social',
      color: '#10B981'
    },
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
          <Animated.View entering={FadeIn} style={styles.robotIcon}>
            <Ionicons name="construct" size={36} color="#A855F7" />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Automation
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Work smarter, not harder
          </Animated.Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Active Automations</Text>
        </Animated.View>

        {automations.map((auto, index) => (
          <Animated.View key={auto.id} entering={FadeInDown.delay(350 + index * 50)} style={styles.autoCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
              style={styles.autoBackground}
              blurRadius={5}
            />
            <BlurView intensity={50} style={styles.autoBlur}>
              <LinearGradient
                colors={[`${auto.color}10`, `${auto.color}03`]}
                style={styles.autoContent}
              >
                <View style={[styles.autoIcon, { backgroundColor: `${auto.color}20` }]}>
                  <Ionicons name={auto.icon as any} size={28} color={auto.color} />
                </View>
                <View style={styles.autoInfo}>
                  <Text style={styles.autoTitle}>{auto.title}</Text>
                  <Text style={styles.autoDesc}>{auto.desc}</Text>
                </View>
                <Switch
                  value={auto.value}
                  onValueChange={() => handleToggle(auto.setter, auto.value)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: auto.color }}
                  thumbColor={auto.value ? '#FFFFFF' : '#f4f3f4'}
                />
              </LinearGradient>
            </BlurView>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Workflows</Text>
        </Animated.View>

        {[
          { icon: 'flash', label: 'Quick Start', desc: '5 automations', color: TikTokTheme.colors.brand.cyan },
          { icon: 'star', label: 'Pro Creator', desc: '12 automations', color: '#FFD700' },
        ].map((workflow, index) => (
          <Animated.View key={index} entering={FadeInDown.delay(550 + index * 50)}>
            <TouchableOpacity style={styles.workflowCard}>
              <BlurView intensity={40} style={styles.workflowBlur}>
                <View style={styles.workflowContent}>
                  <View style={[styles.workflowIcon, { backgroundColor: `${workflow.color}20` }]}>
                    <Ionicons name={workflow.icon as any} size={24} color={workflow.color} />
                  </View>
                  <View style={styles.workflowInfo}>
                    <Text style={styles.workflowLabel}>{workflow.label}</Text>
                    <Text style={styles.workflowDesc}>{workflow.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={TikTokTheme.colors.text.muted} />
                </View>
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
  robotIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(168, 85, 247, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#A855F7' },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  autoCard: { borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  autoBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  autoBlur: { flex: 1 },
  autoContent: { flexDirection: 'row', alignItems: 'center', padding: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  autoIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  autoInfo: { flex: 1 },
  autoTitle: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  autoDesc: { fontSize: 12, color: TikTokTheme.colors.text.secondary, lineHeight: 16 },
  workflowCard: { height: 80, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  workflowBlur: { flex: 1 },
  workflowContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  workflowIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  workflowInfo: { flex: 1 },
  workflowLabel: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  workflowDesc: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
});