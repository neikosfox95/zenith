import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GodTierErrorBoundary, performanceMonitor, analyticsTracker, cacheManager } from '../../src/utils/GodTierFramework';
import { useNetwork, useLocalStorage } from '../../src/hooks/GodTierHooks';
import { TikTokTheme } from '../../theme/TikTokTheme';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
  delay: number;
  testID: string;
}

const SettingItem = ({ icon, title, subtitle, value, onToggle, delay, testID }: SettingItemProps) => (
  <Animated.View entering={FadeInDown.delay(delay)} style={styles.settingCard}>
    <BlurView intensity={40} style={styles.settingBlur}>
      <View style={styles.settingContent}>
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${TikTokTheme.colors.brand.cyan}20` }]}>
            <Ionicons name={icon as any} size={24} color={TikTokTheme.colors.brand.cyan} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.settingTitle}>{title}</Text>
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <Switch
          testID={testID}
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#3e3e3e', true: TikTokTheme.colors.brand.cyan }}
          thumbColor={value ? TikTokTheme.colors.background.primary : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
        />
      </View>
    </BlurView>
  </Animated.View>
);

interface ActionButtonProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  delay: number;
  testID: string;
}

const ActionButton = ({ icon, title, subtitle, color, onPress, delay, testID }: ActionButtonProps) => (
  <Animated.View entering={FadeInDown.delay(delay)}>
    <TouchableOpacity testID={testID} onPress={onPress} style={styles.actionButton}>
      <BlurView intensity={40} style={styles.actionBlur}>
        <View style={styles.actionContent}>
          <View style={[styles.actionIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon as any} size={24} color={color} />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSubtitle}>{subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={TikTokTheme.colors.text.muted} />
        </View>
      </BlurView>
    </TouchableOpacity>
  </Animated.View>
);

function SettingsScreenContent() {
  // God Tier: Persisted settings (survive app restarts via cacheManager/AsyncStorage)
  const [notifications, setNotifications] = useLocalStorage('settings_notifications', true);
  const [soundEffects, setSoundEffects] = useLocalStorage('settings_sound_effects', true);
  const [darkMode, setDarkMode] = useLocalStorage('settings_dark_mode', true);
  const [autoRefresh, setAutoRefresh] = useLocalStorage('settings_auto_refresh', true);

  // God Tier: Network detection
  const { isConnected, connectionType } = useNetwork();

  // God Tier: Performance monitoring & screen analytics
  useEffect(() => {
    const stopTimer = performanceMonitor.startTimer('settings_screen');
    analyticsTracker.screenView('settings');
    return () => stopTimer();
  }, []);

  const handleToggle = (key: string, setter: (val: boolean) => void, currentValue: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    analyticsTracker.track('setting_toggled', { setting: key, value: !currentValue });
    setter(!currentValue);
  };

  const handleClearCache = () => {
    analyticsTracker.buttonClick('clear_cache');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    cacheManager.clear();
  };

  const handleActionPress = (action: string) => {
    analyticsTracker.buttonClick(action);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Offline Banner */}
      {!isConnected && (
        <Animated.View entering={FadeInDown} style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color={TikTokTheme.colors.background.primary} />
          <Text style={styles.offlineText}>Offline Mode - Settings saved locally</Text>
        </Animated.View>
      )}

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1579548122080-c35fd6820ecb?w=800&q=80' }}
          style={styles.heroBackground}
          blurRadius={3}
        />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.95)']} style={styles.heroGradient} />
        <View style={styles.heroContent}>
          <Animated.View entering={FadeIn} style={styles.settingsIcon}>
            <Ionicons name="settings" size={32} color={TikTokTheme.colors.brand.cyan} />
          </Animated.View>
          <Animated.Text entering={FadeIn.delay(100)} style={styles.heroTitle}>
            Settings
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(200)} style={styles.heroSubtitle}>
            Customize your experience
          </Animated.Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Connection Status */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.connectionCard}>
          <BlurView intensity={40} style={styles.connectionBlur}>
            <View style={styles.connectionContent}>
              <View style={[styles.connectionDot, { backgroundColor: isConnected ? TikTokTheme.colors.status.success : TikTokTheme.colors.status.error }]} />
              <Text testID="settings-connection-status" style={styles.connectionText}>
                {isConnected ? `Connected via ${connectionType}` : 'No connection'}
              </Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* App Settings Section */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Text style={styles.sectionTitle}>App Settings</Text>
        </Animated.View>

        <SettingItem
          icon="notifications"
          title="Push Notifications"
          subtitle="Get notified when creators go live"
          value={notifications}
          onToggle={() => handleToggle('notifications', setNotifications, notifications)}
          delay={350}
          testID="settings-notifications-toggle"
        />

        <SettingItem
          icon="volume-high"
          title="Sound Effects"
          subtitle="Play sounds for new events"
          value={soundEffects}
          onToggle={() => handleToggle('sound_effects', setSoundEffects, soundEffects)}
          delay={400}
          testID="settings-sound-effects-toggle"
        />

        <SettingItem
          icon="moon"
          title="Dark Mode"
          subtitle="Enable dark theme"
          value={darkMode}
          onToggle={() => handleToggle('dark_mode', setDarkMode, darkMode)}
          delay={450}
          testID="settings-dark-mode-toggle"
        />

        <SettingItem
          icon="refresh"
          title="Auto Refresh"
          subtitle="Automatically refresh data"
          value={autoRefresh}
          onToggle={() => handleToggle('auto_refresh', setAutoRefresh, autoRefresh)}
          delay={500}
          testID="settings-auto-refresh-toggle"
        />

        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(550)} style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>Account</Text>
        </Animated.View>

        <ActionButton
          icon="person"
          title="Profile"
          subtitle="Manage your account"
          color={TikTokTheme.colors.brand.cyan}
          onPress={() => handleActionPress('profile')}
          delay={600}
          testID="settings-profile-button"
        />

        <ActionButton
          icon="lock-closed"
          title="Privacy & Security"
          subtitle="Control your data"
          color="#A855F7"
          onPress={() => handleActionPress('privacy_security')}
          delay={650}
          testID="settings-privacy-button"
        />

        <ActionButton
          icon="key"
          title="API Keys"
          subtitle="Manage integrations"
          color="#3B82F6"
          onPress={() => handleActionPress('api_keys')}
          delay={700}
          testID="settings-api-keys-button"
        />

        {/* Data & Storage Section */}
        <Animated.View entering={FadeInDown.delay(750)} style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
        </Animated.View>

        <ActionButton
          icon="trash-bin"
          title="Clear Cache"
          subtitle="Free up local storage"
          color="#F59E0B"
          onPress={handleClearCache}
          delay={800}
          testID="settings-clear-cache-button"
        />

        {/* About Section */}
        <Animated.View entering={FadeInDown.delay(850)} style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>About</Text>
        </Animated.View>

        <ActionButton
          icon="information-circle"
          title="App Info"
          subtitle="Version 1.0.0 (May 2026)"
          color="#10B981"
          onPress={() => handleActionPress('app_info')}
          delay={900}
          testID="settings-app-info-button"
        />

        <ActionButton
          icon="help-circle"
          title="Help & Support"
          subtitle="Get assistance"
          color="#F59E0B"
          onPress={() => handleActionPress('help_support')}
          delay={950}
          testID="settings-help-button"
        />

        <ActionButton
          icon="document-text"
          title="Terms & Privacy"
          subtitle="Legal information"
          color="#6366F1"
          onPress={() => handleActionPress('terms_privacy')}
          delay={1000}
          testID="settings-terms-button"
        />

        {/* Danger Zone */}
        <Animated.View entering={FadeInDown.delay(1050)} style={{ marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: TikTokTheme.colors.status.error }]}>Danger Zone</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1100)}>
          <TouchableOpacity
            testID="settings-sign-out-button"
            style={styles.dangerButton}
            onPress={() => {
              analyticsTracker.buttonClick('sign_out');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }}
          >
            <BlurView intensity={40} style={styles.dangerBlur}>
              <View style={styles.dangerContent}>
                <Ionicons name="log-out" size={24} color={TikTokTheme.colors.status.error} />
                <Text style={styles.dangerText}>Sign Out</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SettingsScreen() {
  return (
    <GodTierErrorBoundary>
      <SettingsScreenContent />
    </GodTierErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TikTokTheme.colors.background.primary },
  offlineBanner: { backgroundColor: TikTokTheme.colors.status.warning, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 8 },
  offlineText: { fontSize: 12, fontWeight: '600', color: TikTokTheme.colors.background.primary },
  heroContainer: { height: 180, position: 'relative' },
  heroBackground: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0, 242, 234, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: TikTokTheme.colors.brand.cyan },
  heroTitle: { fontSize: 28, fontWeight: '900', color: TikTokTheme.colors.text.primary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: TikTokTheme.colors.text.secondary },
  scrollContent: { padding: TikTokTheme.spacing.base, paddingBottom: 100 },
  connectionCard: { borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: TikTokTheme.spacing.base, elevation: 2 },
  connectionBlur: { flex: 1 },
  connectionContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  connectionDot: { width: 10, height: 10, borderRadius: 5 },
  connectionText: { fontSize: 13, fontWeight: '600', color: TikTokTheme.colors.text.secondary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: TikTokTheme.colors.text.primary, marginBottom: 12 },
  settingCard: { height: 80, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  settingBlur: { flex: 1 },
  settingContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  settingLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  textContainer: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  settingSubtitle: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  actionButton: { height: 70, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  actionBlur: { flex: 1 },
  actionContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: TikTokTheme.spacing.base, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', gap: 12 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: TikTokTheme.colors.text.primary, marginBottom: 2 },
  actionSubtitle: { fontSize: 12, color: TikTokTheme.colors.text.secondary },
  dangerButton: { height: 56, borderRadius: TikTokTheme.borderRadius.md, overflow: 'hidden', marginBottom: 12, elevation: 2 },
  dangerBlur: { flex: 1 },
  dangerContent: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: `${TikTokTheme.colors.status.error}40` },
  dangerText: { fontSize: 16, fontWeight: '700', color: TikTokTheme.colors.status.error },
});
