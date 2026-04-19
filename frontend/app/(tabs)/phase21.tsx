import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { TikTokColors } from '../../src/constants/tiktokTheme';
import Constants from 'expo-constants';

export default function Phase21Screen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [leaderboardName, setLeaderboardName] = useState('');
  const [leaderboards, setLeaderboards] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userCurrency, setUserCurrency] = useState(1500);

  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

  const createLeaderboard = async () => {
    if (!leaderboardName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/gaming/leaderboard/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          name: leaderboardName,
          game_type: 'ranked',
          scoring_method: 'points'
        })
      });
      const data = await response.json();
      if (data.success) {
        setLeaderboards([data.leaderboard, ...leaderboards]);
        setLeaderboardName('');
      }
    } catch (error) {
      console.error('Create leaderboard error:', error);
    }
    setLoading(false);
  };

  const unlockAchievement = async (achievementId: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/gaming/achievements/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          user_id: 'user_123',
          achievement_id: achievementId
        })
      });
      const data = await response.json();
      if (data.success) {
        setAchievements([data.achievement, ...achievements]);
      }
    } catch (error) {
      console.error('Unlock achievement error:', error);
    }
  };

  const loadRewards = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/gaming/rewards/marketplace`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      if (data.success) {
        setUserCurrency(data.user_currency);
      }
    } catch (error) {
      console.error('Load rewards error:', error);
    }
  };

  React.useEffect(() => {
    loadRewards();
  }, []);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#7C3AED', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="game-controller" size={48} color="white" />
        <Text style={styles.headerTitle}>Gaming & Gamification</Text>
        <Text style={styles.headerSubtitle}>Leaderboards • Achievements • Rewards</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Currency Display */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.currencyHeader}>
            <Ionicons name="diamond" size={32} color="#FFD700" />
            <View style={styles.currencyInfo}>
              <Text style={[styles.currencyLabel, { color: theme.textSecondary }]}>Your Currency</Text>
              <Text style={[styles.currencyValue, { color: theme.text }]}>{userCurrency} Coins</Text>
            </View>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: '#7C3AED' }]}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Leaderboard */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Create Leaderboard</Text>
          </View>
          
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
            placeholder="Leaderboard name..."
            placeholderTextColor={theme.textSecondary}
            value={leaderboardName}
            onChangeText={setLeaderboardName}
          />

          <View style={styles.optionsRow}>
            {[{ label: 'Ranked', icon: 'trending-up' }, { label: 'Points', icon: 'star' }, { label: 'Weekly', icon: 'calendar' }].map((opt, idx) => (
              <TouchableOpacity key={idx} style={[styles.optionChip, { backgroundColor: theme.background }]}>
                <Ionicons name={opt.icon as any} size={16} color="#7C3AED" />
                <Text style={[styles.optionText, { color: theme.text }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: '#7C3AED' }]}
            onPress={createLeaderboard}
            disabled={loading || !leaderboardName.trim()}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={styles.createButtonText}>Create Leaderboard</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Leaderboards */}
        {leaderboards.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Leaderboards</Text>
            {leaderboards.map((lb, idx) => (
              <View key={idx} style={[styles.leaderboardCard, { backgroundColor: theme.background }]}>
                <View style={[styles.leaderboardIcon, { backgroundColor: '#FFD700' + '20' }]}>
                  <Ionicons name="trophy" size={24} color="#FFD700" />
                </View>
                <View style={styles.leaderboardInfo}>
                  <Text style={[styles.leaderboardName, { color: theme.text }]}>{lb.name}</Text>
                  <Text style={[styles.leaderboardMeta, { color: theme.textSecondary }]}>
                    {lb.game_type} • {lb.scoring_method}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: '#10B981' + '20' }]}>
                  <Text style={[styles.statusText, { color: '#10B981' }]}>{lb.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Achievements */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="ribbon" size={24} color="#EC4899" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Achievements</Text>
          </View>
          
          <View style={styles.achievementGrid}>
            {[
              { id: 'ach_1', name: 'First Win', desc: 'Win your first game', icon: 'trophy', locked: false },
              { id: 'ach_2', name: 'Streak Master', desc: 'Win 5 games in a row', icon: 'flame', locked: true },
              { id: 'ach_3', name: 'Top Player', desc: 'Reach #1 on leaderboard', icon: 'star', locked: true },
              { id: 'ach_4', name: 'Collector', desc: 'Unlock 10 achievements', icon: 'albums', locked: true }
            ].map((ach, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.achievementCard, { backgroundColor: theme.background, opacity: ach.locked ? 0.6 : 1 }]}
                onPress={() => !ach.locked || unlockAchievement(ach.id)}
              >
                <Ionicons name={ach.icon as any} size={32} color={ach.locked ? theme.textSecondary : '#EC4899'} />
                <Text style={[styles.achievementName, { color: theme.text }]}>{ach.name}</Text>
                <Text style={[styles.achievementDesc, { color: theme.textSecondary }]}>{ach.desc}</Text>
                {ach.locked && (
                  <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={12} color={theme.textSecondary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reward Marketplace */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cart" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Reward Marketplace</Text>
          </View>
          
          {[
            { id: 1, name: 'Premium Skin', cost: 500, type: 'cosmetic', icon: 'color-palette' },
            { id: 2, name: 'XP Boost (2x)', cost: 200, type: 'powerup', icon: 'flash' },
            { id: 3, name: 'Exclusive Badge', cost: 1000, type: 'badge', icon: 'shield' },
            { id: 4, name: 'Custom Title', cost: 750, type: 'cosmetic', icon: 'text' }
          ].map((reward, idx) => (
            <View key={idx} style={[styles.rewardCard, { backgroundColor: theme.background }]}>
              <View style={[styles.rewardIcon, { backgroundColor: '#10B981' + '20' }]}>
                <Ionicons name={reward.icon as any} size={24} color="#10B981" />
              </View>
              <View style={styles.rewardInfo}>
                <Text style={[styles.rewardName, { color: theme.text }]}>{reward.name}</Text>
                <View style={styles.rewardMeta}>
                  <Ionicons name="diamond" size={14} color="#FFD700" />
                  <Text style={[styles.rewardCost, { color: '#FFD700' }]}>{reward.cost}</Text>
                  <Text style={[styles.rewardType, { color: theme.textSecondary }]}>• {reward.type}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.buyButton, { backgroundColor: userCurrency >= reward.cost ? '#10B981' : theme.textSecondary }]}
                disabled={userCurrency < reward.cost}
              >
                <Text style={styles.buyButtonText}>Buy</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Unlocked Achievements */}
        {achievements.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recently Unlocked</Text>
            {achievements.map((ach, idx) => (
              <View key={idx} style={[styles.unlockedCard, { backgroundColor: theme.background }]}>
                <Ionicons name="ribbon" size={32} color="#EC4899" />
                <View style={styles.unlockedInfo}>
                  <Text style={[styles.unlockedName, { color: theme.text }]}>{ach.name}</Text>
                  <Text style={[styles.unlockedPoints, { color: '#FFD700' }]}>+{ach.points} points</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingTop: 60, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 12 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  content: { padding: 16 },
  section: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  currencyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currencyInfo: { flex: 1 },
  currencyLabel: { fontSize: 12 },
  currencyValue: { fontSize: 24, fontWeight: '700', marginTop: 4 },
  addButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  input: { borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 16 },
  optionsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  optionChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 10, gap: 6 },
  optionText: { fontSize: 13, fontWeight: '600' },
  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  leaderboardCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  leaderboardIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  leaderboardInfo: { flex: 1 },
  leaderboardName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  leaderboardMeta: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  achievementCard: { width: '48%', padding: 16, borderRadius: 12, alignItems: 'center', position: 'relative' },
  achievementName: { fontSize: 14, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  achievementDesc: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  lockBadge: { position: 'absolute', top: 12, right: 12 },
  rewardCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  rewardIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  rewardInfo: { flex: 1 },
  rewardName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  rewardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rewardCost: { fontSize: 13, fontWeight: '700' },
  rewardType: { fontSize: 12 },
  buyButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  buyButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  unlockedCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12, gap: 12 },
  unlockedInfo: { flex: 1 },
  unlockedName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  unlockedPoints: { fontSize: 13, fontWeight: '700' },
});