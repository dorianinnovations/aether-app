/**
 * SocialLinksBar Atom
 * Compact vertical list of social platform icons
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing } from '../../tokens/spacing';

export interface SocialLinks {
  instagram?: string;
  x?: string;
  spotify?: string;
  facebook?: string;
  website?: string;
}

export interface SocialLinksBarProps {
  /** Social links data */
  socialLinks?: SocialLinks;
  /** Custom styling */
  style?: ViewStyle;
  /** Icon size */
  iconSize?: number;
}

// Platform configuration
const platformConfig = {
  instagram: {
    icon: 'instagram',
    buildUrl: (username: string) => `https://instagram.com/${username}`,
  },
  x: {
    icon: 'twitter',
    buildUrl: (username: string) => `https://x.com/${username}`,
  },
  spotify: {
    icon: 'music',
    buildUrl: (url: string) => url.startsWith('http') ? url : `https://open.spotify.com/user/${url}`,
  },
  facebook: {
    icon: 'facebook',
    buildUrl: (username: string) => `https://facebook.com/${username}`,
  },
  website: {
    icon: 'globe',
    buildUrl: (url: string) => url.startsWith('http') ? url : `https://${url}`,
  },
} as const;

export const SocialLinksBar: React.FC<SocialLinksBarProps> = ({
  socialLinks,
  style,
  iconSize = 20,
}) => {
  const { colors } = useTheme();

  if (!socialLinks) return null;

  const handlePress = (platform: keyof typeof platformConfig, value: string) => {
    const config = platformConfig[platform];
    const url = config.buildUrl(value);
    
    Linking.openURL(url).catch(() => {
      console.warn('Failed to open URL:', url);
    });
  };

  // Filter out empty values and create icon list
  const availableLinks = Object.entries(socialLinks)
    .filter(([_, value]) => value && value.trim() !== '')
    .map(([platform, value]) => ({
      platform: platform as keyof typeof platformConfig,
      value: value!,
      config: platformConfig[platform as keyof typeof platformConfig],
    }));

  if (availableLinks.length === 0) return null;

  // Use grid layout for better space utilization
  const shouldUseGrid = availableLinks.length > 3;
  const iconsPerColumn = Math.ceil(availableLinks.length / 2);
  
  return (
    <View style={[styles.container, shouldUseGrid && styles.gridContainer, style]}>
      {shouldUseGrid ? (
        // Grid layout for 4+ icons
        <View style={styles.gridWrapper}>
          <View style={styles.column}>
            {availableLinks.slice(0, iconsPerColumn).map(({ platform, value, config }) => (
              <TouchableOpacity
                key={platform}
                onPress={() => handlePress(platform, value)}
                style={styles.gridIconButton}
                activeOpacity={0.7}
              >
                <Feather
                  name={config.icon as any}
                  size={iconSize}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.column}>
            {availableLinks.slice(iconsPerColumn).map(({ platform, value, config }) => (
              <TouchableOpacity
                key={platform}
                onPress={() => handlePress(platform, value)}
                style={styles.gridIconButton}
                activeOpacity={0.7}
              >
                <Feather
                  name={config.icon as any}
                  size={iconSize}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        // Single column for 1-3 icons
        availableLinks.map(({ platform, value, config }, index) => (
          <TouchableOpacity
            key={platform}
            onPress={() => handlePress(platform, value)}
            style={[
              styles.iconButton,
              index < availableLinks.length - 1 && styles.iconButtonSpacing
            ]}
            activeOpacity={0.7}
          >
            <Feather
              name={config.icon as any}
              size={iconSize}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  gridContainer: {
    alignItems: 'flex-start',
  },
  gridWrapper: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  column: {
    alignItems: 'center',
  },
  iconButton: {
    padding: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonSpacing: {
    marginBottom: spacing[1],
  },
  gridIconButton: {
    padding: spacing[1],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
});

export default SocialLinksBar;