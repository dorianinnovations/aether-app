/**
 * Aether Profile Success Modal Component
 * Adapted from SignOutModal for profile update success notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  BackHandler,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { designTokens, getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { getNeumorphicStyle } from '../../tokens/shadows';

const { width: screenWidth } = Dimensions.get('window');

interface ProfileSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  title?: string;
  message?: string;
  buttonText?: string;
  showIcon?: boolean;
}

export const ProfileSuccessModal: React.FC<ProfileSuccessModalProps> = ({
  visible,
  onClose,
  theme = 'light',
  title = 'Profile Updated!',
  message = 'Your profile has been updated successfully.',
  buttonText = 'Great!',
  showIcon = true,
}) => {
  const themeColors = getThemeColors(theme);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible]);

  // Show success animation when modal becomes visible
  useEffect(() => {
    if (visible) {
      setShowSuccessAnimation(true);
      // Auto-dismiss after 2.5 seconds if user doesn't interact
      const timer = setTimeout(() => {
        handleClose();
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setShowSuccessAnimation(false);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleClose();
  };

  const renderIcon = () => {
    if (!showIcon) return null;
    
    return (
      <View style={[
        styles.iconContainer,
        {
          backgroundColor: designTokens.semantic.success + '15',
          borderColor: designTokens.semantic.success + '30',
        }
      ]}>
        {showSuccessAnimation ? (
          <LottieView
            source={require('../../../../assets/AetherSuccess.json')}
            autoPlay
            loop={false}
            style={styles.successAnimation}
          />
        ) : (
          <Feather
            name="check-circle"
            size={24}
            color={designTokens.semantic.success}
          />
        )}
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
            onPress={handleClose}
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
            {/* Success Icon */}
            {renderIcon()}

            {/* Title */}
            <Text style={[
              styles.title,
              typography.textStyles.headlineSmall,
              { color: themeColors.text }
            ]}>
              {title}
            </Text>

            {/* Message */}
            <Text style={[
              styles.message,
              typography.textStyles.bodyMedium,
              { color: themeColors.textSecondary }
            ]}>
              {message}
            </Text>

            {/* Confirm Button */}
            <View style={styles.buttonContainer}>
              <View style={[
                styles.button,
                getNeumorphicStyle('elevated', theme),
                {
                  backgroundColor: designTokens.semantic.success,
                  borderWidth: 2,
                  borderColor: theme === 'dark' ? '#4CAF50' : '#2E7D32',
                  shadowColor: designTokens.semantic.success,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }
              ]}>
                <TouchableOpacity
                  onPress={handleConfirm}
                  style={styles.buttonInner}
                >
                  <Text style={[
                    styles.buttonText,
                    typography.textStyles.bodyMedium,
                    { 
                      color: '#ffffff',
                      fontWeight: '700',
                      textShadowColor: 'rgba(0,0,0,0.3)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }
                  ]}>
                    {buttonText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
    borderWidth: 1,
  },
  successAnimation: {
    width: 48,
    height: 48,
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
    width: '100%',
  },
  button: {
    borderRadius: 12,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  buttonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '700',
  },
});

export default ProfileSuccessModal;