import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ThemeMode } from '../../../contexts/ThemeContext';

interface FloatingActionButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  onPress?: () => void;
  activeOpacity?: number;
  children?: React.ReactNode;
  theme?: ThemeMode;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  iconName,
  iconSize = 22,
  iconColor,
  onPress,
  activeOpacity = 0.8,
  children,
  theme = 'dark',
}) => {
  // Default theme-aware icon color if none provided
  const defaultIconColor = theme === 'dark' 
    ? 'rgba(255, 255, 255, 0.8)' 
    : 'rgba(0, 0, 0, 0.8)';
  
  const finalIconColor = iconColor || defaultIconColor;
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={styles.floatingButtonItem}
      onPress={handlePress}
      activeOpacity={activeOpacity}
    >
      {children || (
        <Ionicons
          name={iconName}
          size={iconSize}
          color={finalIconColor}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButtonItem: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});