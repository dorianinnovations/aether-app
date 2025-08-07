/**
 * useConversationTabs - Tab management for ConversationDrawer
 * Handles tab switching, animations, and state management
 */

import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getThemeColors } from '../design-system/tokens/colors';

export interface TabConfig {
  label: string;
  icon: string;
  color: string;
  iconColor: string;
}

export const useConversationTabs = (theme: 'light' | 'dark') => {
  const [currentTab, setCurrentTab] = useState(0);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  
  const themeColors = getThemeColors(theme);
  
  // Tab fold-out animations
  const tabAnimations = useRef([
    new Animated.Value(1), // Aether
    new Animated.Value(1), // Friends  
    new Animated.Value(1), // Custom
  ]).current;

  const tabs: TabConfig[] = [
    { 
      label: 'Aether', 
      icon: 'message-circle', 
      color: themeColors.text,
      iconColor: themeColors.text,
    },
    { 
      label: 'Friends', 
      icon: 'users', 
      color: themeColors.textSecondary,
      iconColor: themeColors.textSecondary,
    },
    { 
      label: 'Orbit', 
      icon: 'activity', 
      color: themeColors.textSecondary,
      iconColor: themeColors.textSecondary,
    }
  ];

  // Simple opacity animation handler
  const animateTabPress = useCallback((tabIndex: number) => {
    const tabAnim = tabAnimations[tabIndex];
    
    // Simple opacity fade: quick fade out then back in
    Animated.sequence([
      Animated.timing(tabAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tabAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [tabAnimations]);

  // Simple tab transition handler with skeleton loading
  const handleTabTransition = useCallback((targetTab: number, isAnimating: boolean) => {
    if (isAnimating || targetTab === currentTab || isTabSwitching) return;
    
    // Trigger fold-out animation
    animateTabPress(targetTab);
    
    // Show skeleton loader
    setIsTabSwitching(true);
    
    // Delay for 250ms to show skeleton
    setTimeout(() => {
      setCurrentTab(targetTab);
      setIsTabSwitching(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 250);
  }, [currentTab, isTabSwitching, animateTabPress]);

  // Reset animations
  const resetTabAnimations = useCallback(() => {
    tabAnimations.forEach(anim => anim.setValue(1));
  }, [tabAnimations]);

  return {
    currentTab,
    isTabSwitching,
    tabs,
    tabAnimations,
    handleTabTransition,
    resetTabAnimations,
  };
};