import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function ScheduleCreatorScreen() {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('Gaming');
  const [duration, setDuration] = useState('60');
  const [date, setDate] = useState('');

  const topics = ['Gaming', 'Community', 'Business', 'Entertainment', 'Education', 'Music'];
  const durations = ['30', '60', '90', '120', '180'];

  const handleSchedule = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Schedule logic here
  };

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
          <Animated.View entering={FadeIn} style={styles.addIcon}>
            <Ionicons name="add-circle" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Schedule New Stream
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Plan your next live session
          </Animated.Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stream Title */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.label}>Stream Title</Text>
          <BlurView intensity={40} style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter stream title..."
              placeholderTextColor={TikTokTheme.colors.text.muted}
              value={title}
              onChangeText={setTitle}
            />
          </BlurView>
        </Animated.View>

        {/* Topic Selection */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.label}>Topic</Text>
          <View style={styles.topicsGrid}>
            {topics.map((t, index) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.topicChip,
                  topic === t && styles.topicChipActive
                ]}
                onPress={() => {
                  setTopic(t);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[
                  styles.topicText,
                  topic === t && styles.topicTextActive
                ]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Duration */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.label}>Duration (minutes)</Text>
          <View style={styles.durationRow}>
            {durations.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.durationChip,
                  duration === d && styles.durationChipActive
                ]}
                onPress={() => {
                  setDuration(d);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[
                  styles.durationText,
                  duration === d && styles.durationTextActive
                ]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Date/Time Placeholder */}
        <Animated.View entering={FadeInDown.delay(600)}>
          <Text style={styles.label}>Date & Time</Text>
          <BlurView intensity={40} style={styles.dateWrapper}>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            >
              <Ionicons name="calendar-outline" size={24} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.dateText}>Select date & time</Text>
              <Ionicons name="chevron-forward" size={20} color={TikTokTheme.colors.text.muted} />
            </TouchableOpacity>
          </BlurView>
        </Animated.View>

        {/* Expected Viewers */}
        <Animated.View entering={FadeInDown.delay(700)}>
          <BlurView intensity={30} style={styles.infoCard}>
            <LinearGradient
              colors={['rgba(0, 242, 234, 0.1)', 'rgba(0, 242, 234, 0.05)']}
              style={styles.infoContent}
            >
              <Ionicons name="information-circle" size={24} color={TikTokTheme.colors.brand.cyan} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>AI Prediction</Text>
                <Text style={styles.infoText}>Expected 1.2K viewers based on your schedule history</Text>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Schedule Button */}
        <Animated.View entering={FadeInDown.delay(800)}>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={handleSchedule}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[TikTokTheme.colors.brand.cyan, TikTokTheme.colors.brand.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scheduleGradient}
            >
              <Ionicons name="calendar" size={24} color="#FFFFFF" />
              <Text style={styles.scheduleButtonText}>Schedule Stream</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  addIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  label: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12, marginTop: 8 },
  inputWrapper: { height: 56, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  input: { flex: 1, paddingHorizontal: 16, fontSize: 16, color: TikTokTheme.colors.text.primary },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  topicChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  topicChipActive: { backgroundColor: 'rgba(0, 242, 234, 0.2)', borderColor: TikTokTheme.colors.brand.cyan },
  topicText: { fontSize: 14, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  topicTextActive: { color: TikTokTheme.colors.brand.cyan, fontWeight: '700' },
  durationRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  durationChip: { flex: 1, height: 50, borderRadius: TikTokTheme.borderRadius.md, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  durationChipActive: { backgroundColor: 'rgba(254, 44, 85, 0.2)', borderColor: TikTokTheme.colors.brand.pink },
  durationText: { fontSize: 16, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  durationTextActive: { color: TikTokTheme.colors.brand.pink, fontWeight: '900' },
  dateWrapper: { height: 60, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  dateButton: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  dateText: { flex: 1, fontSize: 16, color: TikTokTheme.colors.text.secondary },
  infoCard: { borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 24 },
  infoContent: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.brand.cyan, marginBottom: 4 },
  infoText: { fontSize: 12, color: TikTokTheme.colors.text.secondary, lineHeight: 18 },
  scheduleButton: { height: 60, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 6 },
  scheduleGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  scheduleButtonText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
});