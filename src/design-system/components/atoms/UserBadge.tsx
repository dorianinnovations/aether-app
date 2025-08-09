/**
 * User Badge Component
 * Similar to NotificationDot but larger and wider for user status badges (Founder, OG User, etc.)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { MiniTooltip } from './MiniTooltip';

export type UserBadgeType = 'founder' | 'og';

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
    color: theme === 'light' ? '#B8860B' : '#FFF700',
    backgroundColor: theme === 'light' ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 215, 0, 0.2)',
    borderColor: theme === 'light' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.4)',
    fontFamily: 'Inter-Bold',
    hasSwirl: true,
    textShadow: {
      color: theme === 'light' ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 247, 0, 0.9)',
      offset: { width: 0, height: 0 },
      radius: theme === 'light' ? 6 : 8,
    },
    premiumGlow: true,
    tooltip: 'This badge is presented to users who supported Aether during its founding period and helped shape the platform.',
  },
  og: {
    text: 'OG',
    color: theme === 'light' ? '#8B5CF6' : '#E879F9',
    backgroundColor: theme === 'light' ? 'rgba(155, 89, 182, 0.25)' : 'rgba(155, 89, 182, 0.2)',
    borderColor: theme === 'light' ? 'rgba(155, 89, 182, 0.4)' : 'rgba(155, 89, 182, 0.5)',
    fontFamily: 'Inter-Bold',
    hasSwirl: false,
    textShadow: {
      color: theme === 'light' ? 'rgba(139, 92, 246, 0.8)' : 'rgba(232, 121, 249, 0.9)',
      offset: { width: 0, height: 0 },
      radius: theme === 'light' ? 5 : 7,
    },
    premiumGlow: true,
    tooltip: 'This badge is presented to users who were among the first to join Aether and helped establish the community.',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    overflow: 'hidden',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
});

export default UserBadge;