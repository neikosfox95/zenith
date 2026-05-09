import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function AISettingsScreen() {
  const [autoAnalysis, setAutoAnalysis] = useState(true);
  const [realTimeInsights, setRealTimeInsights] = useState(true);
  const [autoReports, setAutoReports] = useState(false);
  const [predictiveMode, setPredictiveMode] = useState(true);

  const handleToggle = (setter: (val: boolean) => void, currentValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(!currentValue);
  };

  const settingsSections = [
    {
      title: 'AI Features',
      items: [
        { id: 'auto', label: 'Auto Analysis', desc: 'Automatically analyze streams after completion', value: autoAnalysis, setter: setAutoAnalysis, icon: 'analytics' },
        { id: 'realtime', label: 'Real-time Insights', desc: 'Get live suggestions during streams', value: realTimeInsights, setter: setRealTimeInsights, icon: 'flash' },
        { id: 'reports', label: 'Auto Reports', desc: 'Generate weekly performance reports', value: autoReports, setter: setAutoReports, icon: 'document-text' },
        { id: 'predict', label: 'Predictive Mode', desc: 'AI predictions for viewer behavior', value: predictiveMode, setter: setPredictiveMode, icon: 'trending-up' },
      ]
    },
  ];

  const modelPreferences = [
    { id: 'text', label: 'Text Analysis', model: 'GPT-5.2 Pro', color: '#10B981' },
    { id: 'vision', label: 'Visual Analysis', model: 'Gemini 3.0 Flash', color: TikTokTheme.colors.brand.cyan },
    { id: 'reasoning', label: 'Deep Reasoning', model: 'Claude 4.5 Opus', color: '#FE2C55' },
  ];

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
          <Animated.View entering={FadeIn} style={styles.settingsIcon}>
            <Ionicons name="settings" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            AI Settings
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Configure your AI experience
          </Animated.Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <Animated.View key={section.title} entering={FadeInDown.delay(300 + sectionIndex * 100)}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(350 + sectionIndex * 100 + itemIndex * 50)} style={styles.settingCard}>
                <BlurView intensity={40} style={styles.settingBlur}>
                  <View style={styles.settingContent}>
                    <View style={styles.settingIcon}>
                      <Ionicons name={item.icon as any} size={24} color={TikTokTheme.colors.brand.cyan} />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                      <Text style={styles.settingDesc}>{item.desc}</Text>
                    </View>
                    <Switch
                      value={item.value}
                      onValueChange={() => handleToggle(item.setter, item.value)}
                      trackColor={{ false: 'rgba(255,255,255,0.2)', true: TikTokTheme.colors.brand.cyan }}
                      thumbColor={item.value ? '#FFFFFF' : '#f4f3f4'}
                    />
                  </View>
                </BlurView>
              </Animated.View>
            ))}
          </Animated.View>
        ))}

        {/* Model Preferences */}
        <Animated.View entering={FadeInDown.delay(700)}>
          <Text style={styles.sectionTitle}>Default Models</Text>
        </Animated.View>

        {modelPreferences.map((pref, index) => (
          <Animated.View key={pref.id} entering={FadeInDown.delay(750 + index * 50)}>
            <TouchableOpacity 
              style={styles.modelCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <BlurView intensity={40} style={styles.modelBlur}>
                <View style={styles.modelContent}>
                  <View style={[styles.modelDot, { backgroundColor: pref.color }]} />
                  <View style={styles.modelInfo}>
                    <Text style={styles.modelLabel}>{pref.label}</Text>
                    <Text style={styles.modelName}>{pref.model}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={TikTokTheme.colors.text.muted} />
                </View>
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {/* Usage Stats */}
        <Animated.View entering={FadeInDown.delay(900)} style={styles.usageCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=400&q=80' }}
            style={styles.usageBackground}
            blurRadius={4}
          />
          <BlurView intensity={50} style={styles.usageBlur}>
            <LinearGradient
              colors={['rgba(0, 242, 234, 0.15)', 'rgba(168, 85, 247, 0.1)']}
              style={styles.usageContent}
            >
              <View style={styles.usageHeader}>
                <Ionicons name="stats-chart" size={28} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.usageTitle}>AI Usage This Month</Text>
              </View>
              <View style={styles.usageStats}>
                <View style={styles.usageStat}>
                  <Text style={styles.usageValue}>45.6K</Text>
                  <Text style={styles.usageLabel}>Requests</Text>
                </View>
                <View style={styles.usageDivider} />
                <View style={styles.usageStat}>
                  <Text style={styles.usageValue}>1.2s</Text>
                  <Text style={styles.usageLabel}>Avg Time</Text>
                </View>
                <View style={styles.usageDivider} />
                <View style={styles.usageStat}>
                  <Text style={styles.usageValue}>97.8%</Text>
                  <Text style={styles.usageLabel}>Accuracy</Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
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
  settingsIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12, marginTop: 8 },
  settingCard: { height: 80, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  settingBlur: { flex: 1 },
  settingContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  settingIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0, 242, 234, 0.1)', justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  settingDesc: { fontSize: 12, color: TikTokTheme.colors.text.secondary, lineHeight: 16 },
  modelCard: { height: 70, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  modelBlur: { flex: 1 },
  modelContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  modelDot: { width: 12, height: 12, borderRadius: 6 },
  modelInfo: { flex: 1 },
  modelLabel: { fontSize: 14, fontWeight: '600', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  modelName: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  usageCard: { height: 160, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginTop: 8, elevation: 4 },
  usageBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  usageBlur: { flex: 1 },
  usageContent: { flex: 1, padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.3)' },
  usageHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  usageTitle: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  usageStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  usageStat: { alignItems: 'center' },
  usageValue: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.brand.cyan, marginBottom: 4 },
  usageLabel: { fontSize: 11, color: TikTokTheme.colors.text.muted },
  usageDivider: { width: 1, height: 40, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
});