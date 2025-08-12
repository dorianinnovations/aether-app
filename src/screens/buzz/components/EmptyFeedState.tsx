/**
 * EmptyFeedState Component
 * Empty state display when no feed content is available
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Design System
import { typography } from '../../../design-system/tokens/typography';
import { spacing } from '../../../design-system/tokens/spacing';
import type { ThemeColors } from '../types';

interface EmptyFeedStateProps {
  colors: ThemeColors;
  isDarkMode: boolean;
}

const EmptyFeedState: React.FC<EmptyFeedStateProps> = ({ colors, isDarkMode }) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isDarkMode
              ? 'rgba(121, 121, 121, 0.1)'
              : 'rgba(163, 163, 163, 0.05)',
          },
        ]}
      >
        <Ionicons name="musical-notes" size={48} color={colors.primary} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>
        No content found
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Play some music to see personalized content
      </Text>
      
      <Text style={[styles.hint, { color: colors.textTertiary }]}>
        Your feed will update based on your listening activity
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 3,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default EmptyFeedState;