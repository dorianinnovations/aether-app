/**
 * TypeBadge Component
 * Visual badge for content types
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Design System
import { typography } from '../../../design-system/tokens/typography';
import { spacing } from '../../../design-system/tokens/spacing';
import type { ThemeColors } from '../types';

type ContentType = 'news' | 'release' | 'info' | 'live-activity' | 'recent-activity';

interface TypeBadgeProps {
  type: ContentType;
  colors: ThemeColors;
  isDarkMode: boolean;
}

const TypeBadge: React.FC<TypeBadgeProps> = ({ type, colors, isDarkMode }) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'news':
        return {
          icon: 'newspaper-outline' as const,
          label: 'News',
          color: '#3B82F6', // Blue
          bgColor: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
        };
      case 'release':
        return {
          icon: 'musical-notes-outline' as const,
          label: 'Release',
          color: '#10B981', // Green
          bgColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
        };
      case 'info':
        return {
          icon: 'information-circle-outline' as const,
          label: 'Artist Info',
          color: '#F59E0B', // Amber
          bgColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
        };
      case 'live-activity':
        return {
          icon: 'play-circle-outline' as const,
          label: 'Live',
          color: '#10B981', // Green
          bgColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
        };
      case 'recent-activity':
        return {
          icon: 'time-outline' as const,
          label: 'Recent',
          color: '#8B5CF6', // Purple
          bgColor: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
        };
      default:
        return {
          icon: 'information-circle-outline' as const,
          label: 'Info',
          color: colors.textSecondary,
          bgColor: colors.surface,
        };
    }
  };

  const config = getTypeConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 6,
    gap: spacing.xs / 2,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
});

export default TypeBadge;