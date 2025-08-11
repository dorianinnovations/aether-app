/**
 * Message Animations Hook
 * Handles entrance animations for message bubbles
 */

import { useRef, useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

export const useMessageAnimations = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Animate message entrance with fade in and slide up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const animationStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  return {
    isVisible,
    animationStyle,
    fadeAnim,
    slideAnim,
  };
};