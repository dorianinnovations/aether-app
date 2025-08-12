/**
 * ProfileInsights Organism
 * Complex component for displaying AI-learned personality insights with animations
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

export interface PersonalityInsights {
  interests?: Array<{
    topic: string;
    confidence: number;
  }>;
  communicationStyle?: {
    [key: string]: number;
  };
  totalMessages?: number;
  lastAnalyzed?: string;
}

export interface ProfileInsightsProps {
  /** Personality insights data */
  personalityData?: PersonalityInsights;
  /** Whether the section is expanded */
  expanded?: boolean;
  /** Callback when section is toggled */
  onToggle?: (expanded: boolean) => void;
  /** Custom styles */
  style?: ViewStyle;
}

export const ProfileInsights: React.FC<ProfileInsightsProps> = ({
  personalityData,
  expanded = false,
  onToggle,
  style,
}) => {
  const { theme, colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(expanded);

  // Sync local state with props
  useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded]);

  // Animation refs for sequential fade-in
  const interestsOpacity = useRef(new Animated.Value(1)).current;
  const communicationOpacity = useRef(new Animated.Value(1)).current;
  const lastAnalyzedOpacity = useRef(new Animated.Value(1)).current;


  const animateInsights = () => {
    // Reset all animations
    interestsOpacity.setValue(0);
    communicationOpacity.setValue(0);
    lastAnalyzedOpacity.setValue(0);

    // Sequential animations with stagger
    const animations = [
      Animated.timing(interestsOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(communicationOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(lastAnalyzedOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ];

    // Stagger each animation by 150ms
    animations.forEach((animation, index) => {
      setTimeout(() => animation.start(), index * 150);
    });
  };

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);

    if (newExpanded) {
      setTimeout(() => animateInsights(), 200);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Persona
        </Text>
      </View>

      {/* Expanded Content */}
      <View style={styles.content}>
          {/* Communication Style */}
          {personalityData?.communicationStyle && (
            <Animated.View style={[styles.subsection, { opacity: communicationOpacity }]}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
                            backgroundColor: `hsl(${(Object.keys(personalityData?.communicationStyle || {}).indexOf(key) * 90) % 360}, 60%, ${theme === 'light' ? '75%' : '80%'})`,
                            shadowColor: `hsl(${(Object.keys(personalityData?.communicationStyle || {}).indexOf(key) * 90) % 360}, 60%, 65%)`,
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.3,
                            shadowRadius: 2,
                            elevation: 2,
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
            </Animated.View>
          )}

          {/* Interests */}
          {personalityData?.interests && personalityData.interests.length > 0 && (
            <Animated.View style={[styles.subsection, styles.interestsSection, { opacity: interestsOpacity }]}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Interests
              </Text>
              <View style={styles.interestsContainer}>
                {personalityData.interests.slice(0, 6).map((interest, index) => (
                  <View
                    key={index}
                    style={[styles.interestTag, { 
                      backgroundColor: colors.surface,
                      borderColor: colors.borders.default
                    }]}
                  >
                    <Text style={[styles.interestText, { color: colors.text }]}>
                      {interest.topic}
                    </Text>
                    <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
                      {Math.round(interest.confidence * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}


          {/* Last Analyzed */}
          {personalityData?.lastAnalyzed && (
            <Animated.View style={[styles.lastAnalyzed, { opacity: lastAnalyzedOpacity }]}>
              <Text style={[styles.lastAnalyzedText, { color: colors.textSecondary }]}>
                Last analyzed: {new Date(personalityData.lastAnalyzed).toLocaleDateString()}
              </Text>
            </Animated.View>
          )}
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[8],
    paddingTop: spacing[6],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
  },
  title: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '600',
  },
  content: {
    gap: spacing[10],
  },
  subsection: {
    gap: spacing[4],
    paddingBottom: spacing[2],
  },
  interestsSection: {
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  subtitle: {
    fontSize: 18,
    fontFamily: typography.fonts.mozillaHeadlineSemiBold,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  
  // Interests
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 6,
    borderWidth: 1,
    gap: spacing[1],
    minWidth: 60,
    justifyContent: 'center',
  },
  interestText: {
    ...typography.textStyles.bodySmall,
    fontWeight: '500',
    fontSize: 11,
  },
  confidenceText: {
    ...typography.textStyles.caption,
    fontSize: 9,
    fontWeight: '400',
  },
  
  // Communication Style
  communicationGrid: {
    gap: spacing[4],
    marginTop: spacing[2],
  },
  styleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[1],
  },
  styleLabel: {
    ...typography.textStyles.bodySmall,
    fontWeight: '500',
    width: 90,
    fontSize: 13,
  },
  progressBar: {
    flex: 1,
    height: 14,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  styleValue: {
    ...typography.textStyles.caption,
    width: 45,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Last Analyzed
  lastAnalyzed: {
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  lastAnalyzedText: {
    ...typography.textStyles.caption,
    fontStyle: 'italic',
  },
});

export default ProfileInsights;