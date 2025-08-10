/**
 * ProminentUserDisplay Atom
 * Large, prominent display for username and handle
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing } from '../../tokens/spacing';
import { UserBadge, UserBadgeType } from './UserBadge';

export interface ProminentUserDisplayProps {
  /** Display name (full name) */
  displayName?: string;
  /** Username/handle */
  username: string;
  /** User badges */
  badges?: Array<{
    id: string;
    badgeType: UserBadgeType;
    isVisible: boolean;
  }>;
  /** Custom container style */
  style?: ViewStyle;
  /** Custom display name style */
  displayNameStyle?: TextStyle;
  /** Custom username style */
  usernameStyle?: TextStyle;
}

export const ProminentUserDisplay: React.FC<ProminentUserDisplayProps> = ({
  displayName,
  username,
  badges,
  style,
  displayNameStyle,
  usernameStyle,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Display Name - Large and Bold */}
      {displayName && (
        <Text
          style={[
            styles.displayName,
            { color: colors.text },
            displayNameStyle,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {displayName}
        </Text>
      )}

      {/* Username/Handle with Badges */}
      <View style={styles.usernameRow}>
        <Text
          style={[
            styles.username,
            { color: colors.textSecondary },
            usernameStyle,
          ]}
          numberOfLines={1}
        >
          {username}
        </Text>

        {/* Badges */}
        {badges && badges.length > 0 && (
          <View style={styles.badgeContainer}>
            {badges.filter(badge => badge.isVisible).map((badge) => (
              <UserBadge
                key={badge.id}
                type={badge.badgeType}
                style={styles.badge}
                glowIntensity="high"
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  displayName: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  username: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: -0.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  badge: {
    // Badge styles handled by UserBadge component
  },
});

export default ProminentUserDisplay;