import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface FloatingActionButtonProps {
  iconName: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  iconColor?: string;
  onPress?: () => void;
  activeOpacity?: number;
  children?: React.ReactNode;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  iconName,
  iconSize = 22,
  iconColor = 'rgba(255, 255, 255, 0.8)',
  onPress,
  activeOpacity = 0.8,
  children,
}) => {
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
          color={iconColor}
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