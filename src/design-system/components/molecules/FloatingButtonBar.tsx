import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { ThemeMode } from '../../../contexts/ThemeContext';
import { spacing } from '../../tokens/spacing';

interface FloatingButtonBarProps {
  children: React.ReactNode;
  theme: ThemeMode;
  slideAnimation: Animated.Value;
  visible?: boolean;
}

export const FloatingButtonBar: React.FC<FloatingButtonBarProps> = ({
  children,
  theme,
  slideAnimation,
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.floatingButtonBar,
      {
        backgroundColor: 'rgba(26, 26, 26, 0.9)',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        transform: [{ translateX: slideAnimation }],
      }
    ]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingButtonBar: {
    position: 'absolute',
    bottom: 120, // Position above input area
    right: spacing[2],
    flexDirection: 'column',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    zIndex: 1000,
    overflow: 'hidden',
  },
});