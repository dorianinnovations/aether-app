/**
 * Custom hook for managing keyboard animations and state
 */
import { useState, useEffect, useRef } from 'react';
import { Keyboard, Animated, Easing, Platform } from 'react-native';

interface UseKeyboardAnimationReturn {
  keyboardHeight: number;
  greetingAnimY: Animated.Value;
  greetingOpacity: Animated.Value;
}

export const useKeyboardAnimation = (): UseKeyboardAnimationReturn => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const greetingAnimY = useRef(new Animated.Value(0)).current;
  const greetingOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Use appropriate events based on platform
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardShowListener = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      // Silky smooth upward movement with refined physics
      Animated.parallel([
        Animated.timing(greetingAnimY, {
          toValue: -80, // Reduced from -120 for subtler movement
          duration: 350, // Faster but still smooth
          easing: Easing.bezier(0.33, 1, 0.68, 1), // Custom smooth curve (ease-out-cubic)
          useNativeDriver: true,
        }),
        Animated.timing(greetingOpacity, {
          toValue: 0.75, // Slightly more visible
          duration: 300,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Smooth ease-out
          useNativeDriver: true,
        })
      ]).start();
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      // Smooth return animation
      Animated.parallel([
        Animated.timing(greetingAnimY, {
          toValue: 0,
          duration: 300,
          easing: Easing.bezier(0.33, 1, 0.68, 1), // Matching smooth curve
          useNativeDriver: true,
        }),
        Animated.timing(greetingOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // Smooth ease-out
          useNativeDriver: true,
        })
      ]).start();
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [greetingAnimY, greetingOpacity]);

  return {
    keyboardHeight,
    greetingAnimY,
    greetingOpacity,
  };
};