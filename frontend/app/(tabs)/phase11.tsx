import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { TikTokColors } from '../../src/constants/tiktokTheme';

// FIX: this screen derived the API base URL locally from
// EXPO_PUBLIC_BACKEND_URL, which is defined nowhere (app.json has no
// `extra` block and no .env sets it), so the value was undefined and
// every request went to a URL literally starting with "undefined/".
// All screens now share src/config/backend.ts.
import { BACKEND_URL as backendUrl } from '../../src/config/backend';

const { width } = Dimensions.get('window');

const PLATFORMS = [
  // Major Social Networks
  { id: 'tiktok', name: 'TikTok', icon: 'musical-notes', color: '#000000', category: 'video' },
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F', category: 'photo' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', category: 'video' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', category: 'social' },
  { id: 'twitter', name: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2', category: 'social' },
  { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00', category: 'messaging' },
  
  // Professional Networks
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2', category: 'professional' },
  
  // Content Platforms
  { id: 'pinterest', name: 'Pinterest', icon: 'logo-pinterest', color: '#E60023', category: 'discovery' },
  { id: 'reddit', name: 'Reddit', icon: 'logo-reddit', color: '#FF4500', category: 'community' },
  { id: 'medium', name: 'Medium', icon: 'book', color: '#000000', category: 'blogging' },
  { id: 'substack', name: 'Substack', icon: 'mail', color: '#FF6719', category: 'newsletter' },
  
  // Video & Streaming
  { id: 'twitch', name: 'Twitch', icon: 'logo-twitch', color: '#9146FF', category: 'streaming' },
  { id: 'vimeo', name: 'Vimeo', icon: 'videocam', color: '#1AB7EA', category: 'video' },
  { id: 'rumble', name: 'Rumble', icon: 'play', color: '#85C742', category: 'video' },
  
  // Messaging & Communication
  { id: 'telegram', name: 'Telegram', icon: 'paper-plane', color: '#0088CC', category: 'messaging' },
  { id: 'discord', name: 'Discord', icon: 'logo-discord', color: '#5865F2', category: 'community' },
  { id: 'whatsapp', name: 'WhatsApp Business', icon: 'logo-whatsapp', color: '#25D366', category: 'messaging' },
  
  // Emerging & Regional
  { id: 'threads', name: 'Threads', icon: 'at', color: '#000000', category: 'social' },
  { id: 'mastodon', name: 'Mastodon', icon: 'planet', color: '#6364FF', category: 'social' },
  { id: 'bluesky', name: 'Bluesky', icon: 'cloud', color: '#1185FE', category: 'social' },
];

export default function Phase11PlatformsScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'video', name: 'Video', icon: 'videocam' },
    { id: 'social', name: 'Social', icon: 'people' },
    { id: 'messaging', name: 'Messaging', icon: 'chatbubbles' },
    { id: 'professional', name: 'Professional', icon: 'briefcase' },
    { id: 'community', name: 'Community', icon: 'planet' },
  ];

  const fetchConnectedPlatforms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/platforms/list`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      setConnectedPlatforms(data.platforms || []);
    } catch (error) {
      console.error('Fetch platforms error:', error);
    }
    setLoading(false);
  };

  const fetchUnifiedAnalytics = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/platforms/unified-analytics?date_range=7d`, {
        headers: { 'Authorization': 'Bearer demo_token' }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Fetch analytics error:', error);
    }
  };

  const connectPlatform = async (platform: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/platforms/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_token'
        },
        body: JSON.stringify({
          platform: platform.id,
          auth_token: 'demo_token_' + platform.id,
          username: `@user_${platform.id}`
        })
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `${platform.name} connected successfully!`);
        await fetchConnectedPlatforms();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect platform');
    }
    setLoading(false);
    setShowConnectModal(false);
  };

  useEffect(() => {
    fetchConnectedPlatforms();
    fetchUnifiedAnalytics();
  }, []);

  const renderPlatformCard = (platform: any, connected: boolean) => {
    const platformInfo = PLATFORMS.find(p => p.id === platform.platform || p.id === platform);
    if (!platformInfo) return null;

    return (
      <TouchableOpacity
        key={platformInfo.id}
        style={[styles.platformCard, { backgroundColor: theme.card }]}
        onPress={() => {
          if (!connected) {
            setSelectedPlatform(platformInfo);
            setShowConnectModal(true);
          }
        }}
      >
        <View style={styles.platformHeader}>
          <View style={[styles.platformIconContainer, { backgroundColor: platformInfo.color }]}>
            <Ionicons name={platformInfo.icon as any} size={28} color="white" />
          </View>
          <View style={styles.platformInfo}>
            <Text style={[styles.platformName, { color: theme.text }]}>{platformInfo.name}</Text>
            {connected ? (
              <View style={styles.connectedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.connectedText}>Connected</Text>
              </View>
            ) : (
              <Text style={[styles.disconnectedText, { color: theme.textSecondary }]}>Not connected</Text>
            )}
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: theme.background }]}>
            <Text style={[styles.categoryText, { color: theme.textSecondary }]}>{platformInfo.category}</Text>
          </View>
        </View>
        {connected && platform.username && (
          <Text style={[styles.platformUsername, { color: theme.textSecondary }]}>{platform.username}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const filteredPlatforms = selectedCategory === 'all' 
    ? PLATFORMS 
    : PLATFORMS.filter(p => p.category === selectedCategory);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#EC4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Multi-Platform Manager</Text>
        <Text style={styles.headerSubtitle}>Connect & manage all your social accounts</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Unified Analytics */}
        {analytics && (
          <View style={[styles.section, { backgroundColor: theme.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart" size={24} color={TikTokColors.pink} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Unified Analytics (7 Days)</Text>
            </View>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticItem}>
                <Text style={[styles.analyticValue, { color: theme.text }]}>
                  {(analytics.total_reach / 1000000).toFixed(1)}M
                </Text>
                <Text style={[styles.analyticLabel, { color: theme.textSecondary }]}>Total Reach</Text>
              </View>
              <View style={styles.analyticItem}>
                <Text style={[styles.analyticValue, { color: theme.text }]}>
                  {(analytics.total_engagement / 1000).toFixed(1)}K
                </Text>
                <Text style={[styles.analyticLabel, { color: theme.textSecondary }]}>Engagement</Text>
              </View>
              <View style={styles.analyticItem}>
                <Text style={[styles.analyticValue, { color: theme.text }]}>
                  {(analytics.total_followers / 1000).toFixed(0)}K
                </Text>
                <Text style={[styles.analyticLabel, { color: theme.textSecondary }]}>Total Followers</Text>
              </View>
            </View>
            {analytics.platforms && (
              <View style={styles.platformsBreakdown}>
                <Text style={[styles.breakdownTitle, { color: theme.text }]}>Platform Breakdown:</Text>
                {Object.entries(analytics.platforms).map(([platform, data]: [string, any]) => (
                  <View key={platform} style={styles.platformRow}>
                    <Text style={[styles.platformRowName, { color: theme.text }]}>{platform}</Text>
                    <Text style={[styles.platformRowValue, { color: theme.textSecondary }]}>
                      {(data.reach / 1000).toFixed(0)}K reach • {data.posts} posts
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Connected Platforms */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="link" size={24} color={TikTokColors.cyan} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Connected Platforms</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={TikTokColors.pink} style={{ marginVertical: 24 }} />
          ) : connectedPlatforms.length > 0 ? (
            connectedPlatforms.map(platform => renderPlatformCard(platform, true))
          ) : (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No platforms connected yet
            </Text>
          )}
        </View>

        {/* Available Platforms */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle" size={24} color="#10B981" />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Connect New Platform</Text>
          </View>
          
          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: selectedCategory === cat.id ? TikTokColors.pink : theme.background }
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={16} 
                  color={selectedCategory === cat.id ? 'white' : theme.textSecondary} 
                />
                <Text style={[
                  styles.categoryChipText,
                  { color: selectedCategory === cat.id ? 'white' : theme.textSecondary }
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.platformsGrid}>
            {filteredPlatforms.filter(p => !connectedPlatforms.find(cp => cp.platform === p.id)).map(platform => (
              renderPlatformCard(platform.id, false)
            ))}
          </View>
          <Text style={[styles.platformCount, { color: theme.textSecondary }]}>
            {filteredPlatforms.length} platforms available • {connectedPlatforms.length} connected
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: TikTokColors.pink }]}
            onPress={() => {
              fetchConnectedPlatforms();
              fetchUnifiedAnalytics();
            }}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Connect Modal */}
      {showConnectModal && selectedPlatform && (
        <View style={styles.modal}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Connect {selectedPlatform.name}</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              You&apos;ll be redirected to {selectedPlatform.name} to authorize this connection.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.background }]}
                onPress={() => setShowConnectModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: selectedPlatform.color }]}
                onPress={() => connectPlatform(selectedPlatform)}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    padding: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  analyticItem: {
    alignItems: 'center',
  },
  analyticValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  analyticLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  platformsBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  platformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  platformRowName: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  platformRowValue: {
    fontSize: 13,
  },
  platformsGrid: {
    gap: 12,
  },
  platformCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformInfo: {
    marginLeft: 16,
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedText: {
    fontSize: 13,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '600',
  },
  disconnectedText: {
    fontSize: 13,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  platformUsername: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    padding: 24,
  },
  categoryFilter: {
    marginBottom: 16,
    maxHeight: 50,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  platformCount: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  actionsSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});