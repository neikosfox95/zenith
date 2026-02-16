import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Settings() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const SettingItem = ({ icon, title, value, onPress }: any) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.card }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name={icon} size={24} color={theme.primary} />
        </View>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {value && <Text style={[styles.settingValue, { color: theme.textSecondary }]}>{value}</Text>}
      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[styles.username, { color: theme.text }]}>{user?.username}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Appearance</Text>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.card }]}
            onPress={toggleTheme}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={24} color={theme.primary} />
              </View>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Theme</Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
              {isDark ? 'Dark' : 'Light'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>App Info</Text>
          <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="information-circle" size={24} color={theme.primary} />
              </View>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Version</Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.error }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
