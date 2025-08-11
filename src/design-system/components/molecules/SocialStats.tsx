/**
 * SocialStats Molecule
 * Displays followers and following counts with full width
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing } from '../../tokens/spacing';

export interface SocialStatsProps {
  /** Friends count */
  friendsCount?: number;
  /** Followers count */
  followersCount?: number;
  /** Custom styles */
  style?: ViewStyle;
}

export const SocialStats: React.FC<SocialStatsProps> = ({
  friendsCount,
  followersCount,
  style,
}) => {
  const { colors, theme } = useTheme();
  
  // Custom subtle glassmorphism for social stats
  const subtleGlassStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.15)',
    borderWidth: 0.5,
    borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(10px)',
  };

  if (friendsCount === undefined && followersCount === undefined) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statsRow}>
        {/* Following Count */}
        {friendsCount !== undefined && (
          <View style={[styles.statItem, subtleGlassStyle]}>
            <Text style={[styles.statCount, { color: colors.textSecondary }]}>
              {friendsCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              following
            </Text>
          </View>
        )}
        
        {/* Followers Count */}
        {followersCount !== undefined && (
          <View style={[styles.statItem, subtleGlassStyle]}>
            <Text style={[styles.statCount, { color: colors.textSecondary }]}>
              {followersCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              followers
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing[5],
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  statItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
    borderRadius: 8,
    flex: 1,
    minHeight: 24,
  },
  statCount: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
    opacity: 0.8,
    marginTop: 2,
  },
});

export default SocialStats;