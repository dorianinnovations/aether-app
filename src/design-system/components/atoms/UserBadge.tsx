/**
 * User Badge Component
 * Similar to NotificationDot but larger and wider for user status badges (Founder, OG User, etc.)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { MiniTooltip } from './MiniTooltip';

export type UserBadgeType = 'founder' | 'og' | 'early' | 'supporter' | 'verified' | 'creator' | 'vip' | 'elite' | 'legendary';

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
    text: 'FOUNDER',
    color: theme === 'light' ? '#FF6B35' : '#FF8C42',
    backgroundColor: 'transparent',
    borderColor: theme === 'light' ? '#FF6B35' : '#FF8C42',
    fontFamily: 'Inter-ExtraBold',
    hasSwirl: false,
    textShadow: null,
    premiumGlow: true,
    tooltip: 'Founding member who helped build Aether from the ground up',
  },
  og: {
    text: 'OG',
    color: theme === 'light' ? '#8B5CF6' : '#A78BFA',
    backgroundColor: 'transparent',
    borderColor: theme === 'light' ? '#8B5CF6' : '#A78BFA',
    fontFamily: 'Inter-ExtraBold',
    hasSwirl: false,
    textShadow: null,
    premiumGlow: true,
    tooltip: 'OG member from the early days of Aether',
  },
  verified: {
    text: 'VIP',
    color: theme === 'light' ? '#D97706' : '#F59E0B',
    backgroundColor: 'transparent',
    borderColor: theme === 'light' ? '#D97706' : '#F59E0B',
    fontFamily: 'Inter-ExtraBold',
    hasSwirl: false,
    textShadow: null,
    premiumGlow: true,
    tooltip: 'Verified community member',
  },
  early: {
    text: 'EARLY',
    color: theme === 'light' ? '#10B981' : '#34D399',
    backgroundColor: 'transparent',
    borderColor: theme === 'light' ? '#10B981' : '#34D399',
    fontFamily: 'Inter-ExtraBold',
    hasSwirl: false,
    textShadow: null,
    premiumGlow: false,
    tooltip: 'Early adopter who joined in the first wave',
  },
  supporter: {
    text: 'PRO',
    color: theme === 'light' ? '#3B82F6' : '#60A5FA',
    backgroundColor: 'transparent',
    borderColor: theme === 'light' ? '#3B82F6' : '#60A5FA',
    fontFamily: 'Inter-ExtraBold',
    hasSwirl: false,
    textShadow: null,
    premiumGlow: false,
    tooltip: 'Platform supporter and contributor',
  },
  creator: {
    text: 'CREATOR',
    color: theme === 'light' ? '#F59E0B' : '#FCD34D',
    backgroundColor: 'transparent',
    borderColor: theme === 'light' ? '#F59E0B' : '#FCD34D',
    fontFamily: 'Inter-ExtraBold',
    hasSwirl: false,
    textShadow: null,
    premiumGlow: false,
    tooltip: 'Content creator and community builder',
  },
  vip: {
    text: 'VIP',
    color: theme === 'light' ? '#8B5CF6' : '#A78BFA',
    backgroundColor: 'transparent',
    borderColor: theme === 'light' ? '#8B5CF6' : '#A78BFA',
    fontFamily: 'Inter-ExtraBold',
    hasSwirl: false,
    textShadow: null,
    premiumGlow: true,
    tooltip: 'VIP member with special privileges',
  },
  elite: {
    text: 'ELITE',
    color: theme === 'light' ? '#DC2626' : '#EF4444',
    backgroundColor: 'transparent',
    borderColor: theme === 'light' ? '#DC2626' : '#EF4444',
    fontFamily: 'Inter-ExtraBold',
    hasSwirl: false,
    textShadow: null,
    premiumGlow: true,
    tooltip: 'Elite member with exclusive access',
  },
  legendary: {
    text: 'LEGEND',
    color: theme === 'light' ? '#FF6B35' : '#FF8C42',
    backgroundColor: 'transparent',
    borderColor: theme === 'light' ? '#FF6B35' : '#FF8C42',
    fontFamily: 'Inter-ExtraBold',
    hasSwirl: false,
    textShadow: null,
    premiumGlow: true,
    tooltip: 'Legendary member with ultimate status',
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

  const badgeConfigs = getBadgeConfig(theme);
  const config = badgeConfigs[type];
  
  // Return null if invalid badge type
  if (!config) {
    console.warn(`UserBadge: Invalid badge type "${type}". Valid types are: ${Object.keys(badgeConfigs).join(', ')}`);
    return null;
  }

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
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  premiumText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
});

export default UserBadge;