import React, { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { TikTokTheme } from '../../../theme/TikTokTheme';
import { resolveGlassBlur } from './glassBlur';

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
      {/* FIX: blurType/blurAmount/reducedTransparencyFallbackColor are
          @react-native-community/blur props. expo-blur ignores them, so the
          blur never rendered and every card fell back to its flat rgba
          background. resolveGlassBlur maps them onto tint/intensity. */}
      <BlurView style={StyleSheet.absoluteFill} {...resolveGlassBlur({ blurType, blurAmount, intensity })} />
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
