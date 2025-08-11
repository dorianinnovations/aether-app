/**
 * Chat Welcome Component
 * Displays the dynamic greeting banner with shimmer animation
 */

import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { ShimmerText } from '../../../design-system/components/atoms/ShimmerText';

interface ChatWelcomeProps {
  greetingText: string;
  showGreeting: boolean;
  greetingAnimY: Animated.Value;
  greetingOpacity: Animated.Value;
  theme: 'light' | 'dark';
}

export const ChatWelcome: React.FC<ChatWelcomeProps> = ({
  greetingText,
  showGreeting,
  greetingAnimY,
  greetingOpacity,
  theme,
}) => {
  if (!greetingText || !showGreeting) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.greetingBanner,
        {
          transform: [{ translateY: greetingAnimY }],
          opacity: greetingOpacity,
        }
      ]}
    >
      <ShimmerText 
        style={{
          ...styles.greetingText,
          color: theme === 'dark' ? '#4d4d4dff' : '#8a8a8a',
        }}
        intensity="subtle"
        duration={3000}
        waveWidth="wide"
        animationMode="greeting-once"
      >
        {greetingText}
      </ShimmerText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  greetingBanner: {
    position: 'absolute',
    top: 92,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 1,
    transform: [{ translateY: -12 }],
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Poppins-Regular',
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 24,
  },
});