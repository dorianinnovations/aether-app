/**
 * useScrollToInput - Hook for centering individual input fields when tapped
 * Each input field gets centered in the available screen space (with keyboard)
 */

import { useRef } from 'react';
import { ScrollView, TextInput, Dimensions, Platform } from 'react-native';
import { useKeyboard } from './useKeyboard';

interface UseScrollToInputReturn {
  scrollViewRef: React.RefObject<ScrollView | null>;
  handleInputFocus: (inputRef: TextInput) => void;
}

export const useScrollToInput = (): UseScrollToInputReturn => {
  const scrollViewRef = useRef<ScrollView>(null);
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();

  const handleInputFocus = (inputRef: TextInput) => {
    if (!inputRef || !scrollViewRef.current) return;

    // Wait for layout and keyboard, then scroll to position the input well
    setTimeout(() => {
      inputRef.measureLayout(
        scrollViewRef.current as any,
        (x, y, width, height) => {
          // Scroll so the input appears at a good position (300px from top of screen)
          const targetScrollY = Math.max(0, y - 300);
          
          scrollViewRef.current?.scrollTo({
            y: targetScrollY,
            animated: true,
          });
        },
        () => {
          // Fallback if measure fails
          scrollViewRef.current?.scrollTo({
            y: 150,
            animated: true,
          });
        }
      );
    }, 150);
  };

  return {
    scrollViewRef,
    handleInputFocus,
  };
};