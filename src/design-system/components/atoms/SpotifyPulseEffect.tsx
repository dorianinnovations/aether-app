import React from 'react';
import { Animated } from 'react-native';
import type { ThemeMode } from '../../../contexts/ThemeContext';

interface SpotifyPulseEffectProps {
  children: React.ReactNode;
  pulseAnimation: Animated.Value;
  scaleAnimation: Animated.Value;
  theme: ThemeMode;
  style?: any;
}

export const SpotifyPulseEffect: React.FC<SpotifyPulseEffectProps> = ({
  children,
  pulseAnimation,
  scaleAnimation,
  theme,
  style,
}) => {
  return (
    <Animated.View 
      style={[
        {
          transform: [{ scale: scaleAnimation }],
        }
      ]}
    >
      <Animated.View 
        style={[
          style,
          {
            borderColor: pulseAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [
                theme === 'dark' ? 'rgba(120, 120, 120, 0.2)' : 'rgba(160, 160, 160, 0.15)', // Start neutral
                theme === 'dark' ? 'rgba(29, 185, 84, 0.5)' : 'rgba(29, 185, 84, 0.4)', // Pulse to green
              ],
            }),
            shadowColor: '#1DB954', // Spotify green
            shadowOpacity: pulseAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.25], // Much subtler shadow range
            }),
            shadowRadius: pulseAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [2, 6], // Smaller shadow radius
            }),
            shadowOffset: {
              width: 0,
              height: 0,
            },
            elevation: pulseAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 3], // Much subtler elevation
            }),
          }
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
};