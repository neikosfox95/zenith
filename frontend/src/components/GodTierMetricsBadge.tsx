import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../theme/TikTokTheme';
import { analyticsTracker } from '../utils/GodTierFramework';

/**
 * Floating dev-mode badge that deep-links to the God Tier Metrics screen.
 * Rendered only in development builds; hidden on the metrics screen itself.
 */
export const GodTierMetricsBadge = () => {
  const pathname = usePathname();

  if (!__DEV__ || pathname === '/god-tier-metrics') return null;

  const handlePress = () => {
    analyticsTracker.buttonClick('god_tier_metrics_badge', { from: pathname });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/god-tier-metrics');
  };

  return (
    <TouchableOpacity
      testID="god-tier-metrics-badge"
      style={styles.badge}
      onPress={handlePress}
      accessibilityLabel="Open God Tier Metrics"
    >
      <Ionicons name="speedometer" size={20} color={TikTokTheme.colors.background.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    bottom: 84,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TikTokTheme.colors.brand.cyan,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: TikTokTheme.colors.brand.cyan,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 999,
  },
});
