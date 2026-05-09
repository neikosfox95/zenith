import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

export default function AIReportsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  
  const [reports] = useState([
    {
      id: 1,
      title: 'Weekly Performance Analysis',
      type: 'Performance',
      date: new Date(Date.now() - 86400000),
      status: 'ready',
      insights: 12,
      icon: 'analytics',
      color: TikTokTheme.colors.brand.cyan,
      model: 'GPT-5.2 Pro'
    },
    {
      id: 2,
      title: 'Audience Demographics Deep Dive',
      type: 'Audience',
      date: new Date(Date.now() - 172800000),
      status: 'ready',
      insights: 8,
      icon: 'people',
      color: '#10B981',
      model: 'Gemini 3.0 Flash'
    },
    {
      id: 3,
      title: 'Content Strategy Recommendations',
      type: 'Strategy',
      date: new Date(Date.now() - 259200000),
      status: 'ready',
      insights: 15,
      icon: 'bulb',
      color: '#FFD700',
      model: 'Claude 4.5 Opus'
    },
    {
      id: 4,
      title: 'Monetization Optimization Report',
      type: 'Revenue',
      date: new Date(Date.now() - 345600000),
      status: 'generating',
      insights: 0,
      icon: 'cash',
      color: '#FE2C55',
      model: 'GPT-5.2 Pro'
    },
  ]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleGenerateNew = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Generate new report logic
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.documentIcon}>
            <Ionicons name="document-text" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            AI Reports
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            {reports.length} reports generated
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
        {/* Generate New Button */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateNew}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[TikTokTheme.colors.brand.cyan, TikTokTheme.colors.brand.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateGradient}
            >
              <Ionicons name="add-circle" size={24} color="#FFFFFF" />
              <Text style={styles.generateText}>Generate New Report</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Reports List */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Your Reports</Text>
        </Animated.View>

        {reports.map((report, index) => (
          <Animated.View key={report.id} entering={FadeInDown.delay(450 + index * 50)}>
            <TouchableOpacity 
              style={styles.reportCard}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=400&q=80' }}
                style={styles.reportBackground}
                blurRadius={5}
              />
              <BlurView intensity={50} style={styles.reportBlur}>
                <View style={styles.reportContent}>
                  {/* Icon */}
                  <View style={[styles.reportIcon, { backgroundColor: `${report.color}20` }]}>
                    <Ionicons name={report.icon as any} size={28} color={report.color} />
                  </View>

                  {/* Info */}
                  <View style={styles.reportInfo}>
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: `${report.color}20` }]}>
                        <Text style={[styles.typeText, { color: report.color }]}>{report.type}</Text>
                      </View>
                    </View>
                    <Text style={styles.reportDate}>{formatDate(report.date)}</Text>
                    <View style={styles.reportFooter}>
                      {report.status === 'ready' ? (
                        <>
                          <View style={styles.insightsBadge}>
                            <Ionicons name="sparkles" size={12} color={TikTokTheme.colors.brand.cyan} />
                            <Text style={styles.insightsText}>{report.insights} insights</Text>
                          </View>
                          <Text style={styles.modelText}>{report.model}</Text>
                        </>
                      ) : (
                        <View style={styles.generatingBadge}>
                          <Ionicons name="hourglass" size={12} color="#F59E0B" />
                          <Text style={styles.generatingText}>Generating...</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Action */}
                  {report.status === 'ready' && (
                    <TouchableOpacity style={styles.viewButton}>
                      <Ionicons name="chevron-forward" size={24} color={report.color} />
                    </TouchableOpacity>
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
  documentIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  generateButton: { height: 60, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 6 },
  generateGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  generateText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  reportCard: { borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: 12, elevation: 4 },
  reportBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  reportBlur: { flex: 1 },
  reportContent: { flexDirection: 'row', alignItems: 'center', padding: TikTokTheme.spacing.base, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  reportIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  reportInfo: { flex: 1 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  reportTitle: { fontSize: 15, fontWeight: '700', color: TikTokTheme.colors.text.primary, flex: 1, marginRight: 8 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '900' },
  reportDate: { fontSize: 12, color: TikTokTheme.colors.text.secondary, marginBottom: 8 },
  reportFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insightsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  insightsText: { fontSize: 12, color: TikTokTheme.colors.brand.cyan, fontWeight: '600' },
  modelText: { fontSize: 10, color: TikTokTheme.colors.text.muted, fontStyle: 'italic' },
  generatingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  generatingText: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },
  viewButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
});