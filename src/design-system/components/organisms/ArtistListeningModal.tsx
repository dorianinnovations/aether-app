/**
 * ArtistListeningModal - Full-screen modal for viewing artist listening activity heatmaps
 * Clean, dedicated component for Spotify artist listening pattern visualization
 * Transformed from messaging heatmap modal with enhanced artist-focused UI
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ArtistListeningHeatmap } from './ArtistListeningHeatmap';
import { getThemeColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { getNeumorphicStyle } from '../../tokens/shadows';
import * as Haptics from 'expo-haptics';

interface ArtistListeningModalProps {
  visible: boolean;
  onClose: () => void;
  artistId?: string;
  artistName?: string;
  artistImage?: string;
  theme?: 'light' | 'dark';
}

export const ArtistListeningModal: React.FC<ArtistListeningModalProps> = ({
  visible,
  onClose,
  artistId,
  artistName,
  artistImage,
  theme = 'light',
}) => {
  const colors = getThemeColors(theme);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* Header */}
        <View style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borders?.default || (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
          }
        ]}>
          <View style={styles.headerContent}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: colors.text }]}>
                Listening Activity
              </Text>
              {artistName && (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {artistName}
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={[
                styles.closeButton,
                getNeumorphicStyle('subtle', theme),
                {
                  backgroundColor: colors.surface,
                }
              ]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Feather 
                name="x" 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.heatmapContainer}>
            <ArtistListeningHeatmap
              visible={visible}
              theme={theme}
              artistId={artistId}
              artistName={artistName}
            />
          </View>
          
          {/* Additional stats or info could go here */}
          <View style={styles.infoSection}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Your listening patterns over the past year
            </Text>
            <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
              Data refreshes daily • Powered by Spotify
            </Text>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.borders?.default || (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'),
          }
        ]}>
          <TouchableOpacity 
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
              }
            ]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  infoSection: {
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[4],
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
  },
  infoSubtext: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.7,
    fontFamily: 'Inter-Regular',
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
  },
  primaryButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
});

export default ArtistListeningModal;