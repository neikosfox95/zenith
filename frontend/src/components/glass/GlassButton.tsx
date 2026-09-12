import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../../theme/TikTokTheme';
import { resolveGlassBlur } from './glassBlur';

interface GlassButtonProps {
  onPress: () => void;
  title?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  haptic?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  onPress,
  title,
  children,
  style,
  textStyle,
  variant = 'primary',
  disabled = false,
  haptic = true,
}) => {
  const handlePress = () => {
    if (disabled) return;

    if (haptic) {
      // FIX: impactAsync returns a promise that REJECTS on platforms with no
      // haptic engine (web, simulators, some Android builds). Un-awaited, every
      // button press on those platforms produced an unhandled rejection —
      // noise in the console at best, a red error overlay in dev at worst.
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
        /* haptics are a progressive enhancement */
      });
    }

    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, styles[variant], disabled && styles.disabled, style]}
      activeOpacity={0.7}
    >
      {variant !== 'ghost' && (
        // FIX: was passing @react-native-community/blur props to expo-blur, so
        // no button in the app actually rendered its glass blur.
        <BlurView style={StyleSheet.absoluteFill} {...resolveGlassBlur({ blurType: 'dark', blurAmount: 10 })} />
      )}
      <View style={styles.content}>
        {children || (
          <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
            {title}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: TikTokTheme.borderRadius.md,
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: TikTokTheme.spacing.xl,
    paddingVertical: TikTokTheme.spacing.md,
  },
  primary: {
    backgroundColor: TikTokTheme.colors.brand.cyan,
    ...TikTokTheme.shadows.glow,
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: TikTokTheme.colors.brand.cyan,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: TikTokTheme.typography.fontSize.md,
    fontWeight: TikTokTheme.typography.fontWeight.semibold,
  },
  primaryText: {
    color: TikTokTheme.colors.background.primary,
  },
  secondaryText: {
    color: TikTokTheme.colors.brand.cyan,
  },
  ghostText: {
    color: TikTokTheme.colors.text.primary,
  },
});
