/**
 * ConversationSkeleton - Skeleton loader for conversation list items
 * Matches the exact layout of conversation cards while loading
 * Updated with 750ms timing and reduced widths
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing } from '../../tokens/spacing';

interface ConversationSkeletonProps {
  delay?: number; // Delay in milliseconds before starting animation
}

const ConversationSkeleton: React.FC<ConversationSkeletonProps> = ({ delay = 0 }) => {
  const { theme } = useTheme();
  const shimmerValue = useSharedValue(0);
  const shineValue = useSharedValue(-1);

  React.useEffect(() => {
    // Delay the start of the animation
    const timeoutId = setTimeout(() => {
      // Base shimmer animation - runs indefinitely
      shimmerValue.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
      
      // Subtle shine effect that sweeps across - runs indefinitely
      shineValue.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
          withTiming(-1, { duration: 0 }) // Reset instantly
        ),
        -1,
        false
      );
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay]);

  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerValue.value,
      [0, 1],
      [0.5, 0.7]
    );
    
    return {
      opacity,
    };
  });

  const shineStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shineValue.value,
      [-1, 1],
      [-100, 100]
    );
    
    const opacity = interpolate(
      shineValue.value,
      [-1, -0.5, 0, 0.5, 1],
      [0, 0.3, 0.6, 0.3, 0]
    );
    
    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  const getSkeletonColor = () => {
    return theme === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.08)';
  };

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: theme === 'dark'
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(0, 0, 0, 0.03)',
        borderColor: theme === 'dark'
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(0, 0, 0, 0.08)',
      }
    ]}>
      {/* Shine overlay */}
      <Animated.View style={[
        styles.shineOverlay,
        {
          backgroundColor: theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(255, 255, 255, 0.8)',
        },
        shineStyle,
      ]} />
      
      {/* Pastel dot skeleton */}
      <Animated.View style={[
        styles.pastelDotSkeleton,
        { backgroundColor: getSkeletonColor() },
        shimmerStyle,
      ]} />
      <View style={styles.content}>
        {/* Title and Time Row */}
        <View style={styles.header}>
          <Animated.View style={[
            styles.titleSkeleton,
            { backgroundColor: getSkeletonColor() },
            shimmerStyle,
          ]} />
          <Animated.View style={[
            styles.timeSkeleton,
            { backgroundColor: getSkeletonColor() },
            shimmerStyle,
          ]} />
        </View>
        
        {/* Summary/Preview */}
        <Animated.View style={[
          styles.summarySkeleton,
          { backgroundColor: getSkeletonColor() },
          shimmerStyle,
        ]} />
        <Animated.View style={[
          styles.summarySkeletonShort,
          { backgroundColor: getSkeletonColor() },
          shimmerStyle,
        ]} />
        
        {/* Meta Row */}
        <View style={styles.meta}>
          <Animated.View style={[
            styles.messageCountSkeleton,
            { backgroundColor: getSkeletonColor() },
            shimmerStyle,
          ]} />
          <Animated.View style={[
            styles.dotsSkeleton,
            { backgroundColor: getSkeletonColor() },
            shimmerStyle,
          ]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 9, // 25% smaller: 12 -> 9
    paddingHorizontal: spacing[3], // 25% smaller: spacing[4] -> spacing[3]
    paddingVertical: 6, // 25% smaller: 8 -> 6 (spacing[1] is 8)
    marginHorizontal: spacing[1],
    marginVertical: 1.5, // 25% smaller: 2 -> 1.5
    marginBottom: 9, // 25% smaller: 12 -> 9
    borderWidth: 0.75, // 25% smaller: 1 -> 0.75
    position: 'relative',
    overflow: 'hidden', // Important for shine effect
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: -50,
    right: -50,
    bottom: 0,
    width: 50,
    height: '100%',
    borderRadius: 9,
  },
  pastelDotSkeleton: {
    position: 'absolute',
    top: 6, // 25% smaller: 8 -> 6
    right: 9, // 25% smaller: 12 -> 9
    width: 6, // 25% smaller: 8 -> 6
    height: 6, // 25% smaller: 8 -> 6
    borderRadius: 3, // 25% smaller: 4 -> 3
  },
  content: {
    gap: 6, // 25% smaller: 8 -> 6 (spacing[1] is 8)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSkeleton: {
    height: 15, // 25% smaller: 20 -> 15
    width: '45%',
    borderRadius: 3, // 25% smaller: 4 -> 3
  },
  timeSkeleton: {
    height: 10.5, // 25% smaller: 14 -> 10.5
    width: '15%',
    borderRadius: 2.25, // 25% smaller: 3 -> 2.25
  },
  summarySkeleton: {
    height: 12, // 25% smaller: 16 -> 12
    width: '70%',
    borderRadius: 2.25, // 25% smaller: 3 -> 2.25
  },
  summarySkeletonShort: {
    height: 12, // 25% smaller: 16 -> 12
    width: '50%',
    borderRadius: 2.25, // 25% smaller: 3 -> 2.25
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCountSkeleton: {
    height: 9, // 25% smaller: 12 -> 9
    width: '20%',
    borderRadius: 2.25, // 25% smaller: 3 -> 2.25
  },
  dotsSkeleton: {
    height: 12, // 25% smaller: 16 -> 12
    width: 12, // 25% smaller: 16 -> 12
    borderRadius: 6, // 25% smaller: 8 -> 6
  },
});

export default ConversationSkeleton;