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
import { useSettings } from '../../../hooks/useSettings';

interface PageBackgroundProps {
  theme?: 'light' | 'dark';
  children: React.ReactNode;
  variant?: 'default' | 'auth' | 'hero' | 'profile' | 'chat' | 'friends' | 'dashboard' | 'onboarding' | 'social' | 'insights' | 'dive';
  style?: ViewStyle;
}

export const PageBackground: React.FC<PageBackgroundProps> = ({
  theme = 'light',
  children,
  variant = 'default',
  style,
}) => {
  const { settings } = useSettings();

  const dreamyGradientColors = ['#ffffff', '#f2f8ff', '#e2f0ff', '#eaf4ff', '#f4faff'];
  
  // Consistent background (slightly brightened)
  const darkGrey = '#1A1A1A';
  
  //chat screen specifically
  const chatDarkGrey = '#141414ff';

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
          ? ['#f8f8f8', '#f5f5f5', '#f7f7f7'] // Contrasting off-white
          : [darkGrey, '#1A1A1A', darkGrey];
      
      case 'chat':
        return theme === 'light'
          ? dreamyGradientColors // Keep blue as is
          : [chatDarkGrey, chatDarkGrey, chatDarkGrey];
      
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
      
      case 'dive':
        return theme === 'light'
          ? ['#f0f8ff', '#e6f3ff', '#f5faff'] // Very light blue for deep exploration
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
    const backgroundColor = variant === 'chat' ? chatDarkGrey : darkGrey;
    return (
      <View 
        style={[
          styles.container,
          { backgroundColor },
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
      colors={getGradientColors() as unknown as readonly [string, string, ...string[]]}
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