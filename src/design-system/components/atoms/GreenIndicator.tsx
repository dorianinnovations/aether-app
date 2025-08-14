import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

interface GreenIndicatorProps {
  visible: boolean;
  animation: Animated.Value;
  size?: number;
}

export const GreenIndicator: React.FC<GreenIndicatorProps> = ({
  visible,
  animation,
  size = 20,
}) => {
  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.greenIndicator,
      {
        opacity: animation.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0, 1, 0],
        }),
        transform: [
          {
            translateX: animation.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [0, 0, 60], // Slide 60px to the right when hiding
            })
          },
          {
            scale: animation.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [0.3, 1, 0.8],
            })
          }
        ],
      }
    ]}>
      <LottieView
        source={require('../../../../assets/AetherLiveStatusGreen.json')}
        autoPlay
        loop={false}
        style={[styles.lottieAnimation, { width: size, height: size }]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  greenIndicator: {
    position: 'absolute',
    right: -12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 20,
    height: 20,
  },
});