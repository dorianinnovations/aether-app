/**
 * Scroll to Bottom FAB Component
 * Shows a floating action button when not near bottom of messages
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ScrollToBottomFabProps {
  visible: boolean;
  onPress: () => void;
  theme: 'light' | 'dark';
}

export const ScrollToBottomFab: React.FC<ScrollToBottomFabProps> = ({
  visible,
  onPress,
  theme,
}) => {
  if (!visible) {
    return null;
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.scrollToBottomButton,
        {
          backgroundColor: theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.05)',
          borderColor: theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.15)' 
            : 'rgba(0, 0, 0, 0.1)',
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="chevron-down" 
        size={20} 
        color={theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  scrollToBottomButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 5,
  },
});