/**
 * User Badge Component
 * Similar to NotificationDot but larger and wider for user status badges (Founder, OG User, etc.)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { MiniTooltip } from './MiniTooltip';

export type UserBadgeType = 'founder' | 'og' | 'early' | 'supporter' | 'verified' | 'creator';

interface UserBadgeProps {
  type: UserBadgeType;
  visible?: boolean;
  glowIntensity?: 'low' | 'medium' | 'high';
  style?: ViewStyle;
  theme?: 'light' | 'dark';
}

const AbstractSwirl: React.FC<{ width: number; height: number; theme: 'light' | 'dark' }> = ({ width, height, theme }) => (
  <Svg width={width} height={height} viewBox="0 0 50 24" style={StyleSheet.absoluteFill}>
    {/* Abstract flowing lines */}
    <Path
      d="M5,12 Q15,4 25,12 Q35,20 45,12"
      stroke={theme === 'light' ? '#FFD700' : '#FFF700'}
      strokeWidth="0.8"
      fill="none"
      opacity={theme === 'light' ? 0.3 : 0.4}
    />
    <Path
      d="M3,10 Q13,18 23,10 Q33,2 43,10"
      stroke={theme === 'light' ? '#FFED4A' : '#FFFACD'}
      strokeWidth="0.6"
      fill="none"
      opacity={theme === 'light' ? 0.25 : 0.3}
    />
    <Path
      d="M7,14 Q17,6 27,14 Q37,22 47,14"
      stroke={theme === 'light' ? '#FFA500' : '#FFD700'}
      strokeWidth="0.4"
      fill="none"
      opacity={theme === 'light' ? 0.2 : 0.25}
    />
    {/* Subtle dots for texture */}
    <Circle cx="12" cy="8" r="0.5" fill={theme === 'light' ? '#FFD700' : '#FFF700'} opacity={theme === 'light' ? 0.4 : 0.5} />
    <Circle cx="25" cy="16" r="0.3" fill={theme === 'light' ? '#FFED4A' : '#FFFACD'} opacity={theme === 'light' ? 0.3 : 0.4} />
    <Circle cx="38" cy="6" r="0.4" fill={theme === 'light' ? '#FFA500' : '#FFD700'} opacity={theme === 'light' ? 0.35 : 0.45} />
  </Svg>
);

const getBadgeConfig = (theme: 'light' | 'dark' = 'light') => ({
  founder: {
    text: '⚡',
    color: theme === 'light' ? '#FF6B35' : '#FF8C42',
    backgroundColor: theme === 'light' ? 'rgba(255, 107, 53, 0.12)' : 'rgba(255, 140, 66, 0.15)',
    borderColor: theme === 'light' ? 'rgba(255, 107, 53, 0.25)' : 'rgba(255, 140, 66, 0.3)',
    fontFamily: 'Inter-Bold',
    hasSwirl: false,
    textShadow: {
      color: theme === 'light' ? 'rgba(255, 107, 53, 0.6)' : 'rgba(255, 140, 66, 0.7)',
      offset: { width: 0, height: 0 },
      radius: 3,
    },
    premiumGlow: true,
    tooltip: 'Founding member who helped build Aether from the ground up',
  },
  og: {
    text: '🔥',
    color: theme === 'light' ? '#8B5CF6' : '#A78BFA',
    backgroundColor: theme === 'light' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(167, 139, 250, 0.15)',
    borderColor: theme === 'light' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(167, 139, 250, 0.3)',
    fontFamily: 'Inter-Bold',
    hasSwirl: false,
    textShadow: {
      color: theme === 'light' ? 'rgba(139, 92, 246, 0.6)' : 'rgba(167, 139, 250, 0.7)',
      offset: { width: 0, height: 0 },
      radius: 3,
    },
    premiumGlow: true,
    tooltip: 'OG member from the early days of Aether',
  },
  verified: {
    text: '✓',
    color: theme === 'light' ? '#06B6D4' : '#67E8F9',
    backgroundColor: theme === 'light' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(103, 232, 249, 0.15)',
    borderColor: theme === 'light' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(103, 232, 249, 0.3)',
    fontFamily: 'Inter-Bold',
    hasSwirl: false,
    textShadow: {
      color: theme === 'light' ? 'rgba(6, 182, 212, 0.6)' : 'rgba(103, 232, 249, 0.7)',
      offset: { width: 0, height: 0 },
      radius: 2,
    },
    premiumGlow: false,
    tooltip: 'Verified community member',
  },
  early: {
    text: '⭐',
    color: theme === 'light' ? '#10B981' : '#34D399',
    backgroundColor: theme === 'light' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(52, 211, 153, 0.15)',
    borderColor: theme === 'light' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(52, 211, 153, 0.3)',
    fontFamily: 'Inter-Bold',
    hasSwirl: false,
    textShadow: {
      color: theme === 'light' ? 'rgba(16, 185, 129, 0.6)' : 'rgba(52, 211, 153, 0.7)',
      offset: { width: 0, height: 0 },
      radius: 3,
    },
    premiumGlow: false,
    tooltip: 'Early adopter who joined in the first wave',
  },
  supporter: {
    text: '💎',
    color: theme === 'light' ? '#3B82F6' : '#60A5FA',
    backgroundColor: theme === 'light' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(96, 165, 250, 0.15)',
    borderColor: theme === 'light' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(96, 165, 250, 0.3)',
    fontFamily: 'Inter-Bold',
    hasSwirl: false,
    textShadow: {
      color: theme === 'light' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(96, 165, 250, 0.7)',
      offset: { width: 0, height: 0 },
      radius: 3,
    },
    premiumGlow: false,
    tooltip: 'Platform supporter and contributor',
  },
  creator: {
    text: '🎨',
    color: theme === 'light' ? '#F59E0B' : '#FCD34D',
    backgroundColor: theme === 'light' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(252, 211, 77, 0.15)',
    borderColor: theme === 'light' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(252, 211, 77, 0.3)',
    fontFamily: 'Inter-Bold',
    hasSwirl: false,
    textShadow: {
      color: theme === 'light' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(252, 211, 77, 0.7)',
      offset: { width: 0, height: 0 },
      radius: 3,
    },
    premiumGlow: false,
    tooltip: 'Content creator and community builder',
  },
});


