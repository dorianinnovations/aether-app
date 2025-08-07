import { useEffect, useRef } from 'react';
import { FlatList, Dimensions } from 'react-native';

interface UseScrollToBottomOptions {
  enabled?: boolean;
  delay?: number;
  inputContainerHeight?: number;
  keyboardHeight?: number;
}

export const useScrollToBottom = (
  trigger: boolean,
  options: UseScrollToBottomOptions = {}
) => {
  const { enabled = true, delay = 100, inputContainerHeight = 100, keyboardHeight = 0 } = options;
  const flatListRef = useRef<FlatList>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const prevKeyboardHeight = useRef(keyboardHeight);

  const scrollToBottom = () => {
    if (!enabled || !flatListRef.current) return;
    
    try {
      // Use scrollToEnd which should respect contentContainerStyle paddingBottom
      flatListRef.current.scrollToEnd({ 
        animated: true,
      });
    } catch (error) {
      // Silently handle scroll errors
    }
  };

  const scrollToOffset = (offset: number) => {
    if (!enabled || !flatListRef.current) return;
    
    try {
      flatListRef.current.scrollToOffset({ 
        offset, 
        animated: true 
      });
    } catch (error) {
      // Silently handle scroll errors  
    }
  };

  useEffect(() => {
    if (trigger) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Scroll with slight delay for smooth animation
      timeoutRef.current = setTimeout(scrollToBottom, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [trigger, enabled, delay, inputContainerHeight, keyboardHeight]);

  // Also trigger scroll when keyboard height changes (keyboard appears/disappears)
  useEffect(() => {
    if (prevKeyboardHeight.current !== keyboardHeight && keyboardHeight > 0 && trigger) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Scroll when keyboard height changes
      timeoutRef.current = setTimeout(scrollToBottom, delay);
    }
    prevKeyboardHeight.current = keyboardHeight;
  }, [keyboardHeight, trigger, enabled, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { flatListRef, scrollToBottom, scrollToOffset };
};