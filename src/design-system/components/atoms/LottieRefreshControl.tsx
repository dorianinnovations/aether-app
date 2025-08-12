/**
 * Aether Design System - Lottie Refresh Control Component
 * Wrapper component that provides FlatList with Lottie refresh animation
 */

import React, { useRef, useEffect } from 'react';
import { RefreshControl, View, StyleSheet, Animated, FlatList, FlatListProps } from 'react-native';
import LottieView from 'lottie-react-native';
import { getThemeColors } from '../../tokens/colors';

interface LottieRefreshFlatListProps<T> extends Omit<FlatListProps<T>, 'refreshControl'> {
  refreshing: boolean;
  onRefresh: () => void;
  theme: 'light' | 'dark';
  tintColor?: string;
  lottieSize?: 'small' | 'medium' | 'large';
  showLottieOverlay?: boolean;
}

export function LottieRefreshFlatList<T>({
  refreshing,
  onRefresh,
  theme,
  tintColor,
  lottieSize = 'medium',
  showLottieOverlay = true,
  ...flatListProps
}: LottieRefreshFlatListProps<T>) {
  const colors = getThemeColors(theme);
  const lottieRef = useRef<LottieView>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  const getDimensions = () => {
    switch (lottieSize) {
      case 'small':
        return { width: 40, height: 40 };
      case 'medium':
        return { width: 50, height: 50 };
      case 'large':
        return { width: 60, height: 60 };
      default:
        return { width: 50, height: 50 };
    }
  };

  const { width, height } = getDimensions();

  // Animate Lottie based on refreshing state
  useEffect(() => {
    if (refreshing && showLottieOverlay) {
      // Show and animate the Lottie
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
      
      lottieRef.current?.play();
    } else {
      // Hide the Lottie
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      lottieRef.current?.reset();
    }
  }, [refreshing, showLottieOverlay]);

  return (
    <View style={styles.container}>
      {/* FlatList with RefreshControl */}
      <FlatList
        {...flatListProps}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tintColor || colors.primary}
            colors={[tintColor || colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      />
      
      {/* Lottie Overlay - only show if enabled and refreshing */}
      {showLottieOverlay && (
        <Animated.View
          style={[
            styles.lottieOverlay,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={[styles.lottieBackground, { backgroundColor: colors.surface + 'E6' }]}>
            <LottieView
              ref={lottieRef}
              source={require('../../../../assets/AetherTwister.json')}
              style={{
                width,
                height,
              }}
              loop={true}
              autoPlay={false}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// Helper function to create a standard RefreshControl with Lottie theming
export const createLottieRefreshControl = (
  refreshing: boolean,
  onRefresh: () => void,
  theme: 'light' | 'dark',
  tintColor?: string
) => {
  const colors = getThemeColors(theme);
  
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={tintColor || colors.primary}
      colors={[tintColor || colors.primary]}
      progressBackgroundColor={colors.surface}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lottieOverlay: {
    position: 'absolute',
    top: 100, // Position below the header to account for safe area
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieBackground: {
    borderRadius: 25,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default LottieRefreshFlatList;