import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { TikTokColors } from '../../src/constants/tiktokTheme';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with padding

// All 30 Phases Configuration
const ALL_PHASES = [
  { id: 1, title: 'Dashboard', icon: 'home', color: '#FE2C55', route: 'dashboard' },
  { id: 2, title: 'Creators', icon: 'people', color: '#25F4EE', route: 'creators' },
  { id: 3, title: 'Fan Club', icon: 'star', color: '#FFD700', route: 'fans' },
  { id: 4, title: 'Analytics', icon: 'bar-chart', color: '#8B5CF6', route: 'analytics' },
  { id: 5, title: 'AI Studio', icon: 'sparkles', color: '#EC4899', route: 'ai' },
  { id: 6, title: 'Code AI', icon: 'code-slash', color: '#10B981', route: 'code' },
  { id: 7, title: 'Voice AI', icon: 'mic', color: '#3B82F6', route: 'voice' },
  { id: 8, title: 'Media AI', icon: 'color-palette', color: '#F59E0B', route: 'media' },
  { id: 9, title: 'Enterprise', icon: 'business', color: '#6366F1', route: 'enterprise' },
  { id: 10, title: 'History', icon: 'time', color: '#EF4444', route: 'history' },
  { id: 11, title: 'Analytics+', icon: 'analytics', color: '#8B5CF6', route: 'phase10' },
  { id: 12, title: 'Platforms', icon: 'globe', color: '#14B8A6', route: 'phase11' },
  { id: 13, title: '3D/AR', icon: 'cube', color: '#F97316', route: 'phase12' },
  { id: 14, title: 'Collaboration', icon: 'people', color: '#06B6D4', route: 'phase13' },
  { id: 15, title: 'AI Agents', icon: 'hardware-chip', color: '#A855F7', route: 'phase14' },
  { id: 16, title: 'Admin', icon: 'shield', color: '#DC2626', route: 'phase15' },
  { id: 17, title: 'Web3', icon: 'logo-bitcoin', color: '#F59E0B', route: 'phase16' },
  { id: 18, title: 'AR/VR', icon: 'glasses', color: '#8B5CF6', route: 'phase17' },
  { id: 19, title: 'Video Editor', icon: 'film', color: '#EF4444', route: 'phase18' },
  { id: 20, title: 'ML Training', icon: 'school', color: '#8B5CF6', route: 'phase19' },
  { id: 21, title: 'Developer', icon: 'code-slash', color: '#3B82F6', route: 'phase20' },
  { id: 22, title: 'Gaming', icon: 'game-controller', color: '#7C3AED', route: 'phase21' },
  { id: 23, title: 'E-Commerce', icon: 'cart', color: '#10B981', route: 'phase22' },
  { id: 24, title: 'Health AI', icon: 'fitness', color: '#EF4444', route: 'phase23' },
  { id: 25, title: 'Education', icon: 'school', color: '#3B82F6', route: 'phase24' },
  { id: 26, title: 'Finance', icon: 'cash', color: '#10B981', route: 'phase25' },
  { id: 27, title: 'Travel', icon: 'airplane', color: '#06B6D4', route: 'phase26' },
  { id: 28, title: 'Smart Home', icon: 'home', color: '#F59E0B', route: 'phase27' },
  { id: 29, title: 'Legal AI', icon: 'hammer', color: '#6366F1', route: 'phase28' },
  { id: 30, title: 'Sports', icon: 'football', color: '#EF4444', route: 'phase29' },
  { id: 31, title: 'Environment', icon: 'leaf', color: '#10B981', route: 'phase30' },
];

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([1, 5, 7, 11]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const filteredPhases = ALL_PHASES.filter(phase =>
    phase.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFavorite = (phaseId: number) => {
    setFavorites(prev =>
      prev.includes(phaseId)
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const navigateToPhase = (route: string) => {
    router.push(`/(tabs)/${route}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[TikTokColors.pink, TikTokColors.cyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>TikTok AI Command</Text>
            <Text style={styles.headerSubtitle}>1,000,000/1,000,000 Zenith Grade</Text>
            {/* FIX: `styles.userEmail` was never defined in the StyleSheet, so
                it resolved to undefined and the line only looked right because
                the inline object happened to carry the real styles. The style
                now lives in the StyleSheet with the rest of them. */}
            {user && (
              <Text style={styles.userEmail}>
                {user.email}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name="search" size={20} color="white" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search phases..."
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Ionicons name="layers" size={24} color={TikTokColors.pink} />
            <Text style={[styles.statValue, { color: theme.text }]}>30</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Phases</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Ionicons name="hardware-chip" size={24} color={TikTokColors.cyan} />
            <Text style={[styles.statValue, { color: theme.text }]}>377+</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>AI Models</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Ionicons name="flash" size={24} color="#F59E0B" />
            <Text style={[styles.statValue, { color: theme.text }]}>Active</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Status</Text>
          </View>
        </View>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Favorites</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.favoritesScroll}
            >
              {ALL_PHASES.filter(p => favorites.includes(p.id)).map(phase => (
                <TouchableOpacity
                  key={phase.id}
                  style={[styles.favoriteCard, { backgroundColor: theme.card }]}
                  onPress={() => navigateToPhase(phase.route)}
                >
                  <View style={[styles.favoriteIcon, { backgroundColor: phase.color + '20' }]}>
                    <Ionicons name={phase.icon as any} size={24} color={phase.color} />
                  </View>
                  <Text style={[styles.favoriteTitle, { color: theme.text }]}>{phase.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Phases Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps" size={20} color={TikTokColors.pink} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              All Phases ({filteredPhases.length})
            </Text>
          </View>
          
          <View style={styles.phaseGrid}>
            {filteredPhases.map((phase) => {
              const isFavorite = favorites.includes(phase.id);
              return (
                <TouchableOpacity
                  key={phase.id}
                  style={[styles.phaseCard, { backgroundColor: theme.card }]}
                  onPress={() => navigateToPhase(phase.route)}
                  activeOpacity={0.7}
                >
                  <View style={styles.phaseCardHeader}>
                    <View style={[styles.phaseIcon, { backgroundColor: phase.color + '20' }]}>
                      <Ionicons name={phase.icon as any} size={28} color={phase.color} />
                    </View>
                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFavorite(phase.id);
                      }}
                    >
                      <Ionicons
                        name={isFavorite ? 'star' : 'star-outline'}
                        size={18}
                        color={isFavorite ? '#FFD700' : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={[styles.phaseTitle, { color: theme.text }]} numberOfLines={2}>
                    {phase.title}
                  </Text>
                  
                  <View style={[styles.phaseBadge, { backgroundColor: phase.color + '15' }]}>
                    <Text style={[styles.phaseBadgeText, { color: phase.color }]}>
                      Phase {phase.id}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  favoritesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  favoriteCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoriteTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  phaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  phaseCard: {
    width: cardWidth,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  phaseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  phaseIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: 4,
  },
  phaseTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    minHeight: 40,
  },
  phaseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  userEmail: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  phaseBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
