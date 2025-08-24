/**
 * SparkCard - Core component for displaying Sparks in the Forge Feed
 * Replaces track cards in the music discovery interface
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// Design System
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { designTokens } from '../../tokens/colors';

// Types
import { Spark } from '../../../types/forge';

const { width: screenWidth } = Dimensions.get('window');

interface SparkCardProps {
  spark: Spark;
  theme: 'light' | 'dark';
  onBoost: (sparkId: string) => void;
  onCommit: (sparkId: string) => void;
  onViewDetails: (sparkId: string) => void;
  hasUserBoosted?: boolean;
  hasUserCommitted?: boolean;
}

const SparkCard: React.FC<SparkCardProps> = ({
  spark,
  theme,
  onBoost,
  onCommit,
  onViewDetails,
  hasUserBoosted = false,
  hasUserCommitted = false,
}) => {
  const isDarkMode = theme === 'dark';

  const handleBoost = () => {
    // Premium haptic sequence for boost
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Add a subtle success notification after boost
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 100);
    onBoost(spark.id);
  };

  const handleCommit = () => {
    // Stronger haptic for important commit action
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Success confirmation haptic
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 150);
    onCommit(spark.id);
  };

  const getArtifactIcon = () => {
    switch (spark.artifactType) {
      case 'code': return 'code-slash';
      case 'design': return 'color-palette';
      case 'audio': return 'musical-notes';
      case 'business': return 'briefcase';
      case 'art': return 'brush';
      default: return 'bulb';
    }
  };

  const getArtifactColor = () => {
    switch (spark.artifactType) {
      case 'code': return '#00D2FF';
      case 'design': return '#FF6B9D';
      case 'audio': return '#1DB954';
      case 'business': return '#FFD700';
      case 'art': return '#FF4757';
      default: return designTokens.brand.primary;
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode 
            ? 'rgba(51, 51, 51, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDarkMode 
            ? 'rgba(85, 85, 85, 0.6)' 
            : 'rgba(221, 221, 221, 0.6)',
          shadowColor: isDarkMode ? '#000000' : '#000000',
        }
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onViewDetails(spark.id);
      }}
      activeOpacity={0.85}
    >
      {/* Header with artifact type */}
      <View style={styles.header}>
        <View style={[styles.artifactBadge, { backgroundColor: getArtifactColor() }]}>
          <Ionicons 
            name={getArtifactIcon()} 
            size={16} 
            color="white" 
          />
          <Text style={styles.artifactText}>
            {spark.artifactType.toUpperCase()}
          </Text>
        </View>
        
        <Text style={[
          styles.creatorText,
          { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }
        ]}>
          by @{spark.creatorUsername}
        </Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { color: isDarkMode ? '#FFFFFF' : '#1A1A1A' }
        ]}>
          {spark.title}
        </Text>
        
        <Text style={[
          styles.oneLiner,
          { color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(26, 26, 26, 0.7)' }
        ]}>
          {spark.oneLiner}
        </Text>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {spark.tags.slice(0, 3).map((tag, index) => (
            <View 
              key={index} 
              style={[
                styles.tag,
                { 
                  backgroundColor: isDarkMode 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                }
              ]}
            >
              <Text style={[
                styles.tagText,
                { color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }
              ]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons 
              name="rocket" 
              size={14} 
              color={isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'} 
            />
            <Text style={[
              styles.statText,
              { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }
            ]}>
              {spark.boosts}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons 
              name="people" 
              size={14} 
              color={isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'} 
            />
            <Text style={[
              styles.statText,
              { color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }
            ]}>
              {spark.commits}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.boostButton,
              {
                backgroundColor: hasUserBoosted 
                  ? isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'
                  : 'transparent',
                borderColor: hasUserBoosted 
                  ? isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                  : isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                borderWidth: 1,
              }
            ]}
            onPress={handleBoost}
          >
            <Ionicons 
              name="rocket" 
              size={16} 
              color={hasUserBoosted 
                ? isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'
                : isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'} 
            />
            <Text style={[
              styles.buttonText,
              { 
                color: hasUserBoosted 
                  ? isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'
                  : isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: hasUserBoosted ? '600' : '500',
              }
            ]}>
              {hasUserBoosted ? 'Boosted' : 'Boost'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.commitButton,
              {
                backgroundColor: hasUserCommitted 
                  ? isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'
                  : isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
              }
            ]}
            onPress={handleCommit}
            disabled={hasUserCommitted}
          >
            <Ionicons 
              name={hasUserCommitted ? "checkmark" : "hammer"} 
              size={16} 
              color={hasUserCommitted 
                ? isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'
                : isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'} 
            />
            <Text style={[
              styles.buttonText, 
              { 
                color: hasUserCommitted 
                  ? isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'
                  : isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                fontWeight: hasUserCommitted ? '600' : '500'
              }
            ]}>
              {hasUserCommitted ? 'Joined' : 'Join Build'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth * 0.98,
    padding: spacing.xl,
    marginVertical: spacing.md,
    borderRadius: 20,
    borderWidth: 0,
    alignSelf: 'center',
    // Premium neumorphic shadows
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    // Additional inner shadow effect (simulated with border)
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  artifactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  artifactText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  creatorText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: typography.fonts.ui,
  },
  content: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: typography.fonts.mozillaHeadline,
    marginBottom: spacing.sm,
    lineHeight: 26,
    letterSpacing: -0.5,
  },
  oneLiner: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: typography.fonts.mozillaText,
    lineHeight: 22,
    marginBottom: spacing.lg,
    letterSpacing: -0.2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: typography.fonts.ui,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: typography.fonts.ui,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    // Neumorphic button styling
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0,
    // Inner shadow simulation
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  boostButton: {
    // Gradient-like background will be handled in component
  },
  commitButton: {
    // Neutral styling
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: typography.fonts.ui,
    letterSpacing: -0.1,
  },
});

export default SparkCard;