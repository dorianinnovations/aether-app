/**
 * HeatmapModal - Full-screen modal for viewing messaging heatmaps
 * Clean, dedicated component for orbit conversation heatmap display
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { HeatmapTooltip } from './HeatmapTooltip';
import { getThemeColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

interface HeatmapModalProps {
  visible: boolean;
  onClose: () => void;
  friendUsername?: string;
  theme?: 'light' | 'dark';
}

export const HeatmapModal: React.FC<HeatmapModalProps> = ({
  visible,
  onClose,
  friendUsername,
  theme = 'light',
}) => {
  const colors = getThemeColors(theme);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borders?.default || (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
          }
        ]}>
          <Text style={[
            styles.title,
            { color: colors.text }
          ]}>
            Messaging Heatmap {friendUsername && `with ${friendUsername}`}
          </Text>
          
          <HeatmapTooltip
            visible={visible}
            theme={theme}
            friendUsername={friendUsername}
          />
          
          <TouchableOpacity 
            style={[
              styles.closeButton,
              { backgroundColor: colors.primary }
            ]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing[4],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  closeButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});