/**
 * Community Chip Component (Atom)
 * Small chip component for community selection
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

// Types
import type { CommunityChipProps } from '../types';

// Hooks
import { useTheme } from '../../../hooks/useTheme';

// Tokens
import { getThemeColors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import { typography } from '../../../design-system/tokens/typography';

export const CommunityChip: React.FC<CommunityChipProps> = ({
  community,
  selected = false,
  onPress,
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(community);
  };

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected ? community.color : themeColors.surface,
          borderColor: community.color,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: selected ? '#ffffff' : community.color,
          },
        ]}
      >
        {community.name}
      </Text>
      {community.memberCount && (
        <Text
          style={[
            styles.memberCount,
            {
              color: selected ? '#ffffff' : themeColors.textMuted,
            },
          ]}
        >
          {community.memberCount}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  memberCount: {
    ...typography.caption,
    fontSize: 10,
  },
});
