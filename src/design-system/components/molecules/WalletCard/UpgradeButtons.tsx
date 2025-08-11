/**
 * Upgrade Buttons Component
 * Handles tier upgrade interface with long press interaction
 */

import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TierType } from '../../../../hooks/useTierManagement';

interface UpgradeButtonsProps {
  currentTier: TierType;
  longPressAnim: Animated.Value;
  onLongPressStart: (tier: 'pro' | 'elite') => void;
  onLongPressEnd: () => void;
  onShowBenefits: () => void;
  theme: 'light' | 'dark';
}

export const UpgradeButtons: React.FC<UpgradeButtonsProps> = ({
  currentTier,
  longPressAnim,
  onLongPressStart,
  onLongPressEnd,
  onShowBenefits,
  theme,
}) => {
  const isStandardTier = currentTier === 'standard';

  if (!isStandardTier) {
    return (
      <TouchableOpacity
        style={[styles.benefitsButton, {
          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f8f8f8',
          borderColor: theme === 'dark' ? '#404040' : '#e0e0e0',
        }]}
        onPress={onShowBenefits}
        activeOpacity={0.8}
      >
        <Text style={[styles.benefitsButtonText, {
          color: theme === 'dark' ? '#ffffff' : '#000000'
        }]}>
          View Benefits
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.upgradeSection}>
      <Text style={[styles.upgradeTitle, {
        color: theme === 'dark' ? '#ffffff' : '#000000'
      }]}>
        Upgrade Your Experience
      </Text>
      
      <View style={styles.upgradeButtons}>
        {/* Pro Upgrade Button */}
        <TouchableOpacity
          style={styles.upgradeButton}
          onLongPress={() => onLongPressStart('pro')}
          onPressOut={onLongPressEnd}
          onPress={onShowBenefits}
          delayLongPress={100}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.upgradeGradient, styles.proButton]}
          >
            <Animated.View
              style={[
                styles.longPressProgress,
                {
                  width: longPressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
            <View style={styles.buttonContent}>
              <Text style={styles.tierButtonTitle}>LEGENDARY</Text>
              <Text style={styles.tierButtonSubtitle}>Hold to upgrade</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Elite Upgrade Button */}
        <TouchableOpacity
          style={styles.upgradeButton}
          onLongPress={() => onLongPressStart('elite')}
          onPressOut={onLongPressEnd}
          onPress={onShowBenefits}
          delayLongPress={100}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.upgradeGradient, styles.eliteButton]}
          >
            <Animated.View
              style={[
                styles.longPressProgress,
                {
                  width: longPressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
            <View style={styles.buttonContent}>
              <Text style={styles.tierButtonTitle}>VIP</Text>
              <Text style={styles.tierButtonSubtitle}>Hold to upgrade</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  upgradeSection: {
    marginTop: 24,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'System',
  },
  upgradeButtons: {
    gap: 12,
  },
  upgradeButton: {
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  proButton: {
    // Pro-specific styles
  },
  eliteButton: {
    // Elite-specific styles
  },
  longPressProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  buttonContent: {
    alignItems: 'center',
  },
  tierButtonTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  tierButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'System',
  },
  benefitsButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  benefitsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});