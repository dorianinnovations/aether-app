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
          // Container shadow as backup
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme === 'dark' ? 0.6 : 0.25,
          shadowRadius: 4,
          elevation: 4, // Android shadow
        }
      ]}
    >
      <ShimmerText 
        style={{
          ...styles.greetingText,
          color: theme === 'dark' ? '#4d4d4dff' : '#8a8a8a',
          // Stronger text shadow
          textShadowColor: theme === 'dark' ? 'rgba(0, 0, 0, 1)' : 'rgba(0, 0, 0, 0.6)',
          textShadowOffset: { width: 0, height: 3 },
          textShadowRadius: 6,
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
    fontFamily: 'mozilla text',
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 24,
  },
});