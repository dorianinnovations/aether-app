/**
 * useWalletModalAnimation - Perfect slide animation for WalletModal
 * Replicates the impeccable ConversationDrawer animation behavior
 * Buttery smooth slide up/down with perfect timing and easing
 */

import { useRef, useCallback, useState } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

export const useWalletModalAnimation = () => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  // Reset animations to initial state
  const resetAnimations = useCallback(() => {
    slideAnim.setValue(screenHeight);
    overlayOpacity.setValue(0);
  }, [slideAnim, overlayOpacity]);

  // Show modal with buttery smooth slide up
  const showModal = useCallback((onComplete?: () => void) => {
    // Ensure slide animation starts from bottom
    slideAnim.setValue(screenHeight);
    overlayOpacity.setValue(0);
    
    // Show modal THEN animate
    setModalVisible(true);
    
    // Immediate animation start (no delay needed)
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250, // Snappy slide in
        easing: Easing.out(Easing.quad), // Same as ConversationDrawer
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0.7, // Same opacity as conversation drawer
        duration: 250, // Matching slide timing
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }, [slideAnim, overlayOpacity]);

  // Hide modal with perfect slide down
  const hideModal = useCallback((onComplete?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 280, // Slightly faster hide
        easing: Easing.in(Easing.cubic), // Smooth acceleration
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200, // Quick overlay fade out
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      resetAnimations();
      setModalVisible(false);
      onComplete?.();
    });
  }, [slideAnim, overlayOpacity, resetAnimations]);

  return {
    slideAnim,
    overlayOpacity,
    modalVisible,
    showModal,
    hideModal,
    resetAnimations,
  };
};