import { useRef, useCallback, useState, useEffect } from 'react';
import { FlatList, Animated } from 'react-native';

export const useSimpleScroll = () => {
  const flatListRef = useRef<FlatList>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Check if user is at bottom of list
  const checkIfAtBottom = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    const isNearBottom = distanceFromBottom <= 35; // 35px threshold
    setIsAtBottom(isNearBottom);
  }, []);

  // Handle scroll events
  const handleScroll = useCallback((event: any) => {
    checkIfAtBottom(event);
  }, [checkIfAtBottom]);

  // Track when user is actively scrolling and show/hide button
  const handleScrollBegin = useCallback(() => {
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  }, []);

  const handleScrollEnd = useCallback((event: any) => {
    checkIfAtBottom(event);
    // Give user a moment after they stop scrolling before we resume auto-scroll
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 2000);
  }, [checkIfAtBottom]);

  // Smooth scroll to bottom (for input focus)
  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Gentle pull down (for new messages, but respect user scrolling)
  const gentleScrollDown = useCallback(() => {
    if (!isUserScrolling) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [isUserScrolling]);

  // Show button only when user is scrolling and not at bottom
  const shouldShowScrollButton = isUserScrolling && !isAtBottom;

  // Animate button opacity
  useEffect(() => {
    Animated.timing(buttonOpacity, {
      toValue: shouldShowScrollButton ? 1 : 0,
      duration: shouldShowScrollButton ? 200 : 300,
      useNativeDriver: true,
    }).start();
  }, [shouldShowScrollButton, buttonOpacity]);

  return {
    flatListRef,
    scrollToBottom,
    gentleScrollDown,
    handleScrollBegin,
    handleScrollEnd,
    handleScroll,
    showScrollButton: shouldShowScrollButton,
    buttonOpacity,
    isAtBottom,
  };
};