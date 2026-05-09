import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

const { width } = Dimensions.get('window');

export default function StreamScheduleScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduledStreams] = useState([
    {
      id: 1,
      title: 'Evening Gaming Session',
      date: new Date(2026, 4, 10, 19, 0),
      duration: 120,
      status: 'scheduled',
      topic: 'Gaming',
      expectedViewers: 1200,
      color: '#00F2EA'
    },
    {
      id: 2,
      title: 'Q&A with Fans',
      date: new Date(2026, 4, 11, 15, 0),
      duration: 60,
      status: 'scheduled',
      topic: 'Community',
      expectedViewers: 850,
      color: '#FE2C55'
    },
    {
      id: 3,
      title: 'Product Launch Event',
      date: new Date(2026, 4, 12, 20, 0),
      duration: 90,
      status: 'scheduled',
      topic: 'Business',
      expectedViewers: 2400,
      color: '#FFD700'
    },
    {
      id: 4,
      title: 'Weekend Special Stream',
      date: new Date(2026, 4, 13, 18, 0),
      duration: 180,
      status: 'pending',
      topic: 'Entertainment',
      expectedViewers: 1800,
      color: '#A855F7'
    },
  ]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    if (status === 'scheduled') return '#10B981';
    if (status === 'pending') return '#F59E0B';
    return TikTokTheme.colors.text.muted;
  };

  const upcomingCount = scheduledStreams.filter(s => s.status === 'scheduled').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.calendarIcon}>
            <Ionicons name="calendar" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Stream Schedule
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {upcomingCount} upcoming streams
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
        {/* Stats Overview */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsCard}>
          <BlurView intensity={50} style={styles.statsBlur}>
            <LinearGradient
              colors={['rgba(0, 242, 234, 0.15)', 'rgba(254, 44, 85, 0.1)']}
              style={styles.statsContent}
            >
              <View style={styles.stat}>
                <Ionicons name="calendar-outline" size={24} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.statValue}>{scheduledStreams.length}</Text>
                <Text style={styles.statLabel}>Total Scheduled</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Ionicons name="people-outline" size={24} color={TikTokTheme.colors.brand.pink} />
                <Text style={styles.statValue}>{formatNumber(scheduledStreams.reduce((sum, s) => sum + s.expectedViewers, 0))}</Text>
                <Text style={styles.statLabel}>Expected Viewers</Text>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <LinearGradient
              colors={['rgba(0, 242, 234, 0.3)', 'rgba(0, 242, 234, 0.1)']}
              style={styles.actionGradient}
            >
              <Ionicons name="add-circle" size={28} color={TikTokTheme.colors.brand.cyan} />
              <Text style={styles.actionText}>Schedule New</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <LinearGradient
              colors={['rgba(254, 44, 85, 0.3)', 'rgba(254, 44, 85, 0.1)']}
              style={styles.actionGradient}
            >
              <Ionicons name="time" size={28} color={TikTokTheme.colors.brand.pink} />
              <Text style={styles.actionText}>Best Times</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Scheduled Streams */}
        <Animated.View entering={FadeInDown.delay(500)}>
          <Text style={styles.sectionTitle}>Upcoming Streams</Text>
        </Animated.View>

        {scheduledStreams.map((stream, index) => (
          <Animated.View key={stream.id} entering={FadeInDown.delay(550 + index * 50)}>
            <TouchableOpacity 
              style={styles.streamCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1604941878418-b0fbf86e3590?w=400&q=80' }}
                style={styles.streamBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.streamBlur}>
                <View style={styles.streamContent}>
                  <View style={[styles.streamIndicator, { backgroundColor: stream.color }]} />
                  
                  <View style={styles.streamInfo}>
                    <Text style={styles.streamTitle}>{stream.title}</Text>
                    <View style={styles.streamMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={14} color={TikTokTheme.colors.text.secondary} />
                        <Text style={styles.metaText}>{formatDate(stream.date)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={TikTokTheme.colors.text.secondary} />
                        <Text style={styles.metaText}>{stream.duration} min</Text>
                      </View>
                    </View>
                    <View style={styles.streamFooter}>
                      <View style={styles.topicBadge}>
                        <Text style={styles.topicText}>{stream.topic}</Text>
                      </View>
                      <View style={styles.viewersBadge}>
                        <Ionicons name="eye-outline" size={12} color={TikTokTheme.colors.brand.cyan} />
                        <Text style={styles.viewersText}>{formatNumber(stream.expectedViewers)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(stream.status)}20` }]}>
                    <Ionicons 
                      name={stream.status === 'scheduled' ? 'checkmark-circle' : 'time'} 
                      size={16} 
                      color={getStatusColor(stream.status)} 
                    />
                  </View>
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
  calendarIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  statsCard: { height: 100, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  statsBlur: { flex: 1 },
  statsContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 12, color: TikTokTheme.colors.text.muted },
  statDivider: { width: 1, height: 50, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  actionsRow: { flexDirection: 'row', gap: TikTokTheme.spacing.base, marginBottom: TikTokTheme.spacing.base },
  actionButton: { flex: 1, height: 80, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 2 },
  actionGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionText: { fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  streamCard: { height: 140, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  streamBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  streamBlur: { flex: 1 },
  streamContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', gap: 12 },
  streamIndicator: { width: 4, height: 80, borderRadius: 2 },
  streamInfo: { flex: 1 },
  streamTitle: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 8 },
  streamMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  streamFooter: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  topicBadge: { backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  topicText: { fontSize: 11, color: TikTokTheme.colors.text.secondary, fontWeight: '600' },
  viewersBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewersText: { fontSize: 11, color: TikTokTheme.colors.brand.cyan, fontWeight: '700' },
  statusBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});