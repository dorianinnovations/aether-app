/**
 * Web Search Result - Displays individual search results
 * Part of the molecular design system for Aether App
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { createNeumorphicContainer } from '../../tokens/shadows';
import Icon from '../atoms/Icon';

interface WebSearchResultProps {
  result: {
    title: string;
    snippet: string;
    url: string;
    source?: string;
    position?: number;
    thumbnail?: string;
    image?: string;
  };
  onPress?: () => void;
}

const WebSearchResult: React.FC<WebSearchResultProps> = ({
  result,
  onPress
}) => {
  const { colors, theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Linking.openURL(result.url);
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Color-coded site-specific icons
  const getSiteIcon = (domain: string) => {
    const cleanDomain = domain.toLowerCase().replace('www.', '');
    
    switch (cleanDomain) {
      case 'google.com':
      case 'google':
        return { name: 'google', color: '#4285f4' };
      case 'github.com':
      case 'github':
        return { name: 'github', color: '#333' };
      case 'stackoverflow.com':
      case 'stackoverflow':
        return { name: 'stack-overflow', color: '#f48024' };
      case 'twitter.com':
      case 'x.com':
      case 'twitter':
        return { name: 'twitter', color: '#1da1f2' };
      case 'linkedin.com':
      case 'linkedin':
        return { name: 'linkedin', color: '#0077b5' };
      case 'youtube.com':
      case 'youtube':
        return { name: 'youtube', color: '#ff0000' };
      case 'reddit.com':
      case 'reddit':
        return { name: 'reddit', color: '#ff4500' };
      case 'medium.com':
      case 'medium':
        return { name: 'medium', color: '#00ab6c' };
      case 'dev.to':
      case 'dev':
        return { name: 'dev', color: '#0a0a0a' };
      case 'wikipedia.org':
      case 'wikipedia':
        return { name: 'wikipedia-w', color: '#000' };
      case 'npmjs.com':
      case 'npm':
        return { name: 'npm', color: '#cb3837' };
      case 'codepen.io':
      case 'codepen':
        return { name: 'codepen', color: '#000' };
      case 'dribbble.com':
      case 'dribbble':
        return { name: 'dribbble', color: '#ea4c89' };
      case 'behance.net':
      case 'behance':
        return { name: 'behance', color: '#0057ff' };
      case 'instagram.com':
      case 'instagram':
        return { name: 'instagram', color: '#e4405f' };
      case 'facebook.com':
      case 'facebook':
        return { name: 'facebook', color: '#1877f2' };
      case 'hackernews.com':
      case 'news.ycombinator.com':
        return { name: 'hacker-news', color: '#ff6600' };
      case 'discord.com':
      case 'discord':
        return { name: 'discord', color: '#7289da' };
      case 'twitch.tv':
      case 'twitch':
        return { name: 'twitch', color: '#9146ff' };
      default:
        return { name: 'globe', color: theme === 'dark' ? colors.textMuted : colors.textSecondary };
    }
  };

  const getThumbnailUrl = () => {
    // Try multiple possible image fields
    return result.thumbnail || result.image || null;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const thumbnailUrl = getThumbnailUrl();
  const domain = getDomainFromUrl(result.url);
  const siteIcon = getSiteIcon(domain);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        createNeumorphicContainer(theme, 'elevated'),
        { backgroundColor: colors.surface }
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.mainContent}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: colors.primary }
              ]}
              numberOfLines={2}
            >
              {result.title}
            </Text>
            <Icon
              name="external-link"
              size={14}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.domainRow}>
            <FontAwesome5
              name={siteIcon.name as keyof typeof FontAwesome5.glyphMap}
              size={12}
              color={siteIcon.color}
              style={styles.domainIcon}
            />
            <Text
              style={[
                styles.domain,
                { color: colors.textSecondary }
              ]}
            >
              {domain}
            </Text>
          </View>
        </View>
        
        {/* Micro Thumbnail */}
        {thumbnailUrl && !imageError && (
          <View style={[
            styles.thumbnailContainer,
            {
              backgroundColor: colors.surfaces.elevated,
              borderColor: colors.borders.subtle,
            }
          ]}>
            <Image
              source={{ uri: thumbnailUrl }}
              style={styles.thumbnail}
              onLoad={handleImageLoad}
              onError={handleImageError}
              resizeMode="cover"
            />
            {imageLoading && (
              <View style={[
                styles.thumbnailPlaceholder,
                { backgroundColor: colors.surfaces.sunken }
              ]}>
                <Icon
                  name="image"
                  size={12}
                  color={colors.textMuted}
                />
              </View>
            )}
          </View>
        )}
        
        {/* Color-coded site icon fallback */}
        {(!thumbnailUrl || imageError) && (
          <View style={[
            styles.fallbackIcon,
            {
              backgroundColor: colors.surfaces.elevated,
              borderColor: colors.borders.subtle,
            }
          ]}>
            <FontAwesome5
              name={siteIcon.name as keyof typeof FontAwesome5.glyphMap}
              size={18}
              color={siteIcon.color}
            />
          </View>
        )}
      </View>
      
      <Text
        style={[
          styles.snippet,
          { color: colors.text }
        ]}
        numberOfLines={3}
      >
        {result.snippet}
      </Text>

      {result.position && (
        <View style={styles.meta}>
          <Text
            style={[
              styles.position,
              { color: colors.textSecondary }
            ]}
          >
            Result #{result.position}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginVertical: spacing[2],
    padding: spacing[4],
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing[3],
    alignItems: 'flex-start',
  },
  mainContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  thumbnailContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing[2],
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  domainIcon: {
    marginRight: spacing[1],
  },
  domain: {
    fontFamily: typography.fonts.body,
    fontSize: 12,
    fontWeight: '500',
  },
  snippet: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    marginTop: spacing[3],
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  position: {
    fontFamily: typography.fonts.body,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default WebSearchResult;