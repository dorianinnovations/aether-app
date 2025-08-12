/**
 * PriorityIndicator Component
 * Visual indicator for content priority
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

// Design System
import type { ThemeColors } from '../types';

type Priority = 'low' | 'medium' | 'high';

interface PriorityIndicatorProps {
  priority: Priority;
  colors: ThemeColors;
}

const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({ priority, colors }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (priority === 'high') {
      // Create pulsing animation for high priority
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [priority, pulseAnim]);

  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return '#EF4444'; // Red
      case 'medium':
        return '#F59E0B'; // Amber
      case 'low':
        return colors.textTertiary;
      default:
        return colors.textTertiary;
    }
  };

  const getIndicatorStyle = () => {
    const color = getPriorityColor();
    
    if (priority === 'high') {
      return {
        backgroundColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 4,
      };
    }
    
    return {
      backgroundColor: color,
    };
  };

  if (priority === 'low') {
    return null; // Don't show indicator for low priority
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.indicator,
          getIndicatorStyle(),
          priority === 'high' && {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      {priority === 'high' && (
        <View style={[styles.glow, { backgroundColor: getPriorityColor() }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    overflow: 'visible',
  },
  indicator: {
    width: 4,
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  glow: {
    position: 'absolute',
    top: '50%',
    left: -2,
    width: 8,
    height: 40,
    marginTop: -20,
    borderRadius: 4,
    opacity: 0.3,
  },
});

export default PriorityIndicator;