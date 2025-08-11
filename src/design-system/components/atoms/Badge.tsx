import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { designTokens } from '../../tokens/colors';

interface BadgeProps {
  children: React.ReactNode;
  theme: 'light' | 'dark';
  variant?: 'default' | 'small';
  glowIntensity?: 'low' | 'medium' | 'high';
}

const Badge: React.FC<BadgeProps> = ({ 
  children, 
  theme, 
  variant = 'default',
  glowIntensity = 'medium'
}) => {
  const getGlowStyle = () => {
    const glowSettings = {
      low: { shadowRadius: 3, shadowOpacity: 0.3 },
      medium: { shadowRadius: 5, shadowOpacity: 0.5 },
      high: { shadowRadius: 8, shadowOpacity: 0.7 },
    };
    
    return glowSettings[glowIntensity];
  };

  const glow = getGlowStyle();
  
  const getBadgeStyle = () => {
    if (theme === 'dark') {
      return {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: glow.shadowOpacity,
        shadowRadius: glow.shadowRadius,
        elevation: glowIntensity === 'high' ? 8 : glowIntensity === 'medium' ? 5 : 3,
      };
    } else {
      return {
        backgroundColor: designTokens.surfaces.light.elevated,
        borderWidth: 1,
        borderColor: designTokens.borders.light.accent,
        shadowColor: designTokens.brand.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: glow.shadowOpacity,
        shadowRadius: glow.shadowRadius,
        elevation: glowIntensity === 'high' ? 6 : glowIntensity === 'medium' ? 4 : 2,
      };
    }
  };

  return (
    <View style={[
      styles.badge,
      variant === 'small' && styles.smallBadge,
      getBadgeStyle()
    ]}>
      <Text style={[
        styles.badgeText,
        variant === 'small' && styles.smallBadgeText,
        {
          color: theme === 'dark'
            ? '#FFFFFF'
            : '#2D3748',
          fontWeight: '700',
        },
        // Multiple text shadows for glow effect
        theme === 'dark' ? {
          textShadowColor: 'rgba(255,255,255,0.8)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 4,
        } : {
          textShadowColor: 'rgba(69, 90, 120, 0.6)',
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 3,
        }
      ]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  smallBadgeText: {
    fontSize: 9,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
});

export default Badge;