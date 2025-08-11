/**
 * PersonaModal Organism
 * Beautiful modern modal for displaying personality insights
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { PersonalityInsights } from './ProfileInsights';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface PersonaModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Personality insights data */
  personalityData?: PersonalityInsights;
  /** Username for modal title */
  username?: string;
  /** Profile picture URI */
  profileImageUri?: string | null;
  /** Callback when modal is closed */
  onClose: () => void;
}

export const PersonaModal: React.FC<PersonaModalProps> = ({
  visible,
  personalityData,
  username,
  profileImageUri,
  onClose,
}) => {
  const { theme, colors } = useTheme();

  // Generate consistent colors for interests based on topic hash
  const getInterestColor = (topic: string) => {
    const colorPalette = [
      { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: theme === 'dark' ? '#93C5FD' : '#2563EB' }, // Blue
      { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: theme === 'dark' ? '#6EE7B7' : '#047857' }, // Green
      { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: theme === 'dark' ? '#FCD34D' : '#B45309' }, // Yellow
      { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: theme === 'dark' ? '#FCA5A5' : '#B91C1C' }, // Red
      { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', text: theme === 'dark' ? '#C4B5FD' : '#7C3AED' }, // Purple
      { bg: 'rgba(236, 72, 153, 0.1)', border: 'rgba(236, 72, 153, 0.3)', text: theme === 'dark' ? '#F9A8D4' : '#BE185D' }, // Pink
      { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.3)', text: theme === 'dark' ? '#67E8F9' : '#0891B2' }, // Cyan
      { bg: 'rgba(139, 69, 19, 0.1)', border: 'rgba(139, 69, 19, 0.3)', text: theme === 'dark' ? '#D2B48C' : '#8B4513' }, // Brown
    ];

    // Simple hash function to get consistent color for same topic
    let hash = 0;
    for (let i = 0; i < topic.length; i++) {
      const char = topic.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % colorPalette.length;
    return colorPalette[index];
  };
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Animation handlers
  useEffect(() => {
    if (visible) {
      // Show modal animations
      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Fade in content after slide animation
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // Hide modal animations
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: screenHeight,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  const hasData = personalityData && (
    (personalityData.interests && personalityData.interests.length > 0) ||
    personalityData.communicationStyle
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Background Blur/Overlay */}
        <Animated.View 
          style={[
            styles.backgroundOverlay,
            { opacity: backgroundOpacity }
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={theme} style={StyleSheet.absoluteFillObject} />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { 
              backgroundColor: theme === 'dark' 
                ? 'rgba(0, 0, 0, 0.8)' 
                : 'rgba(0, 0, 0, 0.6)' 
            }]} />
          )}
        </Animated.View>

        {/* Tap to close area */}
        <TouchableOpacity 
          style={styles.dismissArea} 
          activeOpacity={1} 
          onPress={handleClose}
        />

        {/* Modal Content */}
        <Animated.View 
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              borderColor: colors.borders.subtle,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.handleBar} />
            
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <View style={styles.profileImageContainer}>
                  {profileImageUri ? (
                    <Image
                      source={{ uri: profileImageUri }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={[styles.profileImageFallback, { backgroundColor: colors.surface }]}>
                      <Feather name="user" size={20} color={colors.textSecondary} />
                    </View>
                  )}
                </View>
                <View style={styles.titleTextContainer}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Persona Insights
                  </Text>
                  {username && (
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      @{username}
                    </Text>
                  )}
                </View>
              </View>
              
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal Body */}
          <Animated.View style={[styles.modalBody, { opacity: contentOpacity }]}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {hasData ? (
                <View style={styles.contentContainer}>
                  {/* Communication Style */}
                  {personalityData?.communicationStyle && (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Communication Style
                      </Text>
                      <View style={styles.communicationGrid}>
                        {Object.entries(personalityData.communicationStyle).map(([key, value]) => (
                          <View key={key} style={styles.styleItem}>
                            <Text style={[styles.styleLabel, { color: colors.text }]}>
                              {key}
                            </Text>
                            <View style={[styles.progressBar, { 
                              backgroundColor: theme === 'light' ? '#E0E0E0' : 'rgba(255, 255, 255, 0.1)' 
                            }]}>
                              <View
                                style={[
                                  styles.progressFill,
                                  {
                                    width: `${Number(value) * 100}%`,
                                    backgroundColor: theme === 'dark' 
                                      ? '#FFFFFF' 
                                      : '#9CA3AF',
                                  }
                                ]}
                              />
                            </View>
                            <Text style={[styles.styleValue, { color: colors.textSecondary }]}>
                              {Math.round(Number(value) * 100)}%
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Interests */}
                  {personalityData?.interests && personalityData.interests.length > 0 && (
                    <View style={[styles.section, styles.interestsSection]}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Interests
                      </Text>
                      <View style={styles.interestsContainer}>
                        {personalityData.interests.slice(0, 8).map((interest, index) => {
                          const colorScheme = getInterestColor(interest.topic);
                          return (
                            <View
                              key={index}
                              style={[styles.interestTag, { 
                                backgroundColor: colorScheme.bg,
                                borderColor: colorScheme.border
                              }]}
                            >
                              <Text style={[styles.interestText, { color: colorScheme.text }]}>
                                {interest.topic}
                              </Text>
                              <Text style={[styles.confidenceText, { color: colorScheme.text, opacity: 0.7 }]}>
                                {Math.round(interest.confidence * 100)}%
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Last Analyzed */}
                  {personalityData?.lastAnalyzed && (
                    <View style={styles.footerSection}>
                      <Text style={[styles.lastAnalyzedText, { color: colors.textSecondary }]}>
                        Last analyzed: {new Date(personalityData.lastAnalyzed).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="user-x" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No Insights Yet
                  </Text>
                  <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                    Start chatting to build your personality profile
                  </Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: screenHeight * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    paddingTop: spacing[3],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  profileImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  profileImageFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: typography.fonts.mozillaHeadlineBold,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[8] + (Platform.OS === 'ios' ? 34 : 0), // Safe area padding
  },
  contentContainer: {
    paddingHorizontal: spacing[5],
  },
  section: {
    marginBottom: spacing[8],
  },
  interestsSection: {
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: typography.fonts.mozillaHeadlineSemiBold,
    marginBottom: spacing[4],
    letterSpacing: -0.2,
  },
  
  // Communication Style
  communicationGrid: {
    gap: spacing[2],
  },
  styleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[1],
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: '500',
    width: 90,
    textTransform: 'capitalize',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  styleValue: {
    fontSize: 12,
    fontWeight: '600',
    width: 45,
    textAlign: 'right',
  },
  
  // Interests
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 6,
    borderWidth: 1,
    gap: spacing[1],
  },
  interestText: {
    fontSize: 11,
    fontWeight: '500',
  },
  confidenceText: {
    fontSize: 9,
    fontWeight: '400',
  },
  
  // Footer
  footerSection: {
    alignItems: 'center',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  lastAnalyzedText: {
    fontSize: 10,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[5],
    gap: spacing[4],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PersonaModal;