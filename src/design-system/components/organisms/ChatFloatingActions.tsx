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
  onTrioPress: () => void;
  onConversationsPress: () => void;
  onMenuPress: () => void;
}

export const ChatFloatingActions: React.FC<ChatFloatingActionsProps> = ({
  theme,
  slideAnimation,
  visible,
  hamburgerOpen,
  onTrioPress,
  onConversationsPress,
  onMenuPress,
}) => {
  return (
    <FloatingButtonBar
      theme={theme}
      slideAnimation={slideAnimation}
      visible={visible}
    >
      {/* Trio Options Button */}
      <FloatingActionButton
        iconName="finger-print-outline"
        iconColor="rgba(255, 255, 255, 0.6)"
        onPress={onTrioPress}
      />

      <FloatingButtonSeparator theme={theme} />

      {/* Conversations Button */}
      <FloatingActionButton
        iconName="chatbubbles-outline"
        iconColor="rgba(255, 255, 255, 0.8)"
        onPress={onConversationsPress}
      />

      <FloatingButtonSeparator theme={theme} />

      {/* Menu Button */}
      <FloatingActionButton
        iconName="menu" // This will be overridden by children
        onPress={onMenuPress}
      >
        <AnimatedHamburger
          isOpen={hamburgerOpen}
          color="rgba(255, 255, 255, 0.9)"
          size={22}
        />
      </FloatingActionButton>
    </FloatingButtonBar>
  );
};