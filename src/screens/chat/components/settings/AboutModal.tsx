import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { typography } from '../../../../design-system/tokens/typography';
import { spacing } from '../../../../design-system/tokens/spacing';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  colors: {
    surface: string;
    borders: {
      default: string;
    };
    text: string;
    textMuted: string;
  };
}

export const AboutModal: React.FC<AboutModalProps> = ({
  visible,
  onClose,
  theme,
  colors,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.aboutModalBackdrop}>
        <TouchableOpacity 
          style={styles.aboutModalBackdropTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
        
        <View style={[
          styles.aboutModalContainer,
          { 
            backgroundColor: theme === 'dark' ? '#1a1a1a' : colors.surface,
            borderColor: colors.borders.default,
          }
        ]}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.aboutCloseButton}
            onPress={onClose}
          >
            <Feather name="x" size={14} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.aboutContent}>
            <Text style={[styles.aboutTitle, { color: colors.text }]}>
              About Aether
            </Text>
            <Text style={[styles.aboutVersion, { color: colors.textMuted }]}>
              Version {Constants.expoConfig?.version || '1.0.0'}
            </Text>
            <Text style={[styles.aboutPlatform, { color: colors.textMuted }]}>
              {Constants.platform?.ios ? 'iOS' : 'Android'} Platform
            </Text>
            <Text style={[styles.aboutCredits, { color: colors.textMuted }]}>
              By Dorian Innovations
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  aboutModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutModalBackdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  aboutModalContainer: {
    width: 240,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing[4],
    paddingTop: spacing[3],
    position: 'relative',
  },
  aboutCloseButton: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  aboutContent: {
    alignItems: 'flex-start',
  },
  aboutTitle: {
    fontFamily: typography.fonts.headingSemiBold,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  aboutVersion: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    marginBottom: 4,
  },
  aboutPlatform: {
    fontFamily: typography.fonts.body,
    fontSize: 13,
    marginBottom: spacing[3],
  },
  aboutCredits: {
    fontFamily: typography.fonts.body,
    fontSize: 12,
    fontStyle: 'italic',
  },
});