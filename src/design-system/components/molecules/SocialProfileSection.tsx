/**
 * SocialProfileSection Molecule
 * Component for displaying social profile data (mood, plans, Spotify, etc.)
 */

import React from 'react';
import {
  View,
  Text,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ProfileField } from '../atoms';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

export interface SocialProfile {
  currentStatus?: string;
  mood?: string;
  currentPlans?: string;
  spotify?: {
    connected: boolean;
    currentTrack?: {
      name: string;
      artist: string;
    };
    recentTracks?: Array<{
      name: string;
      artist: string;
    }>;
  };
}

export interface SocialProfileSectionProps {
  /** Social profile data */
  socialProfile?: SocialProfile;
  /** Custom styles */
  style?: ViewStyle;
}

export const SocialProfileSection: React.FC<SocialProfileSectionProps> = ({
  socialProfile,
  style,
}) => {
  const { colors } = useTheme();

  if (!socialProfile) {
    return null;
  }

  const containerStyle: ViewStyle = {
    gap: spacing[3],
    ...style,
  };

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  };

  const cardStyle: ViewStyle = {
    padding: spacing[3],
    borderRadius: 12,
    backgroundColor: colors.surface,
  };

  const labelStyle: TextStyle = {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing[1],
  };

  const valueStyle: TextStyle = {
    ...typography.textStyles.bodyLarge,
    color: colors.text,
  };


  return (
    <View style={containerStyle}>
      {/* Current Status */}
      {socialProfile.currentStatus && (
        <ProfileField
          label="Current Status"
          value={`"${socialProfile.currentStatus}"`}
          valueStyle={{ fontStyle: 'italic' }}
        />
      )}

      {/* Mood & Plans Row */}
      <View style={rowStyle}>
        {/* Mood */}
        {socialProfile.mood && (
          <View style={[cardStyle, { minWidth: 100, alignItems: 'center' }]}>
            <Text style={labelStyle}>Mood</Text>
            <Text style={[valueStyle, { fontWeight: '600', textTransform: 'capitalize' }]}>
              {socialProfile.mood}
            </Text>
          </View>
        )}

        {/* Current Plans */}
        {socialProfile.currentPlans && (
          <View style={[cardStyle, { flex: 1, marginLeft: socialProfile.mood ? spacing[2] : 0 }]}>
            <Text style={labelStyle}>Plans</Text>
            <Text style={[valueStyle, { fontSize: 14 }]}>
              {socialProfile.currentPlans}
            </Text>
          </View>
        )}
      </View>

    </View>
  );
};

// Styles defined inline for better component encapsulation

export default SocialProfileSection;