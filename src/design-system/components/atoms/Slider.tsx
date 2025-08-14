/**
 * Slider Component - Music Preferences Slider
 * Beautiful, responsive slider for music preference controls
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Design System
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

interface SliderProps {
  label: string;
  description?: string;
  value: number; // 0 to 1
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  theme: 'light' | 'dark';
  colors: {
    primary?: string;
    textPrimary?: string;
    text?: string;
    textSecondary?: string;
    textMuted?: string;
  };
  disabled?: boolean;
  showValue?: boolean;
  unit?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const SLIDER_WIDTH = screenWidth * 0.35;
const THUMB_SIZE = 20;
const TRACK_HEIGHT = 4;

export const Slider: React.FC<SliderProps> = ({
  label,
  description,
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 1,
  step = 0.01,
  theme,
  colors,
  disabled = false,
  showValue = true,
  unit = '',
}) => {
  const pan = useRef(new Animated.Value(0)).current;
  const [isDragging, setIsDragging] = useState(false);

  // Calculate thumb position based on value
  const thumbPosition = ((value - minimumValue) / (maximumValue - minimumValue)) * SLIDER_WIDTH;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {
        setIsDragging(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        pan.setOffset(thumbPosition);
        pan.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (disabled) return;
        
        const newPosition = Math.max(0, Math.min(SLIDER_WIDTH, thumbPosition + gestureState.dx));
        pan.setValue(gestureState.dx);
        
        // Calculate new value
        const newValue = minimumValue + (newPosition / SLIDER_WIDTH) * (maximumValue - minimumValue);
        const steppedValue = Math.round(newValue / step) * step;
        const clampedValue = Math.max(minimumValue, Math.min(maximumValue, steppedValue));
        
        onValueChange(clampedValue);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        pan.flattenOffset();
        pan.setValue(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
    })
  ).current;

  const formatValue = useCallback((val: number) => {
    if (unit === '%') {
      return `${Math.round(val * 100)}%`;
    }
    if (unit === 'bpm') {
      return `${Math.round(val)}${unit}`;
    }
    return val.toFixed(2);
  }, [unit]);

  const isDarkMode = theme === 'dark';

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[
          styles.label, 
          { 
            color: colors.textSecondary || colors.textMuted,
            fontFamily: typography.fonts.body,
          }
        ]}>
          {label}
        </Text>
        {showValue && (
          <Text style={[
            styles.value,
            {
              color: colors.textPrimary || colors.text,
              fontFamily: typography.fonts.body,
            }
          ]}>
            {formatValue(value)}
          </Text>
        )}
      </View>

      {description && (
        <Text style={[
          styles.description,
          {
            color: colors.textSecondary || colors.textMuted,
            fontFamily: typography.fonts.body,
          }
        ]}>
          {description}
        </Text>
      )}

      <View style={styles.sliderContainer}>
        {/* Track */}
        <View style={[
          styles.track,
          {
            backgroundColor: isDarkMode 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)',
          }
        ]} />

        {/* Active Track */}
        <View style={[
          styles.activeTrack,
          {
            width: thumbPosition,
            backgroundColor: colors.primary || '#3b82f6',
          }
        ]} />

        {/* Thumb */}
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: colors.primary || '#3b82f6',
              borderColor: isDarkMode ? '#1a1a1a' : '#ffffff',
              transform: [
                { translateX: pan },
                { scale: isDragging ? 1.2 : 1 },
              ],
              left: thumbPosition - THUMB_SIZE / 2,
              shadowColor: isDarkMode ? '#000000' : '#000000',
              opacity: disabled ? 0.5 : 1,
            }
          ]}
          {...panResponder.panHandlers}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  description: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginTop: 2,
    lineHeight: 16,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  track: {
    width: SLIDER_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
  },
  activeTrack: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: 'absolute',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    position: 'absolute',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});