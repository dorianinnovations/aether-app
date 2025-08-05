/**
 * Simple Fast Transition
 * Lightweight screen transition for smooth navigation
 */

import { StackCardInterpolationProps } from '@react-navigation/stack';

export const colorFadeTransition = ({
  current,
  layouts,
}: StackCardInterpolationProps) => {
  // Simple slide in from right
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.width * 0.3, 0],
    extrapolate: 'clamp',
  });

  // Quick fade in
  const opacity = current.progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
    extrapolate: 'clamp',
  });

  return {
    cardStyle: {
      transform: [{ translateX }],
      opacity,
    },
  };
};