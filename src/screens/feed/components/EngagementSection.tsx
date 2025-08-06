/**
 * EngagementSection Component
 * Handles likes, comments, shares and engagement indicators
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

// Types
import type { EngagementData, EngagementActions, CardPreferences } from './types';

// Hooks
import { useTheme } from '../../../hooks/useTheme';

// Tokens
import { getThemeColors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';

interface EngagementSectionProps {
  data: EngagementData;
  actions: EngagementActions;
  preferences: CardPreferences;
  accentColor: string;
}

export const EngagementSection: React.FC<EngagementSectionProps> = ({
  data,
  actions,
  preferences,
  accentColor
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  if (!preferences.showEngagement) {
    return null;
  }

  const getEngagementLevelColor = () => {
    switch (data.engagement) {
      case 'high': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'low': return '#6B7280';
      default: return themeColors.textMuted;
    }
  };

  return (
    <View style={[styles.engagementFooter, { 
      borderTopColor: themeColors.borders.default,
      backgroundColor: `${themeColors.surface}F8`,
      borderBottomLeftRadius: preferences.cardCornerRadius,
      borderBottomRightRadius: preferences.cardCornerRadius,
    }]}>
      <View style={styles.engagementStats}>
        <TouchableOpacity 
          style={[styles.engagementButton, {
            backgroundColor: data.userHasLiked ? '#FF6B6B15' : 'transparent'
          }]}
          onPress={actions.onLike}
        >
          <Feather 
            name="heart"
            size={18} 
            color={data.userHasLiked ? "#FF6B6B" : themeColors.textMuted} 
          />
          <Text style={[styles.engagementText, { 
            color: data.userHasLiked ? "#FF6B6B" : themeColors.textMuted,
            fontWeight: data.userHasLiked ? '600' : '400'
          }]}>
            {data.likesCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.engagementButton}
          onPress={actions.onComment}
        >
          <Feather name="message-circle" size={18} color={themeColors.textMuted} />
          <Text style={[styles.engagementText, { color: themeColors.textMuted }]}>
            {data.commentsCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.engagementButton}
          onPress={actions.onShare}
        >
          <Feather name="share" size={18} color={themeColors.textMuted} />
          <Text style={[styles.engagementText, { color: themeColors.textMuted }]}>
            {data.sharesCount}
          </Text>
        </TouchableOpacity>
        
        {/* Engagement level indicator */}
        <View style={styles.engagementLevel}>
          <View style={[styles.engagementDot, { backgroundColor: getEngagementLevelColor() }]} />
        </View>
      </View>
      
      {/* Priority indicator */}
      <View style={[styles.priorityIndicator, { backgroundColor: accentColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  engagementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
  },
  engagementStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2], // Tighter spacing for premium look
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  engagementText: {
    fontSize: 13, // Slightly larger
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  engagementLevel: {
    marginLeft: spacing[2],
  },
  engagementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityIndicator: {
    width: 5, // Slightly wider
    height: 24, // Taller for premium feel
    borderRadius: 3, // More rounded
  },
});