import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ThemeMode } from '../../../contexts/ThemeContext';

interface FloatingButtonSeparatorProps {
  theme: ThemeMode;
}

export const FloatingButtonSeparator: React.FC<FloatingButtonSeparatorProps> = ({
  theme,
}) => {
  return (
    <View style={[
      styles.separator,
      {
        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }
    ]} />
  );
};

const styles = StyleSheet.create({
  separator: {
    height: 1,
    width: '100%',
  },
});