export const UserBadge: React.FC<UserBadgeProps> = ({
  type,
  visible = true,
  glowIntensity = 'medium',
  style,
  theme = 'light',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!visible) return null;

  const config = getBadgeConfig(theme)[type];

  const getGlowStyle = () => {
    const glowSettings = {
      low: { shadowRadius: 3, shadowOpacity: 0.4 },
      medium: { shadowRadius: 5, shadowOpacity: 0.6 },
      high: { shadowRadius: 8, shadowOpacity: 0.8 },
    };
    
    return glowSettings[glowIntensity];
  };

  const glow = getGlowStyle();

  const handlePress = () => {
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000); // Hide after 3 seconds
  };

  return (
    <View style={styles.badgeContainer}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.userBadge,
          {
            backgroundColor: config.backgroundColor,
            shadowColor: config.premiumGlow ? (type === 'founder' ? (theme === 'light' ? '#FFD700' : '#FFF700') : (theme === 'light' ? '#9B59B6' : '#C77DFF')) : config.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: config.premiumGlow ? (theme === 'light' ? 0.8 : 1.0) : (theme === 'light' ? glow.shadowOpacity * 0.8 : glow.shadowOpacity),
            shadowRadius: config.premiumGlow ? glow.shadowRadius * 2.2 : glow.shadowRadius,
            elevation: config.premiumGlow ? (glowIntensity === 'high' ? 15 : glowIntensity === 'medium' ? 12 : 8) : (glowIntensity === 'high' ? 10 : glowIntensity === 'medium' ? 7 : 4),
            borderColor: config.borderColor,
            borderWidth: config.premiumGlow ? 1 : 1,
          },
          style,
        ]}
      >
      {config.hasSwirl && (
        <AbstractSwirl
          width={50}
          height={24}
          theme={theme}
        />
      )}
      <Text
        style={[
          styles.badgeText,
          config.premiumGlow && styles.premiumText,
          { 
            color: config.color,
            fontFamily: config.fontFamily,
            zIndex: 1,
            ...(config.textShadow && {
              textShadowColor: config.textShadow.color,
              textShadowOffset: config.textShadow.offset,
              textShadowRadius: config.textShadow.radius,
            }),
          }
        ]}
      >
        {config.text}
      </Text>
      </TouchableOpacity>
      
      <MiniTooltip
        text={config.tooltip}
        visible={showTooltip}
        theme={theme}
        position="top"
        width={160}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'relative',
  },
  userBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
    minHeight: 24,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
});

export default UserBadge;