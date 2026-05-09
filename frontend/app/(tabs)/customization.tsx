import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function CustomizationScreen() {
  const [selectedTheme, setSelectedTheme] = useState('dark');
  
  const themes = [
    { id: 'dark', name: 'Dark Mode', color: '#0A0A0F', accent: TikTokTheme.colors.brand.cyan },
    { id: 'amoled', name: 'AMOLED', color: '#000000', accent: '#FFFFFF' },
    { id: 'purple', name: 'Purple Haze', color: '#1A0A2E', accent: '#A855F7' },
    { id: 'ocean', name: 'Ocean Blue', color: '#051937', accent: '#00B4D8' },
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
          <Animated.View entering={FadeIn} style={styles.paletteIcon}>
            <Ionicons name="color-palette" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Customization
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Personalize your experience
          </Animated.Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>Theme</Text>
        </Animated.View>

        <View style={styles.themesGrid}>
          {themes.map((theme, index) => (
            <Animated.View key={theme.id} entering={FadeInDown.delay(350 + index * 50)} style={styles.themeCardWrapper}>
              <TouchableOpacity
                style={[
                  styles.themeCard,
                  selectedTheme === theme.id && styles.themeCardActive
                ]}
                onPress={() => {
                  setSelectedTheme(theme.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <LinearGradient
                  colors={[theme.color, `${theme.color}CC`]}
                  style={styles.themeGradient}
                >
                  <View style={[styles.themeAccent, { backgroundColor: theme.accent }]} />
                  <Text style={styles.themeName}>{theme.name}</Text>
                  {selectedTheme === theme.id && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark-circle" size={24} color={theme.accent} />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(550)}>
          <Text style={styles.sectionTitle}>Layout Options</Text>
        </Animated.View>

        {[
          { icon: 'grid', label: 'Compact View', desc: 'Show more content' },
          { icon: 'list', label: 'Comfortable View', desc: 'Larger cards' },
          { icon: 'analytics', label: 'Data Dense', desc: 'Maximum info' },
        ].map((option, index) => (
          <Animated.View key={index} entering={FadeInDown.delay(600 + index * 50)} style={styles.optionCard}>
            <BlurView intensity={30} style={styles.optionBlur}>
              <View style={styles.optionContent}>
                <View style={styles.optionIcon}>
                  <Ionicons name={option.icon as any} size={24} color={TikTokTheme.colors.brand.cyan} />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDesc}>{option.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={TikTokTheme.colors.text.muted} />
              </View>
            </BlurView>
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
  paletteIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  themesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: TikTokTheme.spacing.base },
  themeCardWrapper: { width: '48%' },
  themeCard: { height: 140, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  themeCardActive: { borderColor: TikTokTheme.colors.brand.cyan },
  themeGradient: { flex: 1, padding: 12, justifyContent: 'space-between' },
  themeAccent: { width: 40, height: 4, borderRadius: 2 },
  themeName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  checkBadge: { position: 'absolute', top: 8, right: 8 },
  optionCard: { height: 70, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  optionBlur: { flex: 1 },
  optionContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  optionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0, 242, 234, 0.1)', justifyContent: 'center', alignItems: 'center' },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  optionDesc: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
});