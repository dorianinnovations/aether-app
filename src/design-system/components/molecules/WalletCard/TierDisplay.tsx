/**
 * Tier Display Component
 * Shows the current tier status with visual indicators
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TierType } from '../../../../hooks/useTierManagement';

interface TierDisplayProps {
  currentTier: TierType;
  theme: 'light' | 'dark';
}

export const TierDisplay: React.FC<TierDisplayProps> = ({
  currentTier,
  theme,
}) => {
  const getTierConfig = () => {
    switch (currentTier) {
      case 'standard':
        return {
          name: 'STANDARD',
          colors: ['#10B981', '#059669'] as const,
          textColor: '#ffffff',
        };
      case 'pro':
        return {
          name: 'LEGENDARY',
          colors: ['#EF4444', '#DC2626'] as const,
          textColor: '#ffffff',
        };
      case 'elite':
        return {
          name: 'VIP',
          colors: ['#F59E0B', '#D97706'] as const,
          textColor: '#ffffff',
        };
      default:
        return {
          name: 'STANDARD',
          colors: ['#10B981', '#059669'] as const,
          textColor: '#ffffff',
        };
    }
  };

  const config = getTierConfig();

  return (
    <LinearGradient
      colors={config.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.tierBadge}
    >
      <Text style={[styles.tierText, { color: config.textColor }]}>
        {config.name}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'System',
  },
});