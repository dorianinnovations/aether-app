/**
 * ProfileSection Component
 * Manages profile display and relationship badges for posts
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Types
import type { ProfileData, CardPreferences } from './types';

// Hooks
import { useTheme } from '../../../hooks/useTheme';

// Tokens
import { getThemeColors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';

interface ProfileSectionProps {
  profile: ProfileData;
  preferences: CardPreferences;
  showTimestamp?: boolean;
  timestamp?: string;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  preferences,
  showTimestamp = false,
  timestamp
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  // Get dynamic text sizes based on preferences
  const getTextSize = (base: number) => {
    switch (preferences.textSize) {
      case 'small': return base - 2;
      case 'large': return base + 2;
      default: return base;
    }
  };

  const getProfileSectionStyle = () => {
    const baseStyle = {
      backgroundColor: `${profile.color}08`,
      borderColor: `${profile.color}20`,
      borderRadius: 16,
      padding: spacing[4],
      borderWidth: 1,
    };

    switch (preferences.profilePlacement) {
      case 'top-left':
        return { ...baseStyle, alignItems: 'flex-start' as const };
      case 'top-center':
        return { ...baseStyle, alignItems: 'center' as const };
      case 'top-right':
        return { ...baseStyle, alignItems: 'flex-end' as const };
      case 'bottom-left':
        return { ...baseStyle, position: 'absolute' as const, bottom: spacing[4], left: spacing[4], zIndex: 2 };
      case 'bottom-right':
        return { ...baseStyle, position: 'absolute' as const, bottom: spacing[4], right: spacing[4], zIndex: 2 };
      case 'inline':
        return { ...baseStyle, flexDirection: 'row' as const, alignItems: 'center' as const };
      default:
        return baseStyle;
    }
  };

  const getProfileAvatarStyle = () => {
    const baseSize = preferences.layout === 'minimal' ? 50 : 60;
    return {
      backgroundColor: `${profile.color}15`,
      borderColor: `${profile.color}30`,
      width: baseSize,
      height: baseSize,
      borderRadius: preferences.layout === 'artistic' ? baseSize / 2 : 18,
      borderWidth: 2,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: preferences.profilePlacement === 'inline' ? spacing[3] : 0,
      marginBottom: preferences.profilePlacement === 'inline' ? 0 : spacing[2],
    };
  };

  const getProfileInfoStyle = () => {
    if (preferences.profilePlacement === 'inline') {
      return { flex: 1 };
    }
    
    const alignItems = preferences.profilePlacement.includes('center') 
      ? 'center' as const
      : preferences.profilePlacement.includes('right') 
        ? 'flex-end' as const 
        : 'flex-start' as const;
    
    return { alignItems };
  };

  const getProfileEmojiSize = () => {
    switch (preferences.layout) {
      case 'minimal':
        return 24;
      case 'artistic':
        return 32;
      default:
        return 28;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.profileSection, getProfileSectionStyle()]}>
        <View style={[styles.profileAvatar, getProfileAvatarStyle()]}>
          <Text style={[styles.profileEmoji, { fontSize: getProfileEmojiSize() }]}>
            {profile.avatar}
          </Text>
        </View>
        
        <View style={getProfileInfoStyle()}>
          <Text style={[styles.profileName, {
            fontSize: getTextSize(18),
            fontFamily: preferences.textStyle === 'bold' ? 'Nunito-Bold' : 
                       preferences.textStyle === 'elegant' ? 'Nunito-Light' : 'Nunito-SemiBold',
            fontWeight: preferences.textStyle === 'bold' ? '700' : 
                       preferences.textStyle === 'elegant' ? '300' : '600',
            color: themeColors.text,
            marginBottom: spacing[1],
          }]}>
            {profile.name}
          </Text>
          
          <View style={styles.relationshipRow}>
            <View style={[styles.relationshipBadge, {
              backgroundColor: profile.color,
              paddingHorizontal: spacing[2],
              paddingVertical: 2,
              borderRadius: 8,
              marginRight: spacing[2],
            }]}>
              <Text style={[styles.relationshipText, {
                fontSize: getTextSize(10),
                fontFamily: 'Nunito-SemiBold',
                fontWeight: '600',
                color: 'white',
                textTransform: 'uppercase',
              }]}>
                {profile.relationship}
              </Text>
            </View>
            
            {profile.relationshipDetail && (
              <Text style={[styles.relationshipDetail, {
                fontSize: getTextSize(12),
                fontFamily: 'Nunito-Regular',
                color: themeColors.textMuted,
              }]}>
                {profile.relationshipDetail}
              </Text>
            )}
          </View>
          
          {preferences.showLocation && profile.location && (
            <Text style={[styles.location, {
              fontSize: getTextSize(12),
              fontFamily: 'Nunito-Regular',
              color: themeColors.textMuted,
            }]}>
              {profile.location}
            </Text>
          )}
        </View>
      </View>
      
      {preferences.showTimestamp && timestamp && (
        <View style={styles.timestampContainer}>
          <Text style={[styles.timestamp, { color: themeColors.textMuted }]}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
  },
  profileSection: {
    // Styles are dynamic based on preferences
  },
  profileAvatar: {
    // Styles are dynamic based on preferences
  },
  profileEmoji: {
    // Size is dynamic based on layout
  },
  profileName: {
    // Styles are dynamic based on preferences
  },
  relationshipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  relationshipBadge: {
    // Styles are dynamic
  },
  relationshipText: {
    // Styles are dynamic
  },
  relationshipDetail: {
    // Styles are dynamic
  },
  location: {
    // Styles are dynamic
  },
  timestampContainer: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
  },
});