/**
 * Aether Design System - Page Background Component
 * The dreamy baby blue gradient standard from aether-mobile ✨
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { designTokens, getThemeColors } from '../../tokens/colors';
import { useSettings } from '../../../hooks/useSettings';

interface PageBackgroundProps {
  theme?: 'light' | 'dark';
  children: React.ReactNode;
  variant?: 'default' | 'auth' | 'hero' | 'profile' | 'chat' | 'friends' | 'dashboard' | 'onboarding' | 'social' | 'insights' | 'feed';
  style?: ViewStyle;
}

export const PageBackground: React.FC<PageBackgroundProps> = ({
  theme = 'light',
  children,
  variant = 'default',
  style,
}) => {
  const themeColors = getThemeColors(theme);
  const { settings } = useSettings();

  // The dreamy baby blue gradient colors - brighter (closer to white)!
  const dreamyGradientColors = ['#ffffff', '#f2f8ff', '#e2f0ff', '#eaf4ff', '#f4faff'];
  
  // Consistent dark grey background
  const darkGrey = '#0F0F0F';

  const getGradientColors = (): string[] => {
    // If white background is selected and it's light theme, use pure white
    if (settings.backgroundType === 'white' && theme === 'light') {
      return ['#ffffff', '#ffffff', '#ffffff'];
    }

    switch (variant) {
      case 'hero':
        return theme === 'light' 
          ? ['#C6D2FF', '#A4F4CF', '#FEE685'] // Soft Blue-Green-Yellow from aether
          : [darkGrey, '#1A1A1A', darkGrey];
      
      case 'auth':
        return theme === 'light'
          ? dreamyGradientColors
          : [darkGrey, '#1A1A1A', darkGrey];
      
      case 'profile':
        return theme === 'light'
          ? ['#fdfefe', '#fcfdfc', '#fdfefd'] // Very light sage
          : [darkGrey, '#1A1A1A', darkGrey]; // Consistent dark
      
      case 'chat':
        return theme === 'light'
          ? dreamyGradientColors // Keep blue as is
          : [darkGrey, '#1A1A1A', darkGrey];
      
      case 'friends':
        return theme === 'light'
          ? ['#fffefe', '#fffcfc', '#fffdfd'] // Very light coral
          : [darkGrey, '#1A1A1A', darkGrey]; // Consistent dark
      
      case 'dashboard':
        return theme === 'light'
          ? ['#fefefe', '#fdfdfd', '#fefefe'] // Very light pearl
          : [darkGrey, '#1A1A1A', darkGrey]; // Consistent dark
      
      case 'onboarding':
        return theme === 'light'
          ? dreamyGradientColors // Keep blue as is
          : [darkGrey, '#1A1A1A', darkGrey];
      
      case 'social':
        return theme === 'light'
          ? ['#fefeff', '#fdfeff', '#fefeff'] // Very light lavender
          : [darkGrey, '#1A1A1A', darkGrey]; // Consistent dark
      
      case 'insights':
        return theme === 'light'
          ? ['#fffffe', '#fffffe', '#fffffe'] // Very light cream
          : [darkGrey, '#1A1A1A', darkGrey]; // Consistent dark
      
      case 'feed':
        return theme === 'light'
          ? ['#fefefe', '#fdfdfd', '#fefefe'] // Very light pearl
          : [darkGrey, '#1A1A1A', darkGrey]; // Consistent dark
      
      default:
        return theme === 'light' 
          ? dreamyGradientColors 
          : [darkGrey, '#1A1A1A', darkGrey];
    }
  };

  // For light mode with white background selected, use solid white
  if (theme === 'light' && settings.backgroundType === 'white') {
    return (
      <View 
        style={[
          styles.container,
          { backgroundColor: '#ffffff' },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // For dark mode, use solid charcoal (matching aether-mobile exactly)
  if (theme === 'dark') {
    return (
      <View 
        style={[
          styles.container,
          { backgroundColor: darkGrey },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Light mode with dreamy gradients
  return (
    <LinearGradient
      colors={getGradientColors() as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PageBackground;