import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useSocket } from '../../src/contexts/SocketContext';
import { creatorsAPI, fansAPI } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Fan {
  _id: string;
  username: string;
  nickname: string;
  total_diamonds: number;
  total_gifts: number;
  chat_count: number;
  like_count: number;
  stream_joins: number;
  tier: string;
  tier_info: {
    name: string;
    color: string;
    min: number;
    max: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
}

interface Creator {
  _id: string;
  tiktok_username: string;
}

interface FanClubStats {
  total_fans: number;
  tier_distribution: Array<{
    _id: string;
    count: number;
    total_diamonds: number;
  }>;
  top_fans: Fan[];
}

export default function FanClubScreen() {
  const { theme } = useTheme();
  const { socket } = useSocket();
  const [selectedTab, setSelectedTab] = useState<'all' | 'super' | 'leaderboard'>('super');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [fans, setFans] = useState<Fan[]>([]);
  const [superFans, setSuperFans] = useState<Fan[]>([]);
  const [leaderboard, setLeaderboard] = useState<Fan[]>([]);
  const [stats, setStats] = useState<FanClubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    if (selectedCreator) {
      loadFanData();
    }
  }, [selectedCreator]);

  useEffect(() => {
    if (socket) {
      socket.on('fan_tier_upgrade', handleFanTierUpgrade);
      socket.on('badge_earned', handleBadgeEarned);

      return () => {
        socket.off('fan_tier_upgrade', handleFanTierUpgrade);
        socket.off('badge_earned', handleBadgeEarned);
      };
    }
  }, [socket]);

  const loadCreators = async () => {
    try {
      const data = await creatorsAPI.getCreators();
      setCreators(data);
      if (data.length > 0 && !selectedCreator) {
        setSelectedCreator(data[0]._id);
      }
    } catch (error) {
      console.error('Error loading creators:', error);
    }
  };

  const loadFanData = async () => {
    if (!selectedCreator) return;

    try {
      setLoading(true);
      const [fansData, superFansData, leaderboardData, statsData] = await Promise.all([
        fansAPI.getFans(selectedCreator),
        fansAPI.getSuperFans(selectedCreator),
        fansAPI.getLeaderboard(selectedCreator, 'diamonds'),
        fansAPI.getFanClubStats(selectedCreator),
      ]);

      setFans(fansData);
      setSuperFans(superFansData);
      setLeaderboard(leaderboardData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading fan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFanData();
    setRefreshing(false);
  };

  const handleFanTierUpgrade = (event: any) => {
    console.log('Fan tier upgrade:', event);
    loadFanData();
  };

  const handleBadgeEarned = (event: any) => {
    console.log('Badge earned:', event);
    loadFanData();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'MEGA_FAN': return '👑';
      case 'ULTRA_FAN': return '💎';
      case 'SUPER_FAN': return '⭐';
      case 'DEDICATED': return '🔥';
      case 'SUPPORTER': return '💚';
      default: return '👤';
    }
  };

  const renderFanCard = (fan: Fan, rank?: number) => (
    <TouchableOpacity
      key={fan._id}
      style={[styles.fanCard, { backgroundColor: theme.card }]}
    >
      <View style={styles.fanHeader}>
        {rank && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{rank}</Text>
          </View>
        )}
        <View style={styles.fanAvatar}>
          <Text style={styles.avatarEmoji}>{getTierIcon(fan.tier)}</Text>
        </View>
        <View style={styles.fanInfo}>
          <Text style={[styles.fanName, { color: theme.text }]} numberOfLines={1}>
            {fan.nickname || fan.username}
          </Text>
          <Text style={[styles.fanUsername, { color: theme.textSecondary }]} numberOfLines={1}>
            @{fan.username}
          </Text>
        </View>
        <View style={[styles.tierBadge, { backgroundColor: fan.tier_info.color + '20' }]}>
          <Text style={[styles.tierText, { color: fan.tier_info.color }]}>
            {fan.tier_info.name}
          </Text>
        </View>
      </View>

      <View style={styles.fanStats}>
        <View style={styles.statItem}>
          <Ionicons name="diamond" size={16} color="#9C27B0" />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {formatNumber(fan.total_diamonds)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Diamonds</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="gift" size={16} color="#FF9800" />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {fan.total_gifts}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Gifts</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={16} color="#4CAF50" />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {fan.chat_count}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Chats</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="eye" size={16} color="#2196F3" />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {fan.stream_joins}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Streams</Text>
        </View>
      </View>

      {fan.badges && fan.badges.length > 0 && (
        <View style={styles.badgesContainer}>
          <Text style={[styles.badgesTitle, { color: theme.textSecondary }]}>Badges:</Text>
          <View style={styles.badgesList}>
            {fan.badges.slice(0, 5).map((badge) => (
              <View key={badge.id} style={[styles.badge, { backgroundColor: theme.surface }]}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
              </View>
            ))}
            {fan.badges.length > 5 && (
              <View style={[styles.badge, { backgroundColor: theme.surface }]}>
                <Text style={[styles.badgeMore, { color: theme.textSecondary }]}>
                  +{fan.badges.length - 5}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStatsOverview = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsOverview}>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Ionicons name="people" size={32} color={theme.primary} />
          <Text style={[styles.statCardValue, { color: theme.text }]}>
            {stats.total_fans}
          </Text>
          <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>
            Total Fans
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Text style={styles.statCardEmoji}>👑</Text>
          <Text style={[styles.statCardValue, { color: theme.text }]}>
            {stats.top_fans.length}
          </Text>
          <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>
            VIP Fans
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card }]}>
          <Ionicons name="diamond" size={32} color="#9C27B0" />
          <Text style={[styles.statCardValue, { color: theme.text }]}>
            {formatNumber(
              stats.tier_distribution.reduce((sum, t) => sum + t.total_diamonds, 0)
            )}
          </Text>
          <Text style={[styles.statCardLabel, { color: theme.textSecondary }]}>
            Total Diamonds
          </Text>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading fans...</Text>
        </View>
      );
    }

    if (selectedTab === 'super') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Super Fans 👑
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Your top supporters
            </Text>
          </View>
          {superFans.length > 0 ? (
            superFans.map((fan) => renderFanCard(fan))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No super fans yet
              </Text>
            </View>
          )}
        </View>
      );
    } else if (selectedTab === 'leaderboard') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Leaderboard 🏆
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Top contributors
            </Text>
          </View>
          {leaderboard.length > 0 ? (
            leaderboard.map((fan, index) => renderFanCard(fan, index + 1))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No leaderboard data yet
              </Text>
            </View>
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.tabContent}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              All Fans ({fans.length})
            </Text>
          </View>
          {fans.length > 0 ? (
            fans.slice(0, 50).map((fan) => renderFanCard(fan))
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No fans yet
              </Text>
            </View>
          )}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Fan Club</Text>
        <Ionicons name="star" size={28} color={theme.primary} />
      </View>

      {/* Creator Selector */}
      {creators.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.creatorSelector}
          contentContainerStyle={styles.creatorSelectorContent}
        >
          {creators.map((creator) => (
            <TouchableOpacity
              key={creator._id}
              style={[
                styles.creatorChip,
                {
                  backgroundColor:
                    selectedCreator === creator._id ? theme.primary : theme.card,
                },
              ]}
              onPress={() => setSelectedCreator(creator._id)}
            >
              <Text
                style={[
                  styles.creatorChipText,
                  {
                    color: selectedCreator === creator._id ? '#FFF' : theme.text,
                  },
                ]}
              >
                @{creator.tiktok_username}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Stats Overview */}
      {renderStatsOverview()}

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'super' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setSelectedTab('super')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'super' ? theme.primary : theme.textSecondary },
            ]}
          >
            Super Fans
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'leaderboard' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setSelectedTab('leaderboard')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'leaderboard' ? theme.primary : theme.textSecondary },
            ]}
          >
            Leaderboard
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'all' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setSelectedTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'all' ? theme.primary : theme.textSecondary },
            ]}
          >
            All Fans
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  creatorSelector: {
    maxHeight: 60,
    marginBottom: 16,
  },
  creatorSelectorContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  creatorChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  creatorChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsOverview: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statCardEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statCardLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  fanCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  fanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  fanAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  fanInfo: {
    flex: 1,
  },
  fanName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  fanUsername: {
    fontSize: 12,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  fanStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  badgesContainer: {
    marginTop: 8,
  },
  badgesTitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 16,
  },
  badgeMore: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
