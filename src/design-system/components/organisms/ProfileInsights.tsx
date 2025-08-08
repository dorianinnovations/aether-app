/**
 * ProfileInsights Organism
 * Complex component for displaying AI-learned personality insights with animations
 */

import React, { useRef, useState } from 'react';
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

  // Animation refs for sequential fade-in
  const interestsOpacity = useRef(new Animated.Value(0)).current;
  const communicationOpacity = useRef(new Animated.Value(0)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const lastAnalyzedOpacity = useRef(new Animated.Value(0)).current;

  if (!personalityData) {
    return null;
  }

  const animateInsights = () => {
    // Reset all animations
    interestsOpacity.setValue(0);
    communicationOpacity.setValue(0);
    statsOpacity.setValue(0);
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
      Animated.timing(statsOpacity, {
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
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          AI Insights
        </Text>
        <Feather
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text}
        />
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.content}>
          {/* Interests */}
          {personalityData.interests && personalityData.interests.length > 0 && (
            <Animated.View style={[styles.subsection, { opacity: interestsOpacity }]}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Detected Interests
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

          {/* Communication Style */}
          {personalityData.communicationStyle && (
            <Animated.View style={[styles.subsection, { opacity: communicationOpacity }]}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Communication Style
              </Text>
              <View style={styles.communicationGrid}>
                {Object.entries(personalityData.communicationStyle).map(([key, value]) => (
                  <View key={key} style={styles.styleItem}>
                    <Text style={[styles.styleLabel, { color: colors.text }]}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                    <View style={[styles.progressBar, { 
                      backgroundColor: theme === 'light' ? '#E0E0E0' : colors.surface 
                    }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${value * 100}%`,
                            backgroundColor: '#4CAF50'
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.styleValue, { color: colors.textSecondary }]}>
                      {Math.round(value * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Statistics */}
          <Animated.View style={[styles.subsection, { opacity: statsOpacity }]}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Profile Statistics
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {personalityData.totalMessages || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Messages Analyzed
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {personalityData.interests?.length || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Interests Found
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {personalityData.lastAnalyzed ? 'Active' : 'Learning'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  AI Status
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Last Analyzed */}
          {personalityData.lastAnalyzed && (
            <Animated.View style={[styles.lastAnalyzed, { opacity: lastAnalyzedOpacity }]}>
              <Text style={[styles.lastAnalyzedText, { color: colors.textSecondary }]}>
                Last analyzed: {new Date(personalityData.lastAnalyzed).toLocaleDateString()}
              </Text>
            </Animated.View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[6],
    paddingTop: spacing[4],
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
    gap: spacing[5],
  },
  subsection: {
    gap: spacing[3],
  },
  subtitle: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing[2],
  },
  interestText: {
    ...typography.textStyles.bodySmall,
    fontWeight: '500',
  },
  confidenceText: {
    ...typography.textStyles.caption,
    fontSize: 11,
  },
  
  // Communication Style
  communicationGrid: {
    gap: spacing[3],
  },
  styleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  styleLabel: {
    ...typography.textStyles.bodySmall,
    fontWeight: '500',
    width: 80,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  styleValue: {
    ...typography.textStyles.caption,
    width: 40,
    textAlign: 'right',
  },
  
  // Statistics
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing[3],
  },
  statItem: {
    alignItems: 'center',
    gap: spacing[1],
  },
  statValue: {
    ...typography.textStyles.headlineMedium,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.textStyles.caption,
    textAlign: 'center',
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