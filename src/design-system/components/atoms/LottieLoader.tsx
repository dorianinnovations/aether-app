/**
 * Aether Design System - Lottie Loader Component
 * Reusable loading animation using Lottie
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieLoaderProps {
  size?: 'small' | 'medium' | 'large' | number;
  color?: string; // Note: This won't affect the Lottie animation colors, but included for API compatibility
  style?: ViewStyle;
}

export const LottieLoader: React.FC<LottieLoaderProps> = ({
  size = 'medium',
  color: _color, // Kept for compatibility but not used since Lottie colors are baked in
  style,
}) => {
  const getDimensions = () => {
    if (typeof size === 'number') {
      return { width: size * 1.5, height: size };
    }
    
    switch (size) {
      case 'small':
        return { width: 52, height: 35 };
      case 'medium':
        return { width: 68, height: 45 };
      case 'large':
        return { width: 98, height: 65 };
      default:
        return { width: 68, height: 45 };
    }
  };

  const { width, height } = getDimensions();

  return (
    <View style={[styles.container, style]}>
      <LottieView
        source={require('../../../../assets/AetherSpinner.json')}
        autoPlay
        loop
        style={{
          width: width,
          height: height,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LottieLoader;