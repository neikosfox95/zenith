import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';

const { width } = Dimensions.get('window');

export default function PayoutTrackerScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [payouts] = useState([
    { id: 1, amount: 245000, status: 'completed', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), method: 'Bank Transfer' },
    { id: 2, amount: 198000, status: 'completed', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), method: 'PayPal' },
    { id: 3, amount: 167000, status: 'completed', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21), method: 'Bank Transfer' },
    { id: 4, amount: 145000, status: 'pending', date: new Date(), method: 'Bank Transfer' },
  ]);

  const [balance, setBalance] = useState({ available: 56780, pending: 145000, total: 201780 });

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return '#10B981';
    if (status === 'pending') return '#F59E0B';
    return TikTokTheme.colors.text.muted;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1587400563263-e77a5590bfe7?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']}
          style={styles.heroGradient}
        />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.walletIcon}>
            <Ionicons name="wallet" size={36} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Payout Tracker
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Track your earnings
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
        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.balanceCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1617718875775-c5f9800b17fb?w=400&q=80' }}
            style={styles.balanceBackground}
            blurRadius={4}
          />
          <BlurView intensity={60} style={styles.balanceBlur}>
            <LinearGradient
              colors={['rgba(0, 242, 234, 0.2)', 'rgba(0, 212, 255, 0.1)']}
              style={styles.balanceContent}
            >
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceValue}>${(balance.available / 100).toFixed(2)}</Text>
              <View style={styles.balanceStats}>
                <View style={styles.balanceStat}>
                  <Text style={styles.balanceStatLabel}>Pending</Text>
                  <Text style={styles.balanceStatValue}>${(balance.pending / 100).toFixed(0)}</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceStat}>
                  <Text style={styles.balanceStatLabel}>Total</Text>
                  <Text style={styles.balanceStatValue}>${(balance.total / 100).toFixed(0)}</Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Payout History */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <Text style={styles.sectionTitle}>Payout History</Text>
        </Animated.View>

        {payouts.map((payout, index) => (
          <Animated.View key={payout.id} entering={FadeInDown.delay(450 + index * 50)} style={styles.payoutCard}>
            <BlurView intensity={40} style={styles.payoutBlur}>
              <View style={styles.payoutContent}>
                <View style={[styles.payoutIcon, { backgroundColor: `${getStatusColor(payout.status)}20` }]}>
                  <Ionicons 
                    name={payout.status === 'completed' ? 'checkmark-circle' : 'time'} 
                    size={24} 
                    color={getStatusColor(payout.status)} 
                  />
                </View>
                <View style={styles.payoutInfo}>
                  <Text style={styles.payoutAmount}>${(payout.amount / 100).toFixed(2)}</Text>
                  <Text style={styles.payoutMethod}>{payout.method}</Text>
                  <Text style={styles.payoutDate}>{formatDate(payout.date)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(payout.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(payout.status) }]}>
                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                  </Text>
                </View>
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
  walletIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  balanceCard: { height: 180, borderRadius: TikTokTheme.borderRadius.lg, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 4 },
  balanceBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  balanceBlur: { flex: 1 },
  balanceContent: { flex: 1, padding: TikTokTheme.spacing.base, justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(0, 242, 234, 0.3)' },
  balanceLabel: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  balanceValue: { fontSize: 40, fontWeight: '900', color: TikTokTheme.colors.brand.cyan, marginTop: 8 },
  balanceStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 12 },
  balanceStat: { alignItems: 'center' },
  balanceStatLabel: { fontSize: 12, color: TikTokTheme.colors.text.muted, marginBottom: 4 },
  balanceStatValue: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary },
  balanceDivider: { width: 1, height: 30, backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  payoutCard: { height: 90, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  payoutBlur: { flex: 1 },
  payoutContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', gap: 12 },
  payoutIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  payoutInfo: { flex: 1 },
  payoutAmount: { fontSize: 18, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  payoutMethod: { fontSize: 13, color: TikTokTheme.colors.text.secondary, marginBottom: 2 },
  payoutDate: { fontSize: 11, color: TikTokTheme.colors.text.muted },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
});