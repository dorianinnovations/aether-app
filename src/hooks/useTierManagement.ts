/**
 * Tier Management Hook
 * Handles subscription tier logic, benefits, and upgrades
 */

import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

export type TierType = 'standard' | 'pro' | 'elite';

interface TierBenefits {
  name: string;
  color: string;
  benefits: (string | { parts: { text: string; isClickable: boolean }[] })[];
}

interface UsageData {
  gpt4o: number;
  gpt5: number;
  gpt5Limit?: number;
}

interface UseTierManagementProps {
  currentTier: TierType;
  usage: UsageData;
  onUpgrade: (tier: 'pro' | 'elite') => void;
}

export const useTierManagement = ({
  currentTier,
  usage,
  onUpgrade,
}: UseTierManagementProps) => {
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [modalTierOverride, setModalTierOverride] = useState<TierType | null>(null);
  const [activePage, setActivePage] = useState(0);
  
  // Animation refs
  const longPressAnim = useRef(new Animated.Value(0)).current;
  const modalFadeAnim = useRef(new Animated.Value(1)).current;
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pagerRef = useRef<any>(null);

  // Tier status helpers
  const isStandardTier = currentTier === 'standard';
  const isProTier = currentTier === 'pro';
  const isEliteTier = currentTier === 'elite';

  // Get tier benefits
  const getCurrentTierBenefits = useCallback((): TierBenefits => {
    const displayTier = modalTierOverride || currentTier;
    
    if (displayTier === 'standard') {
      return {
        name: 'STANDARD',
        color: '#10B981',
        benefits: [
          'Essential AI Chat Access - Limited monthly conversations with intelligent music assistant',
          'Basic Music Recognition - AI-powered scanning for popular tracks and artists',
          'Smart Rate Management - Optimized inference limits with standard processing speeds',
          'GPT-4o Integration - Reliable AI responses for everyday music discovery needs',
          'Premium Model Sampling - Limited monthly access to cutting-edge AI models for enhanced results'
        ]
      };
    } else if (displayTier === 'pro') {
      return {
        name: 'LEGENDARY',
        color: '#EF4444',
        benefits: [
          'Unlimited Platform Access - Unrestricted use of all core features and AI capabilities',
          'LEGEND Status Badge - Exclusive profile designation showcasing your commitment to music AI',
          'Elite Model Allocation - Up to 5,000 monthly requests using GPT-5, Claude Opus, and Gemini 2.5 Pro',
          "Founder's Circle Benefits - Early access to experimental features and platform updates",
          'Advanced Customization Suite - Personalized interface themes and workflow optimization'
        ]
      };
    } else {
      return {
        name: 'VIP',
        color: '#F59E0B',
        benefits: [
          {
            parts: [
              { text: 'Everything in ', isClickable: false },
              { text: 'LEGENDARY', isClickable: true }
            ]
          },
          'Superior Recognition Engine - Amplified request limits for unparalleled artist and track identification',
          'Aether Music Discovery - AI-powered exploration engine for personalized musical journeys',
          'Intelligent Model Switching - Automatic optimization based on your preferences and recognition needs',
          'Agentic Background Processing - Smart notifications and proactive music insights',
          'Exclusive VIP Distinction - Premium badge showcasing elite platform status',
          'Master Customization Control - Advanced app personalization and premium profile design options'
        ]
      };
    }
  }, [modalTierOverride, currentTier]);

  // Animation handlers
  const switchToTier = useCallback((tier: TierType) => {
    Animated.timing(modalFadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setModalTierOverride(tier);
      Animated.timing(modalFadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [modalFadeAnim]);

  // Long press handling
  const handleLongPressStart = useCallback((tier: 'pro' | 'elite') => {
    // Initial light haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Start visual feedback animation
    Animated.timing(longPressAnim, {
      toValue: 1,
      duration: 1500, // 1.5 seconds to complete
      useNativeDriver: false,
    }).start();

    // Escalating haptic feedback
    let hapticCount = 0;
    hapticIntervalRef.current = setInterval(() => {
      hapticCount++;
      if (hapticCount === 3) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (hapticCount === 6) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (hapticCount === 9) {
        // Final success haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Trigger upgrade
        onUpgrade(tier);
        handleLongPressEnd();
      }
    }, 150);
  }, [longPressAnim, onUpgrade]);

  const handleLongPressEnd = useCallback(() => {
    // Clear haptic interval
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
    
    // Reset animation
    Animated.timing(longPressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [longPressAnim]);

  // Usage calculations
  const getUsagePercentage = useCallback(() => {
    if (usage.gpt5Limit && usage.gpt5Limit > 0) {
      return Math.min((usage.gpt5 / usage.gpt5Limit) * 100, 100);
    }
    return 0;
  }, [usage]);

  const getRemainingRequests = useCallback(() => {
    if (usage.gpt5Limit && usage.gpt5Limit > 0) {
      return Math.max(usage.gpt5Limit - usage.gpt5, 0);
    }
    return 0;
  }, [usage]);

  // Modal handlers
  const openBenefitsModal = useCallback(() => {
    setShowBenefitsModal(true);
  }, []);

  const closeBenefitsModal = useCallback(() => {
    setShowBenefitsModal(false);
    setModalTierOverride(null);
  }, []);

  return {
    // State
    showBenefitsModal,
    modalTierOverride,
    activePage,
    setActivePage,
    
    // Tier status
    isStandardTier,
    isProTier,
    isEliteTier,
    
    // Animation refs
    longPressAnim,
    modalFadeAnim,
    pagerRef,
    
    // Handlers
    getCurrentTierBenefits,
    switchToTier,
    handleLongPressStart,
    handleLongPressEnd,
    openBenefitsModal,
    closeBenefitsModal,
    
    // Usage calculations
    getUsagePercentage,
    getRemainingRequests,
  };
};