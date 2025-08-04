/**
 * Web Search Result - Displays individual search results
 * Part of the molecular design system for Aether App
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import Icon from '../atoms/Icon';

interface WebSearchResultProps {
  result: {
    title: string;
    snippet: string;
    url: string;
    source?: string;
    position?: number;
  };
  onPress?: () => void;
}

const WebSearchResult: React.FC<WebSearchResultProps> = ({
  result,
  onPress
}) => {
  const { colors, theme } = useTheme();

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

  return (
    <TouchableOpacity
      style={[
        styles.container,
        getGlassmorphicStyle('card', theme),
        { borderColor: colors.borders.default }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
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
        <Text
          style={[
            styles.domain,
            { color: colors.textSecondary }
          ]}
        >
          {getDomainFromUrl(result.url)}
        </Text>
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
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: spacing[2],
    padding: spacing[4],
  },
  header: {
    marginBottom: spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  title: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing[2],
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