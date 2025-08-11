import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import * as Haptics from 'expo-haptics';
import { PrestigiousBadge } from '../atoms/PrestigiousBadge';
import { useTheme } from '../../../contexts/ThemeContext';
import { designTokens } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

interface WalletCardProps {
  currentTier?: 'free' | 'pro' | 'elite';
  usage?: {
    gpt4o: number;
    gpt5: number;
    gpt5Limit?: number;
  };
  onUpgrade: (tier: 'pro' | 'elite') => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  currentTier = 'free',
  usage = { gpt4o: 45, gpt5: 120, gpt5Limit: 150 },
  onUpgrade,
}) => {
  const { theme, colors } = useTheme();
  const [activePage, setActivePage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const longPressAnim = useRef(new Animated.Value(0)).current;
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const isFreeTier = currentTier === 'free';
  const isProTier = currentTier === 'pro';
  const isEliteTier = currentTier === 'elite';

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
        // Final success haptic and trigger upgrade
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUpgrade(tier);
        handleLongPressEnd();
      }
    }, 200); // Every 200ms
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
        price: '$15',
        priceUnit: '/mo',
        color: '#FF9AA2', // Pastel coral pink
        accentColors: ['#FFD93D', '#A8E6CF', '#FFB7B2'], // Rainbow accents
        features: [
          'Unlimited GPT-4o access',
          '1000 GPT-5/Opus 4.1 special requests/month',
          'Background music listening analysis',
          'Spotify/streaming services integration',
          'Profile customizations',
          'LEGEND badge'
        ]
      };
    } else {
      return {
        name: 'VIP',
        price: '$30',
        priceUnit: '/mo',
        color: '#B5A7E6', // Pastel lavender
        accentColors: ['#C7CEEA', '#FFDAC1', '#A8E6CF'], // Rainbow accents
        features: [
          'Everything in LEGEND',
          'Unlimited GPT-5 (API pricing)',
          'Early feature access',
          'Custom integrations',
          'Dedicated support'
        ]
      };
    }
  };

  const renderCurrentPlanOverview = () => {
    const tierColor = isProTier 
      ? '#FF9AA2' // Pastel coral pink
      : isEliteTier 
        ? '#B5A7E6' // Pastel lavender
        : '#A8E6CF'; // Pastel mint green for free tier

    const gpt5Progress = usage.gpt5Limit ? (usage.gpt5 / usage.gpt5Limit) * 100 : 0;
    const gpt4oProgress = isFreeTier ? (usage.gpt4o / 150) * 100 : 0;

    return (
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.tierBadge}>
            <View style={styles.tierInfo}>
              <Text style={[
                styles.tierLabel,
                typography.textStyles.bodySmall,
                { color: colors.textSecondary }
              ]}>
                Current Plan
              </Text>
              <Text style={[
                styles.tierName,
                { 
                  color: '#FFFFFF',
                  fontFamily: 'MozillaHeadline_700Bold',
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  textTransform: 'uppercase',
                  textShadowColor: '#FFFFFF',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 2,
                }
              ]}>
                {currentTier === 'free' ? 'Free' : currentTier === 'pro' ? 'LEGEND' : 'VIP'}
              </Text>
            </View>
            <View style={styles.badgeContainer}>
              {currentTier === 'pro' ? (
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

        {/* Usage Statistics */}
        <View style={styles.usageSection}>
          <Text style={[
            styles.sectionTitle,
            { color: colors.text }
          ]}>
            Usage Statistics
          </Text>

          {isFreeTier && (
            <>
              <View style={[
                styles.usageCard,
                { 
                  borderLeftWidth: 2, 
                  borderLeftColor: '#FFD93D',
                  backgroundColor: 'rgba(255, 217, 61, 0.03)'
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
                    GPT-4o Requests
                  </Text>
                  <Text style={[
                    styles.usageCount,
                    { 
                      color: gpt4oProgress > 80 ? '#FF9AA2' : '#FFD93D',
                      fontFamily: 'Inter-Bold',
                      fontSize: 13,
                      fontWeight: '700',
                      letterSpacing: 0.3,
                    }
                  ]}>
                    {usage.gpt4o}/150
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    {
                      backgroundColor: gpt4oProgress > 80 ? '#FF9AA2' : '#FFD93D', // Pastel coral or sunshine yellow
                      width: `${Math.min(gpt4oProgress, 100)}%`,
                    }
                  ]} />
                </View>
              </View>

              <View style={[
                styles.usageCard,
                { 
                  borderLeftWidth: 2, 
                  borderLeftColor: '#B5A7E6',
                  backgroundColor: 'rgba(181, 167, 230, 0.03)'
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
                    GPT-5 Requests
                  </Text>
                  <Text style={[
                    styles.usageCount,
                    { 
                      color: gpt5Progress > 80 ? '#FF9AA2' : '#B5A7E6',
                      fontFamily: 'Inter-Bold',
                      fontSize: 13,
                      fontWeight: '700',
                      letterSpacing: 0.3,
                    }
                  ]}>
                    {usage.gpt5}/{usage.gpt5Limit}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    {
                      backgroundColor: gpt5Progress > 80 ? '#FF9AA2' : '#B5A7E6', // Pastel coral or lavender
                      width: `${Math.min(gpt5Progress, 100)}%`,
                    }
                  ]} />
                </View>
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
                    { color: '#A8E6CF' } // Pastel mint green
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
                      backgroundColor: '#FFB7B2', // Pastel peach
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
                  { color: '#A8E6CF' } // Pastel mint green
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
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
                  color: '#FFFFFF',
                  fontFamily: 'MozillaHeadline_700Bold',
                  fontSize: 20,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                  textTransform: 'uppercase',
                  textShadowColor: '#FFFFFF',
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
              const rainbowColors = ['#FF9AA2', '#FFD93D', '#A8E6CF', '#B5A7E6', '#FFDAC1'];
              const featureColor = rainbowColors[index % rainbowColors.length];
              
              return (
                <View key={index} style={styles.featureRow}>
                  <Feather 
                    name="check" 
                    size={16} 
                    color={featureColor}
                    style={styles.checkIcon}
                  />
                  <Text style={[
                    styles.featureText,
                    typography.textStyles.bodyMedium,
                    { 
                      color: feature.startsWith('Everything in') ? tierInfo.color : colors.text,
                      fontWeight: feature.startsWith('Everything in') ? '800' : '500',
                      fontFamily: feature.startsWith('Everything in') ? 'Inter-Bold' : 'Nunito-Medium',
                    }
                  ]}>
                    {feature}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Long Press to Upgrade Interface */}
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
                  name="zap" 
                  size={18} 
                  color={tierInfo.color}
                />
              </Animated.View>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme === 'dark' 
          ? 'rgb(20, 20, 20)' 
          : 'rgb(250, 250, 250)',
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
          onPageSelected={(e) => setActivePage(e.nativeEvent.position)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // Enhanced neumorphic container effects
    borderTopWidth: 0,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderLeftColor: 'rgba(255, 255, 255, 0.05)',
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    // Multiple layered shadows for depth
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -12,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 28,
    // Inner glow effect simulation
    position: 'relative',
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: spacing[4],
    paddingBottom: spacing[1],
    marginBottom: spacing[2],
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
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
    paddingTop: 0,
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
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: spacing[4],
    marginBottom: spacing[2],
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
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
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    paddingTop: spacing[6],
    gap: spacing[2],
  },
  hintText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  featuresSection: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
    paddingTop: spacing[6],
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
  featureText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  upgradeSection: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
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
    backgroundColor: 'rgba(128, 128, 128, 0.08)',
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
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    // Neumorphic icon container with tech glow
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    width: 80,
    height: 32,
  },
  inlineBadge: {
    alignSelf: 'center',
    transform: [{ scale: 0.8 }],
  },
});