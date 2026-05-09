import React, { ReactNode } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Dimensions, StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { TikTokTheme } from '../../../theme/TikTokTheme';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  contentStyle?: StyleProp<ViewStyle>;
  showCloseButton?: boolean;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  visible,
  onClose,
  children,
  contentStyle,
  showCloseButton = true,
}) => {
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={20}
          reducedTransparencyFallbackColor="rgba(0,0,0,0.8)"
        />
        
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <View style={[styles.contentContainer, contentStyle]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={30}
            reducedTransparencyFallbackColor={TikTokTheme.colors.background.secondary}
          />
          
          {showCloseButton && (
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={28} color={TikTokTheme.colors.text.primary} />
            </TouchableOpacity>
          )}
          
          <View style={styles.content}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: TikTokTheme.spacing.xl,
  },
  contentContainer: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.8,
    borderRadius: TikTokTheme.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...TikTokTheme.shadows.xl,
  },
  closeButton: {
    position: 'absolute',
    top: TikTokTheme.spacing.base,
    right: TikTokTheme.spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    padding: TikTokTheme.spacing.xl,
  },
});
