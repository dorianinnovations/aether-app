import React from 'react';
import { Animated } from 'react-native';
import type { ThemeMode } from '../../../contexts/ThemeContext';
import { FloatingButtonBar } from '../molecules/FloatingButtonBar';
import { FloatingActionButton, FloatingButtonSeparator } from '../atoms';
import { AnimatedHamburger } from '../atoms';

interface ChatFloatingActionsProps {
  theme: ThemeMode;
  slideAnimation: Animated.Value;
  visible: boolean;
  hamburgerOpen: boolean;
  onConversationsPress: () => void;
  onMenuPress: () => void;
}

export const ChatFloatingActions: React.FC<ChatFloatingActionsProps> = ({
  theme,
  slideAnimation,
  visible,
  hamburgerOpen,
  onConversationsPress,
  onMenuPress,
}) => {
  return (
    <FloatingButtonBar
      theme={theme}
      slideAnimation={slideAnimation}
      visible={visible}
    >

      {/* Conversations Button */}
      <FloatingActionButton
        iconName="chatbubbles-outline"
        iconColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'}
        onPress={onConversationsPress}
        theme={theme}
      />

      <FloatingButtonSeparator theme={theme} />

      {/* Menu Button */}
      <FloatingActionButton
        iconName="menu" // This will be overridden by children
        onPress={onMenuPress}
        theme={theme}
      >
        <AnimatedHamburger
          isOpen={hamburgerOpen}
          color={theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'}
          size={22}
        />
      </FloatingActionButton>
    </FloatingButtonBar>
  );
};