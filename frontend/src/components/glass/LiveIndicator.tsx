import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { TikTokTheme } from '../../../theme/TikTokTheme';

interface LiveIndicatorProps {
  isLive: boolean;
  viewerCount?: number;
}

export const LiveIndicator: React.FC<LiveIndicatorProps> = ({ isLive, viewerCount }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLive) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [isLive, pulseAnim, glowAnim]);

  if (!isLive) {
    return (
      <View style={[styles.container, styles.offline]}>
        <Text style={styles.offlineText}>OFFLINE</Text>
      </View>
    );
  }

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        styles.live,
        {
          transform: [{ scale: pulseAnim }],
          opacity: glowOpacity,
        },
      ]}
    >
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>LIVE</Text>
      {viewerCount !== undefined && viewerCount > 0 && (
        <Text style={styles.viewerText}>{formatViewerCount(viewerCount)}</Text>
      )}
    </Animated.View>
  );
};

const formatViewerCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: TikTokTheme.borderRadius.full,
    gap: 6,
  },
  live: {
    backgroundColor: TikTokTheme.colors.status.live,
    elevation: 10,
  },
  offline: {
    backgroundColor: TikTokTheme.colors.status.offline,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TikTokTheme.colors.background.primary,
  },
  liveText: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    fontWeight: TikTokTheme.typography.fontWeight.black,
    color: TikTokTheme.colors.background.primary,
  },
  offlineText: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    fontWeight: TikTokTheme.typography.fontWeight.bold,
    color: TikTokTheme.colors.text.muted,
  },
  viewerText: {
    fontSize: TikTokTheme.typography.fontSize.xs,
    fontWeight: TikTokTheme.typography.fontWeight.semibold,
    color: TikTokTheme.colors.background.primary,
    marginLeft: 4,
  },
});
