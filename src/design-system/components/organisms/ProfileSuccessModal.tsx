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
}

export const ProfileSuccessModal: React.FC<ProfileSuccessModalProps> = ({
  visible,
  onClose,
  theme = 'light',
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
      // Auto-dismiss after animation completes (AetherSuccess.json is ~2 seconds)
      const timer = setTimeout(() => {
        handleClose();
      }, 2000);
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

  const renderContent = () => {
    return (
      <View style={styles.contentContainer}>
        {/* Success Animation */}
        {showIcon && showSuccessAnimation && (
          <>
            <LottieView
              source={require('../../../../assets/AetherSuccess.json')}
              autoPlay
              loop={false}
              style={styles.successAnimation}
            />
            <Text style={[
              styles.successText,
              { color: themeColors.text }
            ]}>
              Success
            </Text>
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
  successAnimation: {
    width: 60,
    height: 60,
    marginBottom: spacing[2],
  },
  successText: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ProfileSuccessModal;