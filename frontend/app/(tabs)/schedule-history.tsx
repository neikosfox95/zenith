import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function ScheduleHistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [pastStreams] = useState([
    {
      id: 1,
      title: 'Friday Night Gaming',
      date: new Date(2026, 4, 3, 20, 0),
      duration: 180,
      actualViewers: 1543,
      peakViewers: 1892,
      revenue: 23400,
      status: 'completed',
      rating: 4.8
    },
    {
      id: 2,
      title: 'Mid-Week Q&A',
      date: new Date(2026, 4, 1, 15, 30),
      duration: 60,
      actualViewers: 934,
      peakViewers: 1156,
      revenue: 8900,
      status: 'completed',
      rating: 4.6
    },
    {
      id: 3,
      title: 'Product Demo Stream',
      date: new Date(2026, 3, 28, 19, 0),
      duration: 90,
      actualViewers: 2134,
      peakViewers: 2567,
      revenue: 34500,
      status: 'completed',
      rating: 4.9
    },
    {
      id: 4,
      title: 'Weekend Special',
      date: new Date(2026, 3, 26, 18, 0),
      duration: 120,
      actualViewers: 1678,
      peakViewers: 2012,
      revenue: 19800,
      status: 'completed',
      rating: 4.7
    },
    {
      id: 5,
      title: 'Tutorial Stream',
      date: new Date(2026, 3, 22, 14, 0),
      duration: 45,
      actualViewers: 456,
      peakViewers: 589,
      revenue: 4500,
      status: 'cancelled',
      rating: 0
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

  const completedStreams = pastStreams.filter(s => s.status === 'completed');
  const totalViewers = completedStreams.reduce((sum, s) => sum + s.actualViewers, 0);
  const totalRevenue = completedStreams.reduce((sum, s) => sum + s.revenue, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.historyIcon}>
            <Ionicons name="time" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Schedule History
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {pastStreams.length} past streams
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
        {/* Summary Stats */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(0, 242, 234, 0.15)', 'rgba(0, 242, 234, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="people" size={28} color={TikTokTheme.colors.brand.cyan} />
                <Text style={styles.statValue}>{formatNumber(totalViewers)}</Text>
                <Text style={styles.statLabel}>Total Viewers</Text>
              </LinearGradient>
            </BlurView>
          </View>

          <View style={styles.statCard}>
            <BlurView intensity={40} style={styles.statBlur}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
                style={styles.statContent}
              >
                <Ionicons name="cash" size={28} color="#10B981" />
                <Text style={styles.statValue}>${(totalRevenue / 100).toFixed(0)}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </LinearGradient>
            </BlurView>
          </View>
        </Animated.View>

        {/* Stream History List */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Past Streams</Text>
        </Animated.View>

        {pastStreams.map((stream, index) => (
          <Animated.View key={stream.id} entering={FadeInDown.delay(450 + index * 50)}>
            <TouchableOpacity 
              style={styles.streamCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=400&q=80' }}
                style={styles.streamBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.streamBlur}>
                <View style={styles.streamContent}>
                  <View style={styles.streamHeader}>
                    <View style={styles.streamTitleRow}>
                      <Text style={styles.streamTitle}>{stream.title}</Text>
                      {stream.status === 'completed' && stream.rating > 0 && (
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={12} color="#FFD700" />
                          <Text style={styles.ratingText}>{stream.rating}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.streamDate}>{formatDate(stream.date)}</Text>
                  </View>

                  {stream.status === 'completed' ? (
                    <View style={styles.statsGrid}>
                      <View style={styles.miniStat}>
                        <Ionicons name="eye-outline" size={16} color={TikTokTheme.colors.brand.cyan} />
                        <Text style={styles.miniStatValue}>{formatNumber(stream.actualViewers)}</Text>
                        <Text style={styles.miniStatLabel}>Viewers</Text>
                      </View>
                      <View style={styles.miniStat}>
                        <Ionicons name="trending-up" size={16} color={TikTokTheme.colors.brand.pink} />
                        <Text style={styles.miniStatValue}>{formatNumber(stream.peakViewers)}</Text>
                        <Text style={styles.miniStatLabel}>Peak</Text>
                      </View>
                      <View style={styles.miniStat}>
                        <Ionicons name="cash-outline" size={16} color="#10B981" />
                        <Text style={styles.miniStatValue}>${(stream.revenue / 100).toFixed(0)}</Text>
                        <Text style={styles.miniStatLabel}>Revenue</Text>
                      </View>
                      <View style={styles.miniStat}>
                        <Ionicons name="time-outline" size={16} color={TikTokTheme.colors.text.muted} />
                        <Text style={styles.miniStatValue}>{stream.duration}m</Text>
                        <Text style={styles.miniStatLabel}>Duration</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.cancelledBadge}>
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                      <Text style={styles.cancelledText}>Cancelled</Text>
                    </View>
                  )}
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
  historyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: TikTokTheme.spacing.base, marginBottom: TikTokTheme.spacing.base },
  statCard: { flex: 1, height: 120, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', elevation: 4 },
  statBlur: { flex: 1 },
  statContent: { flex: 1, padding: TikTokTheme.spacing.base, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statValue: { fontSize: 24, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginTop: 8 },
  statLabel: { fontSize: 12, color: TikTokTheme.colors.text.muted, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  streamCard: { borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  streamBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  streamBlur: { flex: 1 },
  streamContent: { padding: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  streamHeader: { marginBottom: 12 },
  streamTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  streamTitle: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.text.primary, flex: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255, 215, 0, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#FFD700' },
  streamDate: { fontSize: 13, color: TikTokTheme.colors.text.secondary },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  miniStat: { alignItems: 'center', gap: 4 },
  miniStatValue: { fontSize: 14, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  miniStatLabel: { fontSize: 10, color: TikTokTheme.colors.text.muted },
  cancelledBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  cancelledText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },
});