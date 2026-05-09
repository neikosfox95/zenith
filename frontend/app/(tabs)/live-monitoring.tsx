import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTikTokLiveEvents } from '../../src/hooks/realtime';
import { useLiveEventsStore } from '../../src/stores/liveEventsStore';
import { useUIStore } from '../../src/stores/uiStore';
import { GlassCard } from '../../src/components/glass';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

type EventType = 'gift' | 'join' | 'comment' | 'share' | 'like' | 'follow' | 'default';

const EVENT_ICONS: Record<EventType, string> = {
  gift: 'gift-outline',
  join: 'enter-outline',
  comment: 'chatbubble-outline',
  share: 'share-social-outline',
  like: 'heart-outline',
  follow: 'person-add-outline',
  default: 'flash-outline',
};

const EVENT_COLORS: Record<EventType, string> = {
  gift: TikTokTheme.colors.brand.cyan,
  join: '#A855F7',
  comment: '#3B82F6',
  share: '#10B981',
  like: '#EF4444',
  follow: '#F59E0B',
  default: TikTokTheme.colors.text.muted,
};

export default function LiveMonitoringScreen() {
  const { events, isConnected } = useTikTokLiveEvents();
  const { refreshing, setRefreshing } = useUIStore();
  const [filter, setFilter] = useState<EventType | 'all'>('all');
  const [stats, setStats] = useState({
    total: 0,
    gifts: 0,
    comments: 0,
    joins: 0,
  });

  useEffect(() => {
    // Calculate stats
    const giftCount = events.filter(e => e.event_type === 'gift').length;
    const commentCount = events.filter(e => e.event_type === 'comment').length;
    const joinCount = events.filter(e => e.event_type === 'join').length;

    setStats({
      total: events.length,
      gifts: giftCount,
      comments: commentCount,
      joins: joinCount,
    });
  }, [events]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    // Refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleFilterPress = (newFilter: EventType | 'all') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(newFilter);
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.event_type === filter);

  const getEventIcon = (eventType: string): string => {
    return EVENT_ICONS[eventType as EventType] || EVENT_ICONS.default;
  };

  const getEventColor = (eventType: string): string => {
    return EVENT_COLORS[eventType as EventType] || EVENT_COLORS.default;
  };

  const renderEvent = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 20)}>
      <GlassCard style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={[styles.eventIcon, { backgroundColor: `${getEventColor(item.event_type)}20` }]}>
            <Ionicons
              name={getEventIcon(item.event_type) as any}
              size={20}
              color={getEventColor(item.event_type)}
            />
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventType}>
              {item.event_type.toUpperCase()}
            </Text>
            <Text style={styles.eventTime}>
              {format(new Date(item.created_at), 'HH:mm:ss')}
            </Text>
          </View>
          {item.creator_username && (
            <View style={styles.creatorBadge}>
              <Text style={styles.creatorText}>@{item.creator_username}</Text>
            </View>
          )}
        </View>

        {/* Event Details */}
        {item.payload && (
          <View style={styles.eventDetails}>
            {item.payload.username && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>User: </Text>
                {item.payload.username}
              </Text>
            )}
            {item.payload.giftName && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Gift: </Text>
                {item.payload.giftName} x{item.payload.repeatCount || 1}
              </Text>
            )}
            {item.payload.diamonds && (
              <Text style={[styles.detailText, styles.diamondText]}>
                💎 {item.payload.diamonds} diamonds
              </Text>
            )}
            {item.payload.comment && (
              <Text style={styles.commentText} numberOfLines={2}>
                "{item.payload.comment}"
              </Text>
            )}
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View entering={FadeIn} style={styles.header}>
        <View>
          <Text style={styles.title}>Live Monitoring</Text>
          <Text style={styles.subtitle}>
            {filteredEvents.length} Events • {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
        <View style={isConnected ? styles.statusLive : styles.statusOffline}>
          <View style={styles.statusPulse} />
        </View>
      </Animated.View>

      {/* Stats */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.statsRow}>
        <GlassCard style={styles.miniStat}>
          <Ionicons name="layers-outline" size={16} color={TikTokTheme.colors.brand.cyan} />
          <Text style={styles.miniStatValue}>{stats.total}</Text>
          <Text style={styles.miniStatLabel}>Total</Text>
        </GlassCard>
        <GlassCard style={styles.miniStat}>
          <Ionicons name="gift-outline" size={16} color={TikTokTheme.colors.brand.cyan} />
          <Text style={styles.miniStatValue}>{stats.gifts}</Text>
          <Text style={styles.miniStatLabel}>Gifts</Text>
        </GlassCard>
        <GlassCard style={styles.miniStat}>
          <Ionicons name="chatbubble-outline" size={16} color={TikTokTheme.colors.brand.cyan} />
          <Text style={styles.miniStatValue}>{stats.comments}</Text>
          <Text style={styles.miniStatLabel}>Comments</Text>
        </GlassCard>
        <GlassCard style={styles.miniStat}>
          <Ionicons name="enter-outline" size={16} color={TikTokTheme.colors.brand.cyan} />
          <Text style={styles.miniStatValue}>{stats.joins}</Text>
          <Text style={styles.miniStatLabel}>Joins</Text>
        </GlassCard>
      </Animated.View>

      {/* Filters */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.filtersContainer}>
        <Text style={styles.filtersLabel}>Filter:</Text>
        <FlatList
          horizontal
          data={['all', 'gift', 'comment', 'join', 'share', 'like', 'follow']}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleFilterPress(item as EventType | 'all')}
            >
              <View style={[
                styles.filterChip,
                filter === item && styles.filterChipActive,
              ]}>
                <Text style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}>
                  {item}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </Animated.View>

      {/* Events List */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={TikTokTheme.colors.brand.cyan}
            colors={[TikTokTheme.colors.brand.cyan]}
          />
        }
        ListEmptyComponent={
          <Animated.View entering={FadeIn} style={styles.emptyState}>
            <Ionicons
              name="analytics-outline"
              size={64}
              color={TikTokTheme.colors.text.muted}
            />
            <Text style={styles.emptyTitle}>No Events Yet</Text>
            <Text style={styles.emptySubtitle}>
              {isConnected
                ? 'Waiting for live stream activity...'
                : 'Connect to TikTok to see live events'}
            </Text>
          </Animated.View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TikTokTheme.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: TikTokTheme.spacing.base,
    paddingVertical: TikTokTheme.spacing.base,
  },
  title: {
    fontSize: TikTokTheme.typography.fontSize['2xl'],
    fontWeight: TikTokTheme.typography.fontWeight.black,
    color: TikTokTheme.colors.text.primary,
  },
  subtitle: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    color: TikTokTheme.colors.text.muted,
    marginTop: 4,
  },
  statusLive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: TikTokTheme.colors.status.live,
    ...TikTokTheme.shadows.glow,
  },
  statusOffline: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: TikTokTheme.colors.status.offline,
  },
  statusPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: TikTokTheme.colors.status.live,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: TikTokTheme.spacing.base,
    gap: TikTokTheme.spacing.xs,
    marginBottom: TikTokTheme.spacing.base,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    padding: TikTokTheme.spacing.xs,
  },
  miniStatValue: {
    fontSize: TikTokTheme.typography.fontSize.base,
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.text.primary,
    marginTop: 4,
  },
  miniStatLabel: {
    fontSize: TikTokTheme.typography.fontSize['2xs'],
    color: TikTokTheme.colors.text.muted,
    marginTop: 2,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TikTokTheme.spacing.base,
    marginBottom: TikTokTheme.spacing.base,
  },
  filtersLabel: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    fontWeight: TikTokTheme.typography.fontWeight.semibold,
    color: TikTokTheme.colors.text.secondary,
    marginRight: TikTokTheme.spacing.xs,
  },
  filtersList: {
    gap: TikTokTheme.spacing.xs,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: TikTokTheme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterChipActive: {
    backgroundColor: TikTokTheme.colors.brand.cyan,
  },
  filterText: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    fontWeight: TikTokTheme.typography.fontWeight.semibold,
    color: TikTokTheme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: TikTokTheme.colors.background.primary,
  },
  listContent: {
    paddingHorizontal: TikTokTheme.spacing.base,
    paddingBottom: TikTokTheme.spacing.xl,
    gap: TikTokTheme.spacing.xs,
  },
  eventCard: {
    padding: TikTokTheme.spacing.base,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
    marginLeft: TikTokTheme.spacing.xs,
  },
  eventType: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.text.primary,
  },
  eventTime: {
    fontSize: TikTokTheme.typography.fontSize['2xs'],
    color: TikTokTheme.colors.text.muted,
    marginTop: 2,
  },
  creatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: TikTokTheme.borderRadius.sm,
    backgroundColor: 'rgba(0, 242, 234, 0.1)',
  },
  creatorText: {
    fontSize: TikTokTheme.typography.fontSize['2xs'],
    fontWeight: TikTokTheme.typography.fontWeight.semibold,
    color: TikTokTheme.colors.brand.cyan,
  },
  eventDetails: {
    marginTop: TikTokTheme.spacing.xs,
    paddingTop: TikTokTheme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailText: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    color: TikTokTheme.colors.text.secondary,
    marginTop: 4,
  },
  detailLabel: {
    fontWeight: TikTokTheme.typography.fontWeight.semibold,
    color: TikTokTheme.colors.text.muted,
  },
  diamondText: {
    color: TikTokTheme.colors.brand.cyan,
    fontWeight: TikTokTheme.typography.fontWeight.bold,
  },
  commentText: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    color: TikTokTheme.colors.text.primary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: TikTokTheme.typography.fontSize.xl,
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.text.primary,
    marginTop: TikTokTheme.spacing.base,
  },
  emptySubtitle: {
    fontSize: TikTokTheme.typography.fontSize.sm,
    color: TikTokTheme.colors.text.muted,
    marginTop: 8,
    textAlign: 'center',
  },
});