import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useSocket } from '../../src/contexts/SocketContext';
import { creatorsAPI } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Creator {
  _id: string;
  tiktok_username: string;
  is_live: boolean;
  current_viewers: number;
}

interface LiveEvent {
  creator_id: string;
  tiktok_username: string;
  stream_id: string;
}

export default function Dashboard() {
  const { theme } = useTheme();
  const { socket, connected } = useSocket();
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [totalViewers, setTotalViewers] = useState(0);

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('creator_live', handleCreatorLive);
      socket.on('creator_offline', handleCreatorOffline);
      socket.on('viewer_update', handleViewerUpdate);

      return () => {
        socket.off('creator_live', handleCreatorLive);
        socket.off('creator_offline', handleCreatorOffline);
        socket.off('viewer_update', handleViewerUpdate);
      };
    }
  }, [socket]);

  useEffect(() => {
    updateStats();
  }, [creators]);

  const loadCreators = async () => {
    try {
      const data = await creatorsAPI.getCreators();
      setCreators(data);
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCreators();
    setRefreshing(false);
  };

  const handleCreatorLive = (event: LiveEvent) => {
    setCreators((prev) =>
      prev.map((c) =>
        c._id === event.creator_id ? { ...c, is_live: true } : c
      )
    );
  };

  const handleCreatorOffline = (event: LiveEvent) => {
    setCreators((prev) =>
      prev.map((c) =>
        c._id === event.creator_id ? { ...c, is_live: false, current_viewers: 0 } : c
      )
    );
  };

  const handleViewerUpdate = (event: { creator_id: string; viewer_count: number }) => {
    setCreators((prev) =>
      prev.map((c) =>
        c._id === event.creator_id ? { ...c, current_viewers: event.viewer_count } : c
      )
    );
  };

  const updateStats = () => {
    const live = creators.filter((c) => c.is_live).length;
    const viewers = creators.reduce((sum, c) => sum + (c.current_viewers || 0), 0);
    setLiveCount(live);
    setTotalViewers(viewers);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{title}</Text>
    </View>
  );

  const renderCreatorCard = ({ item }: { item: Creator }) => (
    <TouchableOpacity
      style={[styles.creatorCard, { backgroundColor: theme.card }]}
      onPress={() => {
        if (item.is_live) {
          // Navigate to stream details
        }
      }}
    >
      <View style={styles.creatorHeader}>
        <View style={styles.creatorInfo}>
          <Ionicons name="logo-tiktok" size={32} color={theme.primary} />
          <View style={styles.creatorText}>
            <Text style={[styles.creatorName, { color: theme.text }]}>@{item.tiktok_username}</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: item.is_live ? theme.success : theme.textSecondary },
                ]}
              />
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                {item.is_live ? 'LIVE NOW' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
        {item.is_live && (
          <View style={[styles.liveBadge, { backgroundColor: theme.error }]}>
            <Ionicons name="videocam" size={16} color="#FFF" />
          </View>
        )}
      </View>
      {item.is_live && (
        <View style={styles.viewerRow}>
          <Ionicons name="eye" size={16} color={theme.textSecondary} />
          <Text style={[styles.viewerText, { color: theme.text }]}>
            {formatNumber(item.current_viewers)} viewers
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const liveCreators = creators.filter((c) => c.is_live);
  const offlineCreators = creators.filter((c) => !c.is_live);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Dashboard</Text>
          <View style={styles.connectionRow}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: connected ? theme.success : theme.error },
              ]}
            />
            <Text style={[styles.connectionText, { color: theme.textSecondary }]}>
              {connected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/creators')}>
          <Ionicons name="add-circle" size={32} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.statsContainer}>
          {renderStatCard('Total Creators', creators.length, 'people', theme.primary)}
          {renderStatCard('Live Now', liveCount, 'radio', theme.error)}
          {renderStatCard('Total Viewers', formatNumber(totalViewers), 'eye', theme.secondary)}
        </View>

        {liveCreators.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Now</Text>
              <View style={[styles.livePulse, { backgroundColor: theme.error }]} />
            </View>
            {liveCreators.map((creator) => (
              <View key={creator._id}>{renderCreatorCard({ item: creator })}</View>
            ))}
          </View>
        )}

        {offlineCreators.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Offline</Text>
            {offlineCreators.map((creator) => (
              <View key={creator._id}>{renderCreatorCard({ item: creator })}</View>
            ))}
          </View>
        )}

        {creators.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No creators added yet
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/(tabs)/creators')}
            >
              <Text style={styles.addButtonText}>Add Creator</Text>
            </TouchableOpacity>
          </View>
        )}
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
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  creatorCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  creatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creatorText: {
    marginLeft: 12,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  liveBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  viewerText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
