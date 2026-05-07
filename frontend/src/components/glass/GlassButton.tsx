import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import * as Haptics from 'expo-haptics';
import { TikTokTheme } from '../../../theme/TikTokTheme';

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
    if (!disabled) {
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, styles[variant], disabled && styles.disabled, style]}
      activeOpacity={0.7}
    >
      {variant !== 'ghost' && (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor={TikTokTheme.colors.background.secondary}
        />
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
