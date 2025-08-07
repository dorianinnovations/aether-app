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
  showIcon?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

export const ProfileSuccessModal: React.FC<ProfileSuccessModalProps> = ({
  visible,
  onClose,
  theme = 'light',
  showIcon = true,
  isError = false,
  errorMessage,
}) => {
  const themeColors = getThemeColors(theme);
  const [showAnimation, setShowAnimation] = useState(false);

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

  // Show animation when modal becomes visible
  useEffect(() => {
    if (visible) {
      setShowAnimation(true);
      // Auto-dismiss after animation completes (2 seconds for success, 3 seconds for error)
      const timer = setTimeout(() => {
        handleClose();
      }, isError ? 3000 : 2000);
      return () => clearTimeout(timer);
    } else {
      setShowAnimation(false);
    }
  }, [visible, isError]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleClose();
  };

  const renderContent = () => {
    return (
      <View style={styles.contentContainer}>
        {/* Animation */}
        {showIcon && showAnimation && (
          <>
            <LottieView
              source={isError 
                ? require('../../../../assets/AetherFailure.json')
                : require('../../../../assets/AetherSuccess.json')
              }
              autoPlay
              loop={false}
              style={styles.animation}
            />
            <Text style={[
              styles.messageText,
              { color: isError ? '#FF6B6B' : themeColors.text }
            ]}>
              {isError ? 'Failed' : 'Success'}
            </Text>
            {isError && errorMessage && (
              <Text style={[
                styles.errorMessage,
                { color: themeColors.textSecondary }
              ]}>
                {errorMessage}
              </Text>
            )}
          </>
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
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.3)',
            }
          ]}
        />

        {/* Modal Content */}
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modal,
              getGlassmorphicStyle('overlay', theme),
              isError && styles.errorModal
            ]}
          >
            {renderContent()}
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
    width: Math.min(screenWidth - spacing[8], 140),
    height: 140,
    borderRadius: 20,
    padding: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorModal: {
    height: 180,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  animationContainer: {
    position: 'absolute',
    top: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 60,
    height: 60,
    marginBottom: spacing[2],
  },
  messageText: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.textStyles.caption,
    textAlign: 'center',
    marginTop: spacing[2],
    maxWidth: 120,
  },
});

export default ProfileSuccessModal;