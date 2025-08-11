/**
 * useDrawerAnimation - Animation management for ConversationDrawer
 * Handles slide animations and overlay opacity
 */

import { useRef, useCallback } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const useDrawerAnimation = () => {
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.85)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Cleanup function to reset all animations
  const resetAnimations = useCallback(() => {
    slideAnim.setValue(-screenWidth * 0.85);
    overlayOpacity.setValue(0);
  }, [slideAnim, overlayOpacity]);

  // Simple show animation
  const showDrawer = useCallback((onComplete?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.7,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }, [slideAnim, overlayOpacity]);

  // Simple hide animation
  const hideDrawer = useCallback((onComplete?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth * 0.85,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetAnimations();
      onComplete?.();
    });
  }, [slideAnim, overlayOpacity, resetAnimations]);

  return {
    slideAnim,
    overlayOpacity,
    showDrawer,
    hideDrawer,
    resetAnimations,
  };
};