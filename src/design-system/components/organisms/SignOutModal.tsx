/**
 * Aether SignOut Modal Component
 * Reusable modal that can be adapted for various confirmation dialogs
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  // Animated,
  Modal,
  Dimensions,
  // Easing,
  BackHandler,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { logger } from '../../../utils/logger';
import { FontAwesome5, Feather } from '@expo/vector-icons';

// Icon types
type FeatherIconNames = keyof typeof Feather.glyphMap;
import LottieView from 'lottie-react-native';
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { getNeumorphicStyle } from '../../tokens/shadows';

const { width: screenWidth } = Dimensions.get('window');

interface SignOutModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  theme?: 'light' | 'dark';
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
  iconLibrary?: 'FontAwesome5' | 'Feather';
  variant?: 'danger' | 'warning' | 'info' | 'success';
  showIcon?: boolean;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  visible,
  onClose,
  onConfirm,
  theme = 'light',
  title = 'Sign Out',
  message = 'Are you sure you want to sign out of your account?',
  confirmText = 'Sign Out',
  cancelText = 'Cancel',
  icon = 'sign-out-alt',
  iconLibrary = 'FontAwesome5',
  variant = 'danger',
  showIcon = true,
}) => {
  const themeColors = getThemeColors(theme);
  const [isConfirming, setIsConfirming] = useState(false);

  // Handle Android back button - simplified
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleCancel();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible]);

  const handleCancel = () => {
    if (isConfirming) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleConfirm = async () => {
    if (isConfirming) return;
    
    setIsConfirming(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      logger.error('SignOut error in modal:', error);
      onClose();
    } finally {
      setIsConfirming(false);
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'danger': return theme === 'dark' ? '#FF5252' : '#DC2626'; // Bright red for dark, strong red for light
      case 'warning': return designTokens.semantic.warning;
      case 'info': return designTokens.brand.primary;
      case 'success': return designTokens.semantic.success;
      default: return theme === 'dark' ? '#FF5252' : '#DC2626';
    }
  };

  const getVariantIcon = () => {
    switch (variant) {
      case 'danger': return 'exclamation-triangle';
      case 'warning': return 'alert-triangle';
      case 'info': return 'info';
      case 'success': return 'check-circle';
      default: return icon;
    }
  };

  const renderIcon = () => {
    if (!showIcon) return null;
    
    const IconComponent = iconLibrary === 'Feather' ? Feather : FontAwesome5;
    const iconName = variant !== 'danger' ? getVariantIcon() : icon;
    const iconColor = getVariantColor();
    
    return (
      <View style={[
        styles.iconContainer,
        {
          backgroundColor: iconColor + '15',
          borderColor: iconColor + '30',
        }
      ]}>
        <IconComponent
          name={iconName as FeatherIconNames}
          size={20}
          color={iconColor}
        />
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      statusBarTranslucent
      animationType="fade"
    >
      <View style={styles.overlay}>
        {/* Background */}
        <View
          style={[
            styles.background,
            {
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
            }
          ]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleCancel}
            disabled={isConfirming}
          />
        </View>

        {/* Modal Content */}
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modal,
              getGlassmorphicStyle('overlay', theme),
            ]}
          >
            {/* Icon or Lottie Animation */}
            {isConfirming ? (
              <View style={styles.lottieContainer}>
                <LottieView
                  source={require('../../../../assets/AetherSpinner.json')}
                  autoPlay
                  loop
                  style={styles.lottieAnimation}
                />
              </View>
            ) : (
              renderIcon()
            )}

            {/* Title */}
            <Text style={[
              styles.title,
              typography.textStyles.headlineSmall,
              { color: themeColors.text }
            ]}>
              {isConfirming ? 'Signing Out...' : title}
            </Text>

            {/* Message */}
            <Text style={[
              styles.message,
              typography.textStyles.bodyMedium,
              { color: themeColors.textSecondary }
            ]}>
              {isConfirming ? 'Please wait while we sign you out of your account.' : message}
            </Text>

            {/* Buttons */}
            {!isConfirming && (
              <View style={styles.buttonContainer}>
              {/* Cancel Button */}
              <View style={[
                styles.button,
                getNeumorphicStyle('subtle', theme),
                {
                  backgroundColor: themeColors.surface,
                  borderWidth: 2,
                  borderColor: theme === 'dark' ? '#404040' : '#E5E5E5',
                }
              ]}>
                <TouchableOpacity
                  onPress={handleCancel}
                  disabled={isConfirming}
                  style={styles.buttonInner}
                >
                  <Text style={[
                    styles.buttonText,
                    typography.textStyles.bodyMedium,
                    { 
                      color: themeColors.text,
                      fontWeight: '600',
                    }
                  ]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Confirm Button */}
              <View style={[
                styles.button,
                styles.confirmButton,
                getNeumorphicStyle('elevated', theme),
                {
                  backgroundColor: getVariantColor(),
                  borderWidth: 2,
                  borderColor: theme === 'dark' ? '#FF6B6B' : '#B91C1C',
                  shadowColor: getVariantColor(),
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }
              ]}>
                <TouchableOpacity
                  onPress={handleConfirm}
                  disabled={isConfirming}
                  style={styles.buttonInner}
                >
                  <Text style={[
                    styles.buttonText,
                    styles.confirmButtonText,
                    typography.textStyles.bodyMedium,
                    { 
                      color: '#ffffff',
                      fontWeight: '700',
                      textShadowColor: 'rgba(0,0,0,0.3)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }
                  ]}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            )}
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
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  modal: {
    width: Math.min(screenWidth - spacing[8], 280),
    borderRadius: 16,
    padding: spacing[4],
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
    borderWidth: 1,
  },
  lottieContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  lottieAnimation: {
    width: 64,
    height: 64,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    width: '100%',
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  confirmButton: {
    // Additional styles for confirm button
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  confirmButtonText: {
    // Additional styles for confirm button text
  },
});

export default SignOutModal;