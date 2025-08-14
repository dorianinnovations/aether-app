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
import { FadedBorder } from '../../../components/FadedBorder';

interface WalletCardProps {
  currentTier?: 'standard' | 'pro' | 'elite';
  usage?: {
    gpt4o: number;
    gpt5: number;
    gpt5Limit?: number;
  };
  userBadges?: string[]; // Array of badge types from database
  onUpgrade: (tier: 'pro' | 'elite') => void;
  isLoadingRealData?: boolean;
  hasRealData?: boolean;
  dataError?: string | null;
  activityMetrics?: {
    conversations: {
      total: number;
      avgLength: number;
    };
    music: {
      grailsCollected: number;
      tracksDiscovered: number;
    };
    social: {
      friends: number;
      friendMessages: number;
    };
    totals: {
      aiMessages: number;
      gpt5Lifetime: number;
    };
  } | null;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  currentTier = 'standard',
  usage = { gpt4o: 45, gpt5: 120, gpt5Limit: 150 },
  userBadges = [],
  onUpgrade,
  isLoadingRealData = false,
  hasRealData = false,
  dataError = null,
  activityMetrics = null,
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
        color: '#10B981',
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
        color: '#10B981',
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
        color: '#10B981', // Green
        accentColors: ['#EC4899', '#10B981', '#06B6D4'], // Pink, emerald, cyan
        features: [
          '5x increased API capacity over Standard tier',
          'Extended discovery engine - Process ~1,000 song matches monthly via advanced recommendation algorithms',
          'Exclusive founder badge - Limited availability for early adopters',
          'Unrestricted profile modifications - Real-time updates without rate limiting',
          'Enhanced media pipeline - Increased monthly allocation for file and image uploads during chat sessions'
        ]
      };
    } else {
      return {
        name: 'VIP',
        price: '$20',
        priceUnit: '/mo',
        color: '#F59E0B', // Gold
        accentColors: ['#06B6D4', '#10B981', '#22C55E'], // Cyan, green, green
        features: [
          'Includes all Legend features',
          'Unlimited AetheR interactions - No session caps on AI companion conversations',
          'Advanced model access - Toggle between multiple AI architectures for optimized discovery',
          'Unrestricted discovery pipeline - Live AI-augmented recommendations without monthly limits',
          'Unlimited storage quota - No restrictions on photo and file uploads',
          'Early access program - Priority beta feature rollout and testing opportunities'
        ]
      };
    }
  };

  const renderCurrentPlanOverview = () => {
    const tierColor = isProTier 
      ? '#10B981' // Green
      : isEliteTier 
        ? '#10B981' // Green
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
                {/* Data status indicator */}
                {isLoadingRealData && (
                  <View style={styles.dataStatusDot}>
                    <Feather name="loader" size={10} color="#10B981" />
                  </View>
                )}
                {!hasRealData && !isLoadingRealData && (
                  <View style={[styles.dataStatusDot, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <Feather name="wifi-off" size={8} color="#10B981" />
                  </View>
                )}
                {hasRealData && (
                  <View style={[styles.dataStatusDot, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                    <Feather name="check" size={8} color="#10B981" />
                  </View>
                )}
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
                  color: currentTier === 'standard' ? colors.text : currentTier === 'pro' ? '#10B981' : '#10B981',
                  fontFamily: currentTier === 'standard' ? 'MozillaHeadline_600SemiBold' : currentTier === 'pro' ? 'Danfo_400Regular' : 'El Messiri',
                  fontSize: 20,
                  fontWeight: currentTier === 'standard' ? '600' : '700',
                  letterSpacing: -0.3,
                  textTransform: 'uppercase',
                  textShadowColor: currentTier === 'standard' ? colors.text : currentTier === 'pro' ? '#10B981' : '#10B981',
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
              ) : null}
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

          {/* Core Activity Metrics - Always show for all tiers */}
          {activityMetrics ? (
            <>
              {/* AI Conversations */}
              <View style={[
                styles.usageCard,
                { 
                  borderLeftWidth: 2, 
                  borderLeftColor: 'rgba(255, 255, 255, 0.4)',
                  borderRightWidth: 1,
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderRightColor: 'rgba(255, 255, 255, 0.2)',
                  borderTopColor: 'rgba(255, 255, 255, 0.2)',
                  borderBottomColor: 'rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)'
                }
              ]}>
                <View style={styles.usageHeader}>
                  <Text style={[
                    styles.usageTitle,
                    { 
                      color: colors.text,
                      fontFamily: 'JetBrainsMono-Medium',
                      fontSize: 13,
                      fontWeight: '600',
                      letterSpacing: 0.5,
                    }
                  ]}>
                    ai_conversations
                  </Text>
                  <Text style={[
                    styles.usageCount,
                    { 
                      color: colors.text,
                      fontFamily: 'JetBrainsMono-Bold',
                      fontSize: 16,
                      fontWeight: '700',
                      letterSpacing: 0.8,
                    }
                  ]}>
                    {activityMetrics.conversations.total.toString().padStart(3, '0')}
                  </Text>
                </View>
                <Text style={[
                  styles.metricSubtext,
                  { 
                    color: colors.textSecondary,
                    fontFamily: 'JetBrainsMono-Regular',
                    fontSize: 10,
                  }
                ]}>
                  {activityMetrics.conversations.avgLength > 0 ? 
                    `avg_len: ${activityMetrics.conversations.avgLength.toString().padStart(2, '0')} msg/chat` : 
                    'total_conversations_created'
                  }
                </Text>
              </View>

              {/* Music & Social Combined Card */}
              <View style={[
                styles.usageCard,
                { 
                  borderLeftWidth: 2, 
                  borderLeftColor: 'rgba(255, 255, 255, 0.4)',
                  borderRightWidth: 1,
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderRightColor: 'rgba(255, 255, 255, 0.2)',
                  borderTopColor: 'rgba(255, 255, 255, 0.2)',
                  borderBottomColor: 'rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)'
                }
              ]}>
                <View style={styles.usageHeader}>
                  <Text style={[
                    styles.usageTitle,
                    { 
                      color: colors.text,
                      fontFamily: 'JetBrainsMono-Medium',
                      fontSize: 13,
                      fontWeight: '600',
                      letterSpacing: 0.5,
                    }
                  ]}>
                    music_social
                  </Text>
                  <Text style={[
                    styles.usageCount,
                    { 
                      color: colors.text,
                      fontFamily: 'JetBrainsMono-Bold',
                      fontSize: 16,
                      fontWeight: '700',
                      letterSpacing: 0.8,
                    }
                  ]}>
                    {(activityMetrics.music.grailsCollected + activityMetrics.social.friends).toString().padStart(3, '0')}
                  </Text>
                </View>
                <Text style={[
                  styles.metricSubtext,
                  { 
                    color: colors.textSecondary,
                    fontFamily: 'JetBrainsMono-Regular',
                    fontSize: 10,
                  }
                ]}>
                  grails: {activityMetrics.music.grailsCollected.toString().padStart(2, '0')} | friends: {activityMetrics.social.friends.toString().padStart(2, '0')}
                </Text>
              </View>

              {/* Pro/Elite Tier: Advanced Metrics */}
              {(isProTier || isEliteTier) && (
                <View style={[
                  styles.usageCard,
                  { 
                    borderLeftWidth: 2, 
                    borderLeftColor: 'rgba(255, 255, 255, 0.4)',
                    borderRightWidth: 1,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderRightColor: 'rgba(255, 255, 255, 0.2)',
                    borderTopColor: 'rgba(255, 255, 255, 0.2)',
                    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)'
                  }
                ]}>
                  <View style={styles.usageHeader}>
                    <Text style={[
                      styles.usageTitle,
                      { 
                        color: colors.text,
                        fontFamily: 'JetBrainsMono-Medium',
                        fontSize: 13,
                        fontWeight: '600',
                        letterSpacing: 0.5,
                      }
                    ]}>
                      advanced_ai
                    </Text>
                    <Text style={[
                      styles.usageCount,
                      { 
                        color: colors.text,
                        fontFamily: 'JetBrainsMono-Bold',
                        fontSize: 16,
                        fontWeight: '700',
                        letterSpacing: 0.8,
                      }
                    ]}>
                      {activityMetrics.totals.gpt5Lifetime.toString().padStart(4, '0')}
                    </Text>
                  </View>
                  <Text style={[
                    styles.metricSubtext,
                    { 
                      color: colors.textSecondary,
                      fontFamily: 'JetBrainsMono-Regular',
                      fontSize: 10,
                    }
                  ]}>
                    gpt5_requests_lifetime
                  </Text>
                </View>
              )}
            </>
          ) : (
            /* Fallback for no data */
            <View style={[
              styles.usageCard,
              { 
                borderLeftWidth: 2, 
                borderLeftColor: 'rgba(255, 255, 255, 0.3)',
                borderRightWidth: 1,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderRightColor: 'rgba(255, 255, 255, 0.2)',
                borderTopColor: 'rgba(255, 255, 255, 0.2)',
                borderBottomColor: 'rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)'
              }
            ]}>
              <View style={styles.usageHeader}>
                <Text style={[
                  styles.usageTitle,
                  { 
                    color: colors.text,
                    fontFamily: 'JetBrainsMono-Medium',
                    fontSize: 13,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                  }
                ]}>
                  loading_activity
                </Text>
                <Text style={[
                  styles.usageCount,
                  { 
                    color: colors.textSecondary,
                    fontFamily: 'JetBrainsMono-Bold',
                    fontSize: 16,
                    fontWeight: '700',
                    letterSpacing: 0.8,
                  }
                ]}>
                  ---
                </Text>
              </View>
              <Text style={[
                styles.metricSubtext,
                { 
                  color: colors.textSecondary,
                  fontFamily: 'JetBrainsMono-Regular',
                  fontSize: 10,
                }
              ]}>
                gathering_usage_data
              </Text>
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
                    fontFamily: tier === 'pro' ? 'Danfo_400Regular' : 'El Messiri',
                    fontSize: 20,
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
                const modernColors = ['#EC4899', '#10B981', '#06B6D4', '#22C55E', '#8B5CF6'];
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
              { 
                backgroundColor: theme === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(255, 255, 255, 0.25)',
              }
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
                        color: '#06B6D4',
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
                      outputRange: [1.4, 1.2, 1],
                    })
                  }]
                }
              ]}>
                <Feather 
                  name="arrow-right" 
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
                  const modernColors = ['#EC4899', '#10B981', '#06B6D4', '#22C55E', '#8B5CF6', '#EC4899'];
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative' as const,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
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
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    // Enhanced neumorphic upgrade button with increased elevation
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 16,
    // Tech glow effect
    marginHorizontal: 2,
    marginVertical: 6,
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
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    marginTop: spacing[1]/2,
    opacity: 0.7,
    letterSpacing: 0.1,
  },
  planLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  dataStatusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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