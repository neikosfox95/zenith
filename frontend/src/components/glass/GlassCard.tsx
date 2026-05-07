import React, { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { TikTokTheme } from '../../../theme/TikTokTheme';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  blurType?: 'light' | 'dark' | 'extraDark' | 'regular' | 'prominent';
  blurAmount?: number;
  intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  blurType = 'dark',
  blurAmount = 10,
  intensity = 50,
}) => {
  return (
    <View style={[styles.container, style]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={blurType}
        blurAmount={blurAmount}
        reducedTransparencyFallbackColor={TikTokTheme.colors.background.secondary}
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: TikTokTheme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...TikTokTheme.shadows.md,
  },
  content: {
    padding: TikTokTheme.layout.cardPadding,
  },
});
