/**
 * Dynamic Profile Display Component
 * Shows AI-analyzed personality, interests, and activities
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Design System
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

// Types
interface Interest {
  topic: string;
  confidence: number;
  lastMentioned: string;
  category?: string;
}

interface CommunicationStyle {
  casual: number;
  energetic: number;
  analytical: number;
  social: number;
  humor: number;
}

interface RecentActivity {
  activity: string;
  type: string;
  confidence: number;
  timeframe: string;
  detectedAt: string;
}

interface MoodEntry {
  mood: string;
  energy: number;
  confidence: number;
  detectedAt: string;
}

interface PersonalityData {
  interests: Interest[];
  communicationStyle: CommunicationStyle;
  recentActivities?: RecentActivity[];
  moodHistory?: MoodEntry[];
  totalMessages: number;
  lastAnalyzed?: string;
  profileCompleteness?: number; // Make optional to match existing data structure
}

interface DynamicProfileDisplayProps {
  personality?: PersonalityData;
  loading?: boolean;
  onRefresh?: () => void;
  _loading?: boolean;
}

export const DynamicProfileDisplay: React.FC<DynamicProfileDisplayProps> = ({
  personality,
  _loading,
  onRefresh
}) => {
  const { theme, colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  // const [_activeSection, _setActiveSection] = useState<string | null>(null);
  
  // Animation refs
  const expandAnimation = useRef(new Animated.Value(0)).current;
  const sectionAnimations = useRef<{[key: string]: Animated.Value}>({
    interests: new Animated.Value(0),
    communication: new Animated.Value(0),
    activities: new Animated.Value(0),
    mood: new Animated.Value(0),
  }).current;

  if (!personality) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
        <Feather name="user" size={24} color={colors.textSecondary} />
        <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
          Start chatting with Aether to build your dynamic profile
        </Text>
      </View>
    );
  }

  const toggleExpanded = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    
    Animated.timing(expandAnimation, {
      toValue: newExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (newExpanded) {
      // Stagger section animations
      const sections = ['interests', 'communication', 'activities', 'mood'];
      sections.forEach((section, index) => {
        setTimeout(() => {
          Animated.timing(sectionAnimations[section], {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }, index * 150);
      });
    } else {
      // Reset all section animations
      Object.values(sectionAnimations).forEach(animation => {
        animation.setValue(0);
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getCompletenessColor = (completeness?: number) => {
    if (!completeness) return '#9E9E9E';
    if (completeness >= 0.8) return '#4CAF50';
    if (completeness >= 0.6) return '#FF9800';
    if (completeness >= 0.4) return '#2196F3';
    return '#9E9E9E';
  };

  const getMoodEmoji = (mood: string) => {
    const moodEmojis: {[key: string]: string} = {
      excited: '🔥',
      happy: '😊',
      neutral: '😐',
      focused: '🎯',
      stressed: '😰',
      tired: '😴',
      curious: '🤔',
      motivated: '💪',
    };
    return moodEmojis[mood] || '😐';
  };

  return (
    <View style={[styles.profileSection, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Feather name="zap" size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Dynamic Profile
          </Text>
          <View style={[styles.completenessIndicator, { 
            backgroundColor: getCompletenessColor(personality.profileCompleteness)
          }]}>
            <Text style={styles.completenessText}>
              {Math.round((personality.profileCompleteness || 0) * 100)}%
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {onRefresh && (
            <TouchableOpacity
              onPress={onRefresh}
              style={[styles.refreshButton, { backgroundColor: colors.background }]}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={14} color={colors.text} />
            </TouchableOpacity>
          )}
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text}
          />
        </View>
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {personality.totalMessages}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Messages
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {personality.interests.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Interests
          </Text>
        </View>
        {personality.recentActivities && (
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {personality.recentActivities.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Activities
            </Text>
          </View>
        )}
      </View>

      {/* Expanded Content */}
      <Animated.View
        style={[
          styles.expandedContent,
          {
            maxHeight: expandAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1000],
            }),
            opacity: expandAnimation,
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Interests */}
          {personality.interests.length > 0 && (
            <Animated.View
              style={[
                styles.subsection,
                { opacity: sectionAnimations.interests }
              ]}
            >
              <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                Detected Interests
              </Text>
              <View style={styles.interestsGrid}>
                {personality.interests.slice(0, 8).map((interest, index) => (
                  <View
                    key={index}
                    style={[styles.interestTag, {
                      backgroundColor: colors.background,
                      borderColor: colors.borders.default,
                    }]}
                  >
                    <Text style={[styles.interestText, { color: colors.text }]} numberOfLines={1}>
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
          <Animated.View
            style={[
              styles.subsection,
              { opacity: sectionAnimations.communication }
            ]}
          >
            <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
              Communication Style
            </Text>
            <View style={styles.communicationGrid}>
              {Object.entries(personality.communicationStyle).map(([key, value]) => (
                <View key={key} style={styles.styleItem}>
                  <Text style={[styles.styleLabel, { color: colors.text }]}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                  <View style={[styles.progressBar, {
                    backgroundColor: theme === 'light' ? '#E0E0E0' : colors.background
                  }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${value * 100}%`,
                          backgroundColor: colors.primary,
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

          {/* Recent Activities */}
          {personality.recentActivities && personality.recentActivities.length > 0 && (
            <Animated.View
              style={[
                styles.subsection,
                { opacity: sectionAnimations.activities }
              ]}
            >
              <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                Recent Activities
              </Text>
              {personality.recentActivities.slice(0, 3).map((activity, index) => (
                <View key={index} style={[styles.activityItem, {
                  backgroundColor: colors.background,
                  borderColor: colors.borders.default,
                }]}>
                  <View style={styles.activityHeader}>
                    <Text style={[styles.activityText, { color: colors.text }]} numberOfLines={2}>
                      {activity.activity}
                    </Text>
                    <Text style={[styles.activityConfidence, { color: colors.textSecondary }]}>
                      {Math.round(activity.confidence * 100)}%
                    </Text>
                  </View>
                  <Text style={[styles.activityMeta, { color: colors.textSecondary }]}>
                    {activity.type} • {activity.timeframe} • {formatDate(activity.detectedAt)}
                  </Text>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Recent Mood */}
          {personality.moodHistory && personality.moodHistory.length > 0 && (
            <Animated.View
              style={[
                styles.subsection,
                { opacity: sectionAnimations.mood }
              ]}
            >
              <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
                Recent Mood
              </Text>
              {personality.moodHistory.slice(0, 3).map((mood, index) => (
                <View key={index} style={[styles.moodItem, {
                  backgroundColor: colors.background,
                  borderColor: colors.borders.default,
                }]}>
                  <Text style={styles.moodEmoji}>
                    {getMoodEmoji(mood.mood)}
                  </Text>
                  <View style={styles.moodDetails}>
                    <Text style={[styles.moodText, { color: colors.text }]}>
                      {mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)}
                    </Text>
                    <Text style={[styles.moodMeta, { color: colors.textSecondary }]}>
                      Energy: {Math.round(mood.energy * 100)}% • {formatDate(mood.detectedAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Last Analyzed */}
          {personality.lastAnalyzed && (
            <View style={styles.lastAnalyzed}>
              <Text style={[styles.lastAnalyzedText, { color: colors.textSecondary }]}>
                Last updated: {formatDate(personality.lastAnalyzed)}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    borderRadius: 16,
    padding: spacing[4],
    marginVertical: spacing[3],
    overflow: 'hidden',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  sectionTitle: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
  },

  completenessIndicator: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 12,
  },

  completenessText: {
    color: 'white',
    ...typography.textStyles.caption,
    fontSize: 10,
    fontWeight: '600',
  },

  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing[3],
  },

  statItem: {
    alignItems: 'center',
    gap: spacing[1],
  },

  statValue: {
    ...typography.textStyles.headlineSmall,
    fontWeight: '700',
  },

  statLabel: {
    ...typography.textStyles.caption,
  },

  expandedContent: {
    overflow: 'hidden',
  },

  subsection: {
    marginBottom: spacing[4],
  },

  subsectionTitle: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[3],
  },

  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },

  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing[1],
  },

  interestText: {
    ...typography.textStyles.caption,
    fontWeight: '500',
  },

  confidenceText: {
    ...typography.textStyles.caption,
    fontSize: 10,
  },

  communicationGrid: {
    gap: spacing[2],
  },

  styleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  styleLabel: {
    ...typography.textStyles.caption,
    fontWeight: '500',
    width: 70,
  },

  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  styleValue: {
    ...typography.textStyles.caption,
    width: 35,
    textAlign: 'right',
  },

  activityItem: {
    padding: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing[2],
  },

  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
  },

  activityText: {
    ...typography.textStyles.caption,
    fontWeight: '500',
    flex: 1,
    marginRight: spacing[2],
  },

  activityConfidence: {
    ...typography.textStyles.caption,
    fontSize: 10,
  },

  activityMeta: {
    ...typography.textStyles.caption,
    fontSize: 10,
  },

  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing[2],
    gap: spacing[2],
  },

  moodEmoji: {
    fontSize: 20,
  },

  moodDetails: {
    flex: 1,
  },

  moodText: {
    ...typography.textStyles.caption,
    fontWeight: '500',
    marginBottom: 2,
  },

  moodMeta: {
    ...typography.textStyles.caption,
    fontSize: 10,
  },

  lastAnalyzed: {
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: spacing[2],
  },

  lastAnalyzedText: {
    ...typography.textStyles.caption,
    fontStyle: 'italic',
  },

  emptyState: {
    borderRadius: 16,
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[3],
    marginVertical: spacing[3],
  },

  emptyStateText: {
    ...typography.textStyles.bodySmall,
    textAlign: 'center',
    maxWidth: 200,
  },
});

export default DynamicProfileDisplay;