/**
 * Standard Notification Dot Component
 * Reusable notification indicator with glow effect
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { designTokens } from '../../tokens/colors';

interface NotificationDotProps {
  visible?: boolean;
  color?: string;
  size?: number;
  glowIntensity?: 'low' | 'medium' | 'high';
  style?: any;
}

export const NotificationDot: React.FC<NotificationDotProps> = ({
  visible = true,
  color = designTokens.pastels.coral,
  size = 8,
  glowIntensity = 'medium',
  style,
}) => {
  if (!visible) return null;

  const getGlowStyle = () => {
    const glowSettings = {
      low: { shadowRadius: 2, shadowOpacity: 0.6 },
      medium: { shadowRadius: 4, shadowOpacity: 0.8 },
      high: { shadowRadius: 6, shadowOpacity: 1.0 },
    };
    
    return glowSettings[glowIntensity];
  };

  const glow = getGlowStyle();

  return (
    <View
      style={[
        styles.notificationDot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: glow.shadowOpacity,
          shadowRadius: glow.shadowRadius,
          elevation: glowIntensity === 'high' ? 6 : glowIntensity === 'medium' ? 4 : 2,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 999,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

export default NotificationDot;