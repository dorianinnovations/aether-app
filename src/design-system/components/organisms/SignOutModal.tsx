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
  loadingTitle?: string;
  loadingMessage?: string;
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
  loadingTitle = 'Signing Out...',
  loadingMessage = 'Please wait while we sign you out of your account.',
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

  // Reset confirming state when modal is closed
  useEffect(() => {
    if (!visible) {
      setIsConfirming(false);
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (isConfirming) return;
    
    setIsConfirming(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await onConfirm();
      // Don't automatically close - let the parent control when to close
      // The parent should call onClose() when the full sign out process is complete
    } catch (error) {
      logger.error('SignOut error in modal:', error);
      // Only close on error
      setIsConfirming(false);
      onClose();
    }
    // Don't reset isConfirming on success - keep the spinner showing until parent closes modal
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
        styles.contentContainer,
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
              getNeumorphicStyle('elevated', theme),
              {
                backgroundColor: theme === 'dark' ? '#1c1c1e' : '#f0f0f3',
                borderColor: theme === 'dark' ? '#3a3a3c' : '#e5e5e7',
                borderWidth: 1,
              }
            ]}
          >
            {/* Minimalistic Content */}
            <View style={styles.contentContainer}>
              {isConfirming ? (
                <View style={styles.loadingContainer}>
                  <View style={styles.spinner} />
                  <Text style={[
                    styles.minimalistText,
                    { color: themeColors.textSecondary }
                  ]}>
                    Signing out...
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[
                    styles.minimalistTitle,
                    { color: themeColors.text }
                  ]}>
                    Sign out
                  </Text>
                  <Text style={[
                    styles.minimalistSubtext,
                    { color: themeColors.textSecondary }
                  ]}>
                    Are you sure?
                  </Text>
                </>
              )}
            </View>

            {/* Minimalistic Buttons */}
            {!isConfirming && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={[
                    styles.minimalistButton,
                    getNeumorphicStyle('subtle', theme),
                    {
                      backgroundColor: theme === 'dark' ? '#1c1c1e' : '#f0f0f3',
                    }
                  ]}
                >
                  <Text style={[
                    styles.minimalistButtonText,
                    { color: theme === 'dark' ? '#ffffff' : '#666666' }
                  ]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleConfirm}
                  style={[
                    styles.minimalistButton,
                    styles.signOutButton,
                    {
                      backgroundColor: '#ff3b30',
                      shadowColor: '#ff3b30',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }
                  ]}
                >
                  <Text style={[
                    styles.minimalistButtonText,
                    styles.signOutButtonText,
                    { color: '#ffffff' }
                  ]}>Sign out</Text>
                </TouchableOpacity>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
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
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  contentContainer: {
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 24,
  },
  minimalistTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter',
    textAlign: 'left',
    width: '100%',
    letterSpacing: -0.1,
  },
  minimalistSubtext: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Inter',
    textAlign: 'left',
    width: '100%',
    opacity: 0.6,
    lineHeight: 16,
  },
  minimalistText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  spinner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderTopColor: 'transparent',
    // Note: For a real spinner animation, you'd need to add animation logic
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'flex-end',
  },
  minimalistButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    minWidth: 70,
  },
  cancelButton: {
    borderColor: 'transparent',
  },
  confirmButton: {
    borderColor: 'transparent',
  },
  minimalistButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
    letterSpacing: -0.05,
  },
  signOutButton: {
    transform: [{ scale: 1 }],
  },
  signOutButtonText: {
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default SignOutModal;