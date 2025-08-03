/**
 * Web Search Indicator - Shows when web search is active
 * Part of the atomic design system for Aether App
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import Icon from './Icon';

interface WebSearchIndicatorProps {
  isSearching: boolean;
  searchQuery?: string;
  resultCount?: number;
}

const WebSearchIndicator: React.FC<WebSearchIndicatorProps> = ({
  isSearching,
  searchQuery,
  resultCount
}) => {
  const { colors } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isSearching ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isSearching]);

  if (!isSearching && !resultCount) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.primary,
          opacity: animatedValue,
        }
      ]}
    >
      <View style={styles.content}>
        <Icon
          name={isSearching ? "search" : "check-circle"}
          size={16}
          color={colors.primary}
        />
        <Text
          style={[
            styles.text,
            { color: colors.text }
          ]}
        >
          {isSearching 
            ? `Searching web for: ${searchQuery?.slice(0, 30)}...`
            : `Found ${resultCount} web results`
          }
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  text: {
    fontFamily: typography.fonts.body,
    fontSize: 12,
    flex: 1,
  },
});

export default WebSearchIndicator;