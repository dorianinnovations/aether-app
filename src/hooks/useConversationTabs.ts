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
  icon: string | null;
  logo?: any;
  color: string;
  iconColor: string | null;
}

export const useConversationTabs = (theme: 'light' | 'dark') => {
  const [currentTab, setCurrentTab] = useState(0);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  
  const themeColors = getThemeColors(theme);
  
  // Tab fold-out animations
  const tabAnimations = useRef([
    new Animated.Value(1), // Aether
    new Animated.Value(1), // Friends  
  ]).current;

  const tabs: TabConfig[] = [
    { 
      label: 'Aether', 
      icon: null,
      logo: theme === 'dark'
        ? require('../../assets/images/aether-logo-dark-mode.webp')
        : require('../../assets/images/aether-logo-light-mode.webp'),
      color: theme === 'dark' ? '#8B8B8B' : '#666666',
      iconColor: null,
    },
    { 
      label: 'Friends', 
      icon: 'users', 
      color: theme === 'dark' ? '#FF6B6B' : '#E84393',
      iconColor: theme === 'dark' ? '#FF6B6B' : '#E84393',
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