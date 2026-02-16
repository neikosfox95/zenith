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
import { creatorsAPI, analyticsAPI, streamsAPI } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Analytics() {
  const { theme } = useTheme();
  const { socket } = useSocket();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'revenue' | 'engagement' | 'growth'>('overview');
  const [creators, setCreators] = useState<any[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [streams, setStreams] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [followerGrowth, setFollowerGrowth] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    if (selectedCreator) {
      loadAnalyticsData();
    }
  }, [selectedCreator]);

  useEffect(() => {
    if (socket) {
      socket.on('milestone_achieved', handleMilestone);
      socket.on('new_activity', handleNewActivity);

      return () => {
        socket.off('milestone_achieved', handleMilestone);
        socket.off('new_activity', handleNewActivity);
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

  const loadAnalyticsData = async () => {
    if (!selectedCreator) return;

    try {
      setLoading(true);
      const [
        revenueRes,
        followerRes,
        milestonesRes,
        historicalRes,
        activityRes,
        streamsRes,
      ] = await Promise.all([
        analyticsAPI.getRevenueAnalytics(selectedCreator, 'all'),
        analyticsAPI.getFollowerGrowth(selectedCreator, 30),
        analyticsAPI.getCreatorMilestones(selectedCreator),
        analyticsAPI.getHistoricalData(selectedCreator, 10),
        analyticsAPI.getActivityFeed(50),
        streamsAPI.getStreams(),
      ]);

      setRevenueData(revenueRes);
      setFollowerGrowth(followerRes);
      setMilestones(milestonesRes);
      setHistoricalData(historicalRes);
      setActivityFeed(activityRes);
      setStreams(streamsRes);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  };

  const handleMilestone = (milestone: any) => {
    setMilestones((prev) => [milestone, ...prev]);
  };

  const handleNewActivity = (activity: any) => {
    setActivityFeed((prev) => [activity, ...prev].slice(0, 50));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (diamonds: number) => {
    const dollars = diamonds * 0.005; // Approximate conversion
    return `$${dollars.toFixed(2)}`;
  };

  const renderStatCard = (title: string, value: string, icon: any, color: string, subtitle?: string) => (
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );

  const renderOverviewTab = () => (
    <View>
      {/* Revenue Overview */}
      {revenueData && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>💰 Revenue Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Total Revenue',
              formatCurrency(revenueData.total_revenue),
              'cash',
              '#4CAF50',
              `${formatNumber(revenueData.total_revenue)} diamonds`
            )}
            {renderStatCard(
              'Total Gifts',
              formatNumber(revenueData.total_gifts),
              'gift',
              '#FF9800'
            )}
          </View>
        </View>
      )}

      {/* Follower Growth */}
      {followerGrowth && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📈 Growth Metrics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'New Followers',
              formatNumber(followerGrowth.total_new_followers),
              'person-add',
              '#2196F3',
              'Last 30 days'
            )}
            {renderStatCard(
              'Total Streams',
              historicalData?.total_streams || 0,
              'videocam',
              '#9C27B0'
            )}
          </View>
        </View>
      )}

      {/* Recent Milestones */}
      {milestones.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🏆 Recent Milestones</Text>
          {milestones.slice(0, 5).map((milestone, index) => (
            <View key={index} style={[styles.milestoneCard, { backgroundColor: theme.card }]}>
              <View style={styles.milestoneIcon}>
                <Text style={styles.milestoneEmoji}>
                  {milestone.metric_type === 'diamonds' ? '💎' :
                   milestone.metric_type === 'viewers' ? '👥' :
                   milestone.metric_type === 'gifts' ? '🎁' : '⭐'}
                </Text>
              </View>
              <View style={styles.milestoneInfo}>
                <Text style={[styles.milestoneTitle, { color: theme.text }]}>
                  {milestone.milestone_value} {milestone.metric_type}!
                </Text>
                <Text style={[styles.milestoneDate, { color: theme.textSecondary }]}>
                  {new Date(milestone.achieved_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderRevenueTab = () => (
    <View>
      {revenueData && (
        <>
          {/* Revenue Stats */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>💰 Revenue Breakdown</Text>
            <View style={[styles.revenueCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.revenueAmount, { color: '#4CAF50' }]}>
                {formatCurrency(revenueData.total_revenue)}
              </Text>
              <Text style={[styles.revenueLabel, { color: theme.textSecondary }]}>
                Total Earnings ({formatNumber(revenueData.total_revenue)} diamonds)
              </Text>
            </View>
          </View>

          {/* Top Gifts */}
          {revenueData.gift_breakdown && revenueData.gift_breakdown.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>🎁 Top Gifts</Text>
              {revenueData.gift_breakdown.map((gift: any, index: number) => (
                <View key={index} style={[styles.giftCard, { backgroundColor: theme.card }]}>
                  <View style={styles.giftRank}>
                    <Text style={styles.giftRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.giftInfo}>
                    <Text style={[styles.giftName, { color: theme.text }]}>{gift._id}</Text>
                    <Text style={[styles.giftStats, { color: theme.textSecondary }]}>
                      {gift.count} gifts • {formatNumber(gift.revenue)} diamonds
                    </Text>
                  </View>
                  <Text style={[styles.giftValue, { color: '#4CAF50' }]}>
                    {formatCurrency(gift.revenue)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Top Spenders */}
          {revenueData.top_spenders && revenueData.top_spenders.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>👑 Top Spenders</Text>
              {revenueData.top_spenders.slice(0, 10).map((spender: any, index: number) => (
                <View key={index} style={[styles.spenderCard, { backgroundColor: theme.card }]}>
                  <View style={[styles.spenderRank, { backgroundColor: index < 3 ? '#FFD700' : theme.surface }]}>
                    <Text style={[styles.spenderRankText, { color: index < 3 ? '#000' : theme.text }]}>
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={styles.spenderInfo}>
                    <Text style={[styles.spenderName, { color: theme.text }]}>
                      {spender.nickname || spender._id}
                    </Text>
                    <Text style={[styles.spenderStats, { color: theme.textSecondary }]}>
                      {spender.gift_count} gifts sent
                    </Text>
                  </View>
                  <View style={styles.spenderValue}>
                    <Text style={[styles.spenderDiamonds, { color: '#9C27B0' }]}>
                      {formatNumber(spender.total_spent)} 💎
                    </Text>
                    <Text style={[styles.spenderMoney, { color: '#4CAF50' }]}>
                      {formatCurrency(spender.total_spent)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderEngagementTab = () => (
    <View>
      {/* Activity Feed */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>⚡ Live Activity</Text>
        {activityFeed.slice(0, 20).map((activity, index) => (
          <View key={index} style={[styles.activityCard, { backgroundColor: theme.card }]}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityEmoji}>
                {activity.type === 'gift' ? '🎁' :
                 activity.type === 'chat' ? '💬' :
                 activity.type === 'follow' ? '⭐' :
                 activity.type === 'share' ? '🔗' : '👤'}
              </Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={[styles.activityText, { color: theme.text }]}>
                {activity.type === 'gift' && activity.data.nickname && (
                  <Text>
                    <Text style={{ fontWeight: 'bold' }}>{activity.data.nickname}</Text> sent {activity.data.gift_name} 
                    ({activity.data.diamonds} 💎)
                  </Text>
                )}
                {activity.type === 'chat' && activity.data.nickname && (
                  <Text>
                    <Text style={{ fontWeight: 'bold' }}>{activity.data.nickname}</Text>: {activity.data.message}
                  </Text>
                )}
                {activity.type === 'follow' && activity.data.nickname && (
                  <Text>
                    <Text style={{ fontWeight: 'bold' }}>{activity.data.nickname}</Text> followed
                  </Text>
                )}
              </Text>
              <Text style={[styles.activityTime, { color: theme.textSecondary }]}>
                {new Date(activity.timestamp).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderGrowthTab = () => (
    <View>
      {/* Historical Performance */}
      {historicalData && historicalData.streams && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Stream History</Text>
          {historicalData.streams.map((stream: any, index: number) => (
            <View key={index} style={[styles.streamCard, { backgroundColor: theme.card }]}>
              <View style={styles.streamHeader}>
                <View style={styles.streamDate}>
                  <Ionicons name="calendar" size={16} color={theme.primary} />
                  <Text style={[styles.streamDateText, { color: theme.text }]}>
                    {new Date(stream.start_time).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.streamStatus, { backgroundColor: '#4CAF50' + '20' }]}>
                  <Text style={[styles.streamStatusText, { color: '#4CAF50' }]}>
                    {stream.duration} min
                  </Text>
                </View>
              </View>
              <View style={styles.streamStats}>
                <View style={styles.streamStat}>
                  <Ionicons name="eye" size={16} color={theme.textSecondary} />
                  <Text style={[styles.streamStatText, { color: theme.text }]}>
                    {formatNumber(stream.peak_viewers)}
                  </Text>
                </View>
                <View style={styles.streamStat}>
                  <Ionicons name="gift" size={16} color="#FF9800" />
                  <Text style={[styles.streamStatText, { color: theme.text }]}>
                    {stream.total_gifts}
                  </Text>
                </View>
                <View style={styles.streamStat}>
                  <Ionicons name="chatbubble" size={16} color="#4CAF50" />
                  <Text style={[styles.streamStatText, { color: theme.text }]}>
                    {stream.total_chats}
                  </Text>
                </View>
                <View style={styles.streamStat}>
                  <Ionicons name="diamond" size={16} color="#9C27B0" />
                  <Text style={[styles.streamStatText, { color: theme.text }]}>
                    {formatNumber(stream.total_gifts_value || 0)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading analytics...</Text>
        </View>
      );
    }

    switch (selectedTab) {
      case 'overview':
        return renderOverviewTab();
      case 'revenue':
        return renderRevenueTab();
      case 'engagement':
        return renderEngagementTab();
      case 'growth':
        return renderGrowthTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Analytics</Text>
        <Ionicons name="bar-chart" size={28} color={theme.primary} />
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

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'overview' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setSelectedTab('overview')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'overview' ? theme.primary : theme.textSecondary },
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'revenue' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setSelectedTab('revenue')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'revenue' ? theme.primary : theme.textSecondary },
            ]}
          >
            Revenue
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'engagement' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setSelectedTab('engagement')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'engagement' ? theme.primary : theme.textSecondary },
            ]}
          >
            Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'growth' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
          ]}
          onPress={() => setSelectedTab('growth')}
        >
          <Text
            style={[
              styles.tabText,
              { color: selectedTab === 'growth' ? theme.primary : theme.textSecondary },
            ]}
          >
            History
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
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  milestoneCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  milestoneIcon: {
    marginRight: 12,
  },
  milestoneEmoji: {
    fontSize: 32,
  },
  milestoneInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  milestoneDate: {
    fontSize: 12,
    marginTop: 2,
  },
  revenueCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  revenueLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  giftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  giftRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  giftRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  giftInfo: {
    flex: 1,
  },
  giftName: {
    fontSize: 16,
    fontWeight: '600',
  },
  giftStats: {
    fontSize: 12,
    marginTop: 2,
  },
  giftValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  spenderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  spenderRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  spenderRankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  spenderInfo: {
    flex: 1,
  },
  spenderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  spenderStats: {
    fontSize: 12,
    marginTop: 2,
  },
  spenderValue: {
    alignItems: 'flex-end',
  },
  spenderDiamonds: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  spenderMoney: {
    fontSize: 12,
    marginTop: 2,
  },
  activityCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
  },
  activityTime: {
    fontSize: 11,
    marginTop: 4,
  },
  streamCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  streamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  streamDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streamDateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  streamStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streamStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  streamStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streamStat: {
    alignItems: 'center',
    gap: 4,
  },
  streamStatText: {
    fontSize: 14,
    fontWeight: '600',
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
});
