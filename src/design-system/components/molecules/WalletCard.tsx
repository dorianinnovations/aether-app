import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, TouchableOpacity, Modal, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import * as Haptics from 'expo-haptics';
import { PrestigiousBadge, mapDatabaseBadgeToPrestigious, PrestigiousBadgeType } from '../atoms/PrestigiousBadge';
import { useTheme } from '../../../contexts/ThemeContext';
import { designTokens } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { subscriptionService } from '../../../services/subscriptionService';

interface WalletCardProps {
  currentTier?: 'standard' | 'pro' | 'elite';
  usage?: {
    gpt4o: number;
    gpt5: number;
    gpt5Limit?: number;
  };
  userBadges?: string[]; // Array of badge types from database
  onUpgrade: (tier: 'pro' | 'elite') => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  currentTier = 'standard',
  usage = { gpt4o: 45, gpt5: 120, gpt5Limit: 150 },
  userBadges = [],
  onUpgrade,
}) => {
  const { theme, colors } = useTheme();
  const [activePage, setActivePage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const longPressAnim = useRef(new Animated.Value(0)).current;
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const isStandardTier = currentTier === 'standard';
  const isProTier = currentTier === 'pro';
  const isEliteTier = currentTier === 'elite';

  // Process user badges to get unique prestigious badges
  const getDisplayBadges = (): PrestigiousBadgeType[] => {
    const prestigiousBadges = userBadges
      .map(badge => mapDatabaseBadgeToPrestigious(badge))
      .filter((badge): badge is PrestigiousBadgeType => badge !== null);
    
    // Remove duplicates and prioritize 'legend' over 'vip'
    const uniqueBadges = Array.from(new Set(prestigiousBadges));
    return uniqueBadges.sort((a, b) => a === 'legend' ? -1 : b === 'legend' ? 1 : 0);
  };

  const displayBadges = getDisplayBadges();
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [modalTierOverride, setModalTierOverride] = useState<'standard' | 'pro' | 'elite' | null>(null);
  const modalFadeAnim = useRef(new Animated.Value(1)).current;

  // Handle tier transition animation
  const switchToTier = (tier: 'pro') => {
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
  };

  // Get current tier benefits
  const getCurrentTierBenefits = () => {
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
  };

  // Long press with haptic intensity rise
  const handleLongPressStart = (tier: 'pro' | 'elite') => {
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
      } else if (hapticCount >= 8) {
        // Final success haptic and trigger payment
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handlePaymentInitiation(tier);
        handleLongPressEnd();
      }
    }, 200); // Every 200ms
  };

  // Handle payment initiation
  const handlePaymentInitiation = async (tier: 'pro' | 'elite') => {
    try {
      const stripeTier = tier === 'pro' ? 'Legend' : 'VIP';
      await subscriptionService.initiatePayment(stripeTier);
      
      // Call the original onUpgrade for any additional UI updates
      onUpgrade(tier);
    } catch (error) {
      console.error('Payment initiation failed:', error);
      Alert.alert(
        'Payment Error',
        'Unable to start payment process. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLongPressEnd = () => {
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
  };

  const getTierInfo = (tier: 'pro' | 'elite') => {
    if (tier === 'pro') {
      return {
        name: 'LEGEND',
        price: '$12',
        priceUnit: '/mo',
        color: '#EF4444', // Red
        accentColors: ['#EC4899', '#10B981', '#F59E0B'], // Pink, emerald, amber
        features: [
          '3,000 responses every 2 weeks (20x more than Standard)',
          '50 GPT-5 calls per month (5x more than Standard)',
          'Priority AI processing',
          'Enhanced music recognition',
          'Advanced customization options'
        ]
      };
    } else {
      return {
        name: 'VIP',
        price: '$20',
        priceUnit: '/mo',
        color: '#F59E0B', // Gold
        accentColors: ['#06B6D4', '#EF4444', '#22C55E'], // Cyan, red, green
        features: [
          'Everything in LEGEND',
          'Unlimited responses',
          'Unlimited GPT-5 calls',
          'Priority processing',
          'Early access to new features',
          'Premium support'
        ]
      };
    }
  };

  const renderCurrentPlanOverview = () => {
    const tierColor = isProTier 
      ? '#EF4444' // Red
      : isEliteTier 
        ? '#F59E0B' // Gold
        : '#10B981'; // Modern emerald for standard tier

    const gpt5Progress = usage.gpt5Limit ? (usage.gpt5 / usage.gpt5Limit) * 100 : 0;
    const gpt4oProgress = isStandardTier ? (usage.gpt4o / 150) * 100 : 0;

    return (
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.tierBadge}>
            <View style={styles.tierInfo}>
              <View style={styles.planLabelContainer}>
                <Text style={[
                  styles.tierLabel,
                  typography.textStyles.bodySmall,
                  { color: colors.textSecondary }
                ]}>
                  Current Plan
                </Text>
                <TouchableOpacity 
                  style={styles.infoButton}
                  onPress={() => setShowBenefitsModal(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather 
                    name="info" 
                    size={12} 
                    color={colors.textSecondary} 
                    style={{ opacity: 0.7 }}
                  />
                </TouchableOpacity>
              </View>
              <Text style={[
                styles.tierName,
                { 
                  color: currentTier === 'standard' ? '#10B981' : currentTier === 'pro' ? '#EF4444' : '#F59E0B',
                  fontFamily: 'MozillaHeadline_700Bold',
                  fontSize: 32,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  textTransform: 'uppercase',
                  textShadowColor: currentTier === 'standard' ? '#10B981' : currentTier === 'pro' ? '#EF4444' : '#F59E0B',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 2,
                }
              ]}>
                {currentTier === 'standard' ? 'STANDARD' : currentTier === 'pro' ? 'LEGENDARY' : 'VIP'}
              </Text>
            </View>
            <View style={styles.badgeContainer}>
              {displayBadges.length > 0 ? (
                <View style={styles.badgeCollection}>
                  {displayBadges.slice(0, 3).map((badgeType, index) => (
                    <View 
                      key={`${badgeType}-${index}`}
                      style={[
                        styles.badgeWrapper,
                        { marginLeft: index > 0 ? -spacing[1] : 0 }
                      ]}
                    >
                      <PrestigiousBadge 
                        type={badgeType}
                        theme={theme}
                        size="small"
                        showTooltip={false}
                        badgeKey={`current-plan-${badgeType}-${index}`}
                      />
                    </View>
                  ))}
                  {displayBadges.length > 3 && (
                    <View style={styles.badgeOverflow}>
                      <Text style={[
                        styles.badgeOverflowText,
                        { color: tierColor }
                      ]}>
                        +{displayBadges.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              ) : currentTier === 'pro' ? (
                <PrestigiousBadge 
                  type="legend"
                  theme={theme}
                  size="small"
                  showTooltip={false}
                />
              ) : currentTier === 'elite' ? (
                <PrestigiousBadge 
                  type="vip"
                  theme={theme}
                  size="small"
                  showTooltip={false}
                />
              ) : (
                <Feather name="credit-card" size={24} color={tierColor} />
              )}
            </View>
          </View>
        </View>

        {/* Activity Metrics */}
        <View style={styles.usageSection}>
          <Text style={[
            styles.sectionTitle,
            { color: colors.text }
          ]}>
            Activity Overview
          </Text>

          {isStandardTier && (
            <>
              <View style={[
                styles.usageCard,
                { 
                  borderLeftWidth: 2, 
                  borderLeftColor: '#10B981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)'
                }
              ]}>
                <View style={styles.usageHeader}>
                  <Text style={[
                    styles.usageTitle,
                    { 
                      color: colors.text,
                      fontFamily: 'Inter-Medium',
                      fontSize: 14,
                      fontWeight: '600',
                      letterSpacing: 0.2,
                    }
                  ]}>
                    Stats Grabbed
                  </Text>
                  <Text style={[
                    styles.usageCount,
                    { 
                      color: '#10B981',
                      fontFamily: 'Inter-Bold',
                      fontSize: 13,
                      fontWeight: '700',
                      letterSpacing: 0.3,
                    }
                  ]}>
                    2.4K
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    {
                      backgroundColor: '#10B981',
                      width: '75%',
                    }
                  ]} />
                </View>
                <Text style={[
                  styles.metricSubtext,
                  { color: colors.textSecondary }
                ]}>
                  Data points collected this month
                </Text>
              </View>

              <View style={[
                styles.usageCard,
                { 
                  borderLeftWidth: 2, 
                  borderLeftColor: '#F59E0B',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)'
                }
              ]}>
                <View style={styles.usageHeader}>
                  <Text style={[
                    styles.usageTitle,
                    { 
                      color: colors.text,
                      fontFamily: 'Inter-Medium',
                      fontSize: 14,
                      fontWeight: '600',
                      letterSpacing: 0.2,
                    }
                  ]}>
                    Usage Generated
                  </Text>
                  <Text style={[
                    styles.usageCount,
                    { 
                      color: '#F59E0B',
                      fontFamily: 'Inter-Bold',
                      fontSize: 13,
                      fontWeight: '700',
                      letterSpacing: 0.3,
                    }
                  ]}>
                    87%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    {
                      backgroundColor: '#F59E0B',
                      width: '87%',
                    }
                  ]} />
                </View>
                <Text style={[
                  styles.metricSubtext,
                  { color: colors.textSecondary }
                ]}>
                  Activity efficiency this period
                </Text>
              </View>
            </>
          )}

          {isProTier && (
            <>
              <View style={styles.usageCard}>
                <View style={styles.usageHeader}>
                  <Text style={[
                    styles.usageTitle,
                    typography.textStyles.bodyLarge,
                    { color: colors.text }
                  ]}>
                    GPT-4o Requests
                  </Text>
                  <Text style={[
                    styles.usageCount,
                    typography.textStyles.techyNumberSmall,
                    { color: '#10B981' } // Modern emerald
                  ]}>
                    Unlimited
                  </Text>
                </View>
              </View>

              <View style={styles.usageCard}>
                <View style={styles.usageHeader}>
                  <Text style={[
                    styles.usageTitle,
                    typography.textStyles.bodyLarge,
                    { color: colors.text }
                  ]}>
                    GPT-5/Opus 4.1 Special Requests
                  </Text>
                  <Text style={[
                    styles.usageCount,
                    typography.textStyles.techyNumberSmall,
                    { color: tierColor }
                  ]}>
                    {usage.gpt5}/1000
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    {
                      backgroundColor: '#EC4899', // Modern pink
                      width: `${Math.min((usage.gpt5 / 1000) * 100, 100)}%`,
                    }
                  ]} />
                </View>
              </View>
            </>
          )}

          {isEliteTier && (
            <View style={styles.usageCard}>
              <View style={styles.usageHeader}>
                <Text style={[
                  styles.usageTitle,
                  typography.textStyles.bodyLarge,
                  { color: colors.text }
                ]}>
                  All Models
                </Text>
                <Text style={[
                  styles.usageCount,
                  typography.textStyles.techyNumberSmall,
                  { color: '#10B981' } // Modern emerald
                ]}>
                  Unlimited
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Upgrade Hint */}
        {!isEliteTier && (
          <View style={styles.swipeHint}>
            <Text style={[
              styles.hintText,
              typography.textStyles.bodyMedium,
              { color: colors.textSecondary }
            ]}>
              Swipe to explore upgrade options
            </Text>
            <Feather name="arrow-right" size={16} color={colors.textSecondary} />
          </View>
        )}
      </ScrollView>
    );
  };

  const renderTierCard = (tier: 'pro' | 'elite') => {
    const tierInfo = getTierInfo(tier);
    
    return (
      <View style={styles.tierCardContainer}>
        <ScrollView 
          style={styles.scrollContainer} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.tierBadge}>
              <View style={styles.tierInfo}>
                <Text style={[
                  styles.tierLabel,
                  typography.textStyles.bodySmall,
                  { color: colors.textSecondary }
                ]}>
                  Upgrade to
                </Text>
                <Text style={[
                  styles.tierName,
                  { 
                    color: tierInfo.color,
                    fontFamily: 'MozillaHeadline_700Bold',
                    fontSize: 32,
                    fontWeight: '700',
                    letterSpacing: -0.3,
                    textTransform: 'uppercase',
                    textShadowColor: tierInfo.color,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 2,
                  }
                ]}>
                  {tierInfo.name}
                </Text>
              </View>
              <View style={styles.badgeContainer}>
                {tier === 'pro' ? (
                  <PrestigiousBadge 
                    type="legend"
                    theme={theme}
                    size="small"
                    showTooltip={false}
                  />
                ) : (
                  <PrestigiousBadge 
                    type="vip"
                    theme={theme}
                    size="small"
                    showTooltip={false}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text style={[
              styles.sectionTitle,
              { color: colors.text }
            ]}>
              {tierInfo.name} Features
            </Text>
            <View style={styles.featuresList}>
              {tierInfo.features.map((feature, index) => {
                const modernColors = ['#EC4899', '#10B981', '#F59E0B', '#06B6D4', '#EF4444'];
                const featureColor = modernColors[index % modernColors.length];
                
                return (
                  <View key={index} style={styles.featureRow}>
                    <Feather 
                      name="check" 
                      size={16} 
                      color={featureColor}
                      style={styles.checkIcon}
                    />
                    {typeof feature === 'object' && (feature as any).parts ? (
                      <View style={styles.featureTextContainer}>
                        {(feature as any).parts.map((part: any, partIndex: number) => (
                          part.isClickable ? (
                            <TouchableOpacity key={partIndex} onPress={() => switchToTier('pro')}>
                              <Text style={[
                                styles.featureText,
                                typography.textStyles.bodyMedium,
                                { 
                                  color: '#6366F1',
                                  fontWeight: '800',
                                  fontFamily: 'Inter-Bold',
                                  textDecorationLine: 'underline',
                                }
                              ]}>
                                {part.text}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <Text key={partIndex} style={[
                              styles.featureText,
                              typography.textStyles.bodyMedium,
                              { 
                                color: colors.text,
                                fontWeight: '500',
                                fontFamily: 'Nunito-Medium',
                              }
                            ]}>
                              {part.text}
                            </Text>
                          )
                        ))}
                      </View>
                    ) : (
                      <Text style={[
                        styles.featureText,
                        typography.textStyles.bodyMedium,
                        { 
                          color: colors.text,
                          fontWeight: '500',
                          fontFamily: 'Nunito-Medium',
                          flex: 1,
                        }
                      ]}>
                        {feature}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
        
        {/* Fixed Long Press to Upgrade Interface */}
        <View style={styles.upgradeSection}>
          <Pressable
            style={[
              styles.longPressTrack,
              { borderBottomColor: tierInfo.color }
            ]}
            onPressIn={() => handleLongPressStart(tier)}
            onPressOut={handleLongPressEnd}
            delayLongPress={1600} // Slightly longer than animation
          >
            {/* Progress Fill Animation - Opacity shift as you hold */}
            <Animated.View
              style={[
                styles.longPressFill,
                {
                  backgroundColor: tierInfo.color,
                  opacity: longPressAnim.interpolate({
                    inputRange: [0, 0.3, 0.6, 1],
                    outputRange: [0.1, 0.3, 0.6, 0.9], // Smooth opacity rise
                  }),
                  width: longPressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]}
            />
            
            {/* Content */}
            <View style={styles.longPressContent}>
              <View style={styles.longPressInfo}>
                <Text style={[
                  styles.longPressLabel,
                  { 
                    color: colors.textSecondary,
                    fontSize: 10,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    fontFamily: 'MozillaHeadline_600SemiBold',
                    fontWeight: '600',
                  }
                ]}>
                  Hold to upgrade
                </Text>
                <View style={styles.priceContainer}>
                  <Text style={[
                    styles.longPressPrice,
                    {
                      fontFamily: 'MozillaText_700Bold',
                      fontSize: 28,
                      fontWeight: '700',
                      letterSpacing: -0.2,
                      color: '#FFFFFF',
                      lineHeight: 30,
                      textShadowColor: '#FFFFFF',
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 2,
                    }
                  ]}>
                    {tierInfo.price}
                  </Text>
                  <View style={styles.priceUnitContainer}>
                    <Text style={[
                      styles.priceUnit,
                      { 
                        color: tierInfo.accentColors[0],
                        fontFamily: 'JetBrainsMono-Regular',
                        fontSize: 11,
                        fontWeight: '500',
                        letterSpacing: 0.3,
                        opacity: 0.8,
                        lineHeight: 14,
                      }
                    ]}>
                      {tierInfo.priceUnit}
                    </Text>
                  </View>
                </View>
              </View>
              
              <Animated.View style={[
                styles.longPressIcon,
                {
                  transform: [{
                    scale: longPressAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.2, 1.4],
                    })
                  }]
                }
              ]}>
                <Feather 
                  name="credit-card" 
                  size={18} 
                  color={tierInfo.color}
                />
              </Animated.View>
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  // Render Benefits Modal
  const renderBenefitsModal = () => {
    const currentBenefits = getCurrentTierBenefits();
    
    return (
      <Modal
        visible={showBenefitsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowBenefitsModal(false);
          setModalTierOverride(null);
        }}
      >
        <View style={styles.benefitsModalOverlay}>
          <TouchableOpacity 
            style={styles.benefitsModalBackground}
            activeOpacity={1}
            onPress={() => {
              setShowBenefitsModal(false);
              setModalTierOverride(null);
            }}
          />
          <View style={[
            styles.benefitsModalContainer,
            {
              backgroundColor: theme === 'dark' ? 'rgb(20, 20, 20)' : '#FFFFFF',
              shadowColor: theme === 'dark' ? '#000000' : '#FFFFFF',
            }
          ]}>
            {/* Header */}
            <View style={styles.benefitsModalHeader}>
              <Text style={[
                styles.benefitsModalTitle,
                { 
                  color: currentBenefits.color,
                  fontFamily: 'MozillaHeadline_700Bold',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.2,
                  textTransform: 'uppercase',
                }
              ]}>
                {currentBenefits.name} Benefits
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowBenefitsModal(false);
                  setModalTierOverride(null);
                }}
                style={styles.benefitsModalCloseButton}
              >
                <Feather name="x" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Benefits List */}
            <Animated.View style={{ opacity: modalFadeAnim }}>
              <ScrollView style={styles.benefitsModalContent} showsVerticalScrollIndicator={false}>
                {currentBenefits.benefits.map((benefit, index) => {
                  const modernColors = ['#EC4899', '#10B981', '#F59E0B', '#06B6D4', '#EF4444', '#8B5CF6'];
                  const benefitColor = modernColors[index % modernColors.length];
                  
                  return (
                    <View key={index} style={styles.benefitRow}>
                      <Feather 
                        name="check-circle" 
                        size={14} 
                        color={benefitColor}
                        style={styles.benefitIcon}
                      />
                      {typeof benefit === 'object' && benefit.parts ? (
                        <View style={styles.benefitTextContainer}>
                          {benefit.parts.map((part, partIndex) => (
                            part.isClickable ? (
                              <TouchableOpacity key={partIndex} onPress={() => switchToTier('pro')}>
                                <Text style={[
                                  styles.benefitText,
                                  { 
                                    color: '#6366F1',
                                    fontFamily: 'Nunito-Bold',
                                    fontSize: 13,
                                    lineHeight: 18,
                                    fontWeight: '700',
                                    textDecorationLine: 'underline',
                                  }
                                ]}>
                                  {part.text}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <Text key={partIndex} style={[
                                styles.benefitText,
                                { 
                                  color: colors.text,
                                  fontFamily: 'Nunito-Medium',
                                  fontSize: 13,
                                  lineHeight: 18,
                                }
                              ]}>
                                {part.text}
                              </Text>
                            )
                          ))}
                        </View>
                      ) : (
                        <Text style={[
                          styles.benefitText,
                          { 
                            color: colors.text,
                            fontFamily: 'Nunito-Medium',
                            fontSize: 13,
                            lineHeight: 18,
                            flex: 1,
                          }
                        ]}>
                          {benefit as React.ReactNode}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </Animated.View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme === 'dark' 
          ? 'rgb(20, 20, 20)' 
          : '#FFFFFF',
        shadowColor: theme === 'dark' ? '#000000' : '#FFFFFF',
        shadowOpacity: theme === 'dark' ? 0.5 : 0.8,
      }
    ]}>

      {/* Swipeable Content */}
      {isEliteTier ? (
        renderCurrentPlanOverview()
      ) : (
        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={(e) => {
            setActivePage(e.nativeEvent.position);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }}
        >
          <View key="0" style={styles.pageContainer}>
            {renderCurrentPlanOverview()}
          </View>
          <View key="1" style={styles.pageContainer}>
            {renderTierCard('pro')}
          </View>
          <View key="2" style={styles.pageContainer}>
            {renderTierCard('elite')}
          </View>
        </PagerView>
      )}
      
      {/* Benefits Modal */}
      {renderBenefitsModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 450,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // Enhanced neumorphic container effects
    borderTopWidth: 0,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.05)',
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    // Multiple layered shadows for depth
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -16,
    },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 32,
    // Inner glow effect simulation
    position: 'relative',
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  tierCardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: spacing[2], // Add some padding at bottom for better scrolling
  },
  header: {
    padding: spacing[5],
    paddingBottom: spacing[2],
    marginBottom: spacing[3],
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tierInfo: {
    marginRight: spacing[3],
    alignItems: 'flex-start',
    flex: 1,
  },
  tierLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: spacing[1],
  },
  tierName: {
    // Override styles handled by typography.textStyles.techyNumberLarge
  },
  usageSection: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[8],
    paddingTop: spacing[2],
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.8,
    marginBottom: spacing[3],
  },
  usageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: spacing[5],
    marginBottom: spacing[3],
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative' as const,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  usageCount: {
    // Override styles handled by typography.textStyles.techyUsage
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 0,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    position: 'relative',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    paddingTop: spacing[6],
    gap: spacing[2],
  },
  hintText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  featuresSection: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3], // Reduced since upgrade button is now fixed
    paddingTop: spacing[4],
  },
  featuresList: {
    gap: spacing[1],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: spacing[2],
  },
  featureTextContainer: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
  },
  featureText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  upgradeSection: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    paddingTop: spacing[6],
  },
  longPressTrack: {
    height: 56,
    borderBottomWidth: 4,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    // Enhanced neumorphic upgrade button
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    // Tech glow effect
    marginHorizontal: 2,
    marginVertical: 4,
  },
  longPressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    // No border radius - clean rectangular fill
  },
  longPressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    zIndex: 1,
  },
  longPressInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  longPressLabel: {
    marginBottom: spacing[1]/2,
    opacity: 0.7,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1]/2,
  },
  priceUnitContainer: {
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  longPressPrice: {
    // Typography handled inline
  },
  priceUnit: {
    // Typography handled inline
  },
  longPressIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // Neumorphic icon container with tech glow
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    // Tech-inspired inner glow
    position: 'relative',
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 32,
    overflow: 'visible',
  },
  badgeCollection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  badgeWrapper: {
    position: 'relative',
    zIndex: 1,
  },
  badgeOverflow: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    marginLeft: spacing[1],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeOverflowText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inlineBadge: {
    alignSelf: 'center',
    transform: [{ scale: 0.8 }],
  },
  metricSubtext: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    marginTop: spacing[1],
    opacity: 0.7,
    letterSpacing: 0.1,
  },
  planLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  infoButton: {
    padding: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  benefitsModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  benefitsModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  benefitsModalContainer: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 16,
    maxHeight: '70%',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  benefitsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  benefitsModalTitle: {
    flex: 1,
  },
  benefitsModalCloseButton: {
    padding: spacing[1],
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  benefitsModalContent: {
    padding: spacing[4],
    paddingTop: spacing[3],
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
    paddingVertical: spacing[1],
  },
  benefitIcon: {
    marginRight: spacing[2],
    marginTop: 2,
  },
  benefitTextContainer: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
  },
  benefitText: {
    // Styles handled inline
  },
});