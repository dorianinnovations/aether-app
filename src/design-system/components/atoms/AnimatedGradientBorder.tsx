/**
 * 🔥 AnimatedGradientBorder - The ULTIMATE React Native Animated Border Component
 * 
 * The definitive solution for animated gradient borders in React Native.
 * Born from the debugging trenches and battle-tested in production.
 * 
 * Features:
 * ✅ Smooth perimeter traveling spotlight effect
 * ✅ Proper clipping masks for perfect border isolation
 * ✅ Color matching with parent backgrounds
 * ✅ TypeScript support with full type safety
 * ✅ Dark mode compatible
 * ✅ Performance optimized for 60fps
 * ✅ Production ready
 * 
 * Usage:
 * ```tsx
 * <AnimatedGradientBorder
 *   isActive={isRefreshing}
 *   borderRadius={12}
 *   borderWidth={1}
 *   animationSpeed={4000}
 * >
 *   <YourContent />
 * </AnimatedGradientBorder>
 * ```
 * 
 * @version 1.0.0
 * @author Numina AI Team
 * @license MIT
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  ViewStyle, 
  View, 
  Animated, 
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export interface AnimatedGradientBorderProps {
  /** Controls whether the animation is active */
  isActive: boolean;
  
  /** Border radius for the container */
  borderRadius?: number;
  
  /** Thickness of the animated border */
  borderWidth?: number;
  
  /** Animation speed in milliseconds (default: 4000ms) */
  animationSpeed?: number;
  
  /** Custom gradient colors for the spotlight */
  gradientColors?: string[];
  
  /** Background color override (auto-detects dark mode if not provided) */
  backgroundColor?: string;
  
  /** The content to render inside the border */
  children: React.ReactNode;
  
  /** Additional container styles */
  style?: ViewStyle;
  
  /** Debug mode - logs animation state (default: false) */
  debug?: boolean;
  
  /** Animation direction */
  direction?: 'clockwise' | 'counterclockwise';
  
  /** Animation speed (1=slow, 2=medium, 3=fast) */
  speed?: 1 | 2 | 3;
  
  /** Animation variation style */
  variation?: 'smooth' | 'pulse' | 'wave';
  
  /** Enable/disable border effects (uses settings if not provided) */
  effectsEnabled?: boolean;
  
  /** Brightness level 0-100 (uses settings if not provided) */
  brightness?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const AnimatedGradientBorderComponent: React.FC<AnimatedGradientBorderProps> = ({
  isActive,
  borderRadius = 12,
  borderWidth = 1,
  animationSpeed = 4000,
  gradientColors,
  backgroundColor,
  children,
  style,
  debug = false,
  direction = 'clockwise',
  speed = 2,
  variation = 'smooth',
  effectsEnabled,
  brightness,
}) => {
  const { theme, colors } = useTheme();
  const isDarkMode = theme === 'dark';
  // Default values (border contexts removed)
  const selectedTheme = { 
    id: 'electric-neon',
    name: 'Electric Neon',
    colors: ['#6ec5ff', '#a18cff', '#ff6ec7']
  };
  const settingsEffectsEnabled = true;
  const settingsBrightness = 80;
  const settingsSpeed = 2;
  const settingsDirection = 'clockwise';
  const settingsVariation = 'smooth';
  const settingsLoading = false;
  
  // Wait for settings to load before determining final values
  // If still loading, use defaults to prevent flickering
  const finalEffectsEnabled = settingsLoading 
    ? (effectsEnabled !== undefined ? effectsEnabled : true)
    : (effectsEnabled !== undefined ? effectsEnabled : settingsEffectsEnabled);
    
  const finalBrightness = settingsLoading 
    ? (brightness !== undefined ? brightness : 80)
    : (brightness !== undefined ? brightness : settingsBrightness);
    
  const finalSpeed = settingsLoading 
    ? (speed !== undefined ? speed : 2)
    : (speed !== undefined ? speed : settingsSpeed);
    
  const finalDirection = settingsLoading 
    ? (direction !== undefined ? direction : 'clockwise')
    : (direction !== undefined ? direction : settingsDirection);
    
  const finalVariation = settingsLoading 
    ? (variation !== undefined ? variation : 'smooth')
    : (variation !== undefined ? variation : settingsVariation);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // STATE AND REFS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  // Debug logging moved after state declarations to fix scoping issues

  // Animation values - use refs to prevent recreation on re-renders
  const progress = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Animation cleanup refs
  const travelAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const opacityAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════════
  // CALCULATED VALUES
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Memoize expensive calculations - line effect instead of circle
  const spotlightWidth = useMemo(() => 
    Math.max(width, height) * 0.15, // Line width
    [width, height]
  );
  
  const spotlightHeight = useMemo(() => 
    4, // Thin line height
    []
  );
  
  const brightnessMultiplier = useMemo(() => 
    Math.max(0.1, Math.min(1.0, finalBrightness / 100)),
    [finalBrightness]
  );
  
  const adjustedOpacity = useMemo(() => {
    const baseOpacity = isDarkMode ? 0.8 : 0.7;
    return baseOpacity * brightnessMultiplier;
  }, [isDarkMode, brightnessMultiplier]);
  
  const computedGradientColors = useMemo(() => {
    const primary = gradientColors?.[0] || (isDarkMode 
      ? `rgba(88, 183, 255, ${adjustedOpacity})` // Bright Cyan - ELECTRIC!
      : `rgba(59, 130, 246, ${adjustedOpacity})`); // Blue for light mode
    const secondary = gradientColors?.[1] || (isDarkMode 
      ? `rgba(138, 43, 226, ${adjustedOpacity * 0.75})` // Electric Purple - VIBRANT!
      : `rgba(99, 102, 241, ${adjustedOpacity * 0.75})`); // Indigo for light mode
    return [primary, secondary];
  }, [gradientColors, isDarkMode, adjustedOpacity]);
  
  const finalBackgroundColor = useMemo(() => 
    backgroundColor || (isDarkMode ? 'rgb(9, 9, 9)' : colors.background),
    [backgroundColor, isDarkMode, colors.background]
  );
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // ANIMATION SYSTEM
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Memoize animation configuration to prevent recalculation
  const animationConfig = useMemo(() => {
    const speedMultiplier = finalSpeed === 1 ? 1.5 : finalSpeed === 2 ? 1 : 0.6;
    const finalDuration = animationSpeed * speedMultiplier;
    const easing = finalVariation === 'smooth' ? Easing.linear :
                  finalVariation === 'pulse' ? Easing.inOut(Easing.sin) :
                  Easing.bezier(0.25, 0.46, 0.45, 0.94); // wave
    return { finalDuration, easing };
  }, [animationSpeed, finalSpeed, finalVariation]);

  useEffect(() => {
    if (debug) {
      //   isActive,
      //   width,
      //   height,
      //   spotlightSize,
      //   finalBackgroundColor,
      //   isDarkMode,
      //   translateXRange: [-60, width - 60],
      //   translateYRange: [-60, height - 60],
      // });
    }
    
    // Check if component is active and effects are enabled
    // Also ensure settings have loaded to prevent premature animation start
    if (isActive && finalEffectsEnabled && width > 0 && height > 0) {
      // Cleanup function to stop all animations
      const cleanup = () => {
        if (travelAnimationRef.current) {
          travelAnimationRef.current.stop();
          travelAnimationRef.current = null;
        }
        if (opacityAnimationRef.current) {
          opacityAnimationRef.current.stop();
          opacityAnimationRef.current = null;
        }
        progress.stopAnimation();
      };

      // Start opacity fade-in
      opacityAnimationRef.current = Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });
      opacityAnimationRef.current.start();

      // Start perimeter traveling animation using memoized config
      travelAnimationRef.current = Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: animationConfig.finalDuration,
          easing: animationConfig.easing,
          useNativeDriver: false,
        })
      );
      
      travelAnimationRef.current.start();

      return cleanup;
    } else {
      // Stop animations when not active
      if (travelAnimationRef.current) {
        travelAnimationRef.current.stop();
        travelAnimationRef.current = null;
      }
      if (opacityAnimationRef.current) {
        opacityAnimationRef.current.stop();
      }
      
      progress.stopAnimation();
      opacityAnimationRef.current = Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      });
      opacityAnimationRef.current.start(() => {
        progress.setValue(0);
      });
    }
  }, [isActive, finalEffectsEnabled, width, height, animationConfig, debug]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // PERIMETER PATH CALCULATION
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Memoize perimeter path calculations for line effect
  const pathCoordinates = useMemo(() => {
    const outerOffset = spotlightHeight; // Position line at border edge
    
    const clockwiseX = [
      -outerOffset,                        // Start: left side
      width - spotlightWidth + outerOffset, // Top edge moving right
      width - outerOffset,                 // Right edge moving down  
      spotlightWidth - outerOffset,        // Bottom edge moving left
      -outerOffset                         // Back to start
    ];
    const clockwiseY = [
      height / 2 - spotlightHeight / 2,    // Start: middle left
      -outerOffset,                        // Top edge
      spotlightHeight - outerOffset,       // Right edge moving down
      height - outerOffset,                // Bottom edge
      height / 2 - spotlightHeight / 2     // Back to middle left  
    ];
    
    // Reverse for counterclockwise
    const counterclockwiseX = [
      -outerOffset,                        // Start: left side
      spotlightWidth - outerOffset,        // Left edge moving down
      width - outerOffset,                 // Bottom edge moving right
      width - spotlightWidth + outerOffset, // Right edge moving up
      -outerOffset                         // Back to start
    ];
    const counterclockwiseY = [
      height / 2 - spotlightHeight / 2,    // Start: middle left
      height - outerOffset,                // Left edge moving down
      height - outerOffset,                // Bottom edge moving right
      -outerOffset,                        // Right edge moving up
      height / 2 - spotlightHeight / 2     // Back to middle left
    ];

    return {
      xRange: finalDirection === 'clockwise' ? clockwiseX : counterclockwiseX,
      yRange: finalDirection === 'clockwise' ? clockwiseY : counterclockwiseY,
    };
  }, [width, height, finalDirection, spotlightWidth, spotlightHeight]);

  const translateX = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: pathCoordinates.xRange,
  });

  const translateY = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: pathCoordinates.yRange,
  });

  // ═══════════════════════════════════════════════════════════════════════════════
  // LAYOUT HANDLER
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Memoize layout handler to prevent unnecessary re-renders
  const onLayout = useCallback((event: any) => {
    const { width: newWidth, height: newHeight } = event.nativeEvent.layout;
    setWidth(newWidth);
    setHeight(newHeight);
    
    if (debug) {
    }
  }, [debug]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (travelAnimationRef.current) {
        travelAnimationRef.current.stop();
        travelAnimationRef.current = null;
      }
      if (opacityAnimationRef.current) {
        opacityAnimationRef.current.stop();
        opacityAnimationRef.current = null;
      }
      progress.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <View 
      style={[style, { position: 'relative', backgroundColor: 'transparent' }]} 
      onLayout={onLayout}
    >
      {/* 🎯 THE MAGIC: Border container with clipping mask */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius,
          borderWidth: finalEffectsEnabled ? 0 : borderWidth,
          borderColor: finalEffectsEnabled ? 'transparent' : (isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.1)'),
          overflow: 'hidden', // 🔑 THIS IS THE BREAKTHROUGH - clips everything to border shape
        }}
      >
        {/* Background layer for the traveling spotlight */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'transparent',
          }}
        >
          {/* 💫 The traveling spotlight that creates the border effect */}
          {isActive && finalEffectsEnabled && width > 0 && height > 0 && (
            <Animated.View
              style={{
                position: 'absolute',
                width: spotlightWidth,
                height: spotlightHeight,
                opacity: opacityAnim,
                transform: [
                  { translateX },
                  { translateY },
                ],
              }}
            >
              <LinearGradient
                colors={(() => {
                  if (computedGradientColors && computedGradientColors.length >= 2) {
                    return computedGradientColors as [string, string, ...string[]];
                  }
                  if (selectedTheme && selectedTheme.colors && Array.isArray(selectedTheme.colors) && selectedTheme.colors.length >= 2) {
                    return selectedTheme.colors as [string, string, ...string[]];
                  }
                  // Safe fallback colors
                  return ['rgba(29, 185, 84, 0.8)', 'transparent'] as [string, string, ...string[]];
                })()}
                style={{
                  width: spotlightWidth,
                  height: spotlightHeight,
                  borderRadius: spotlightHeight / 2, // Rounded line caps
                }}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
              />
            </Animated.View>
          )}
        </View>
        
        {/* Add BlurView background to cover the full container */}
        <BlurView
          intensity={20}
          tint={theme === 'dark' ? 'dark' : 'light'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius,
            zIndex: -1, // Behind everything, including spotlight
          }}
        />
      </View>
      
      {/* 📱 Content container (your actual content sits here) */}
      <View style={{
        position: 'relative',
        zIndex: 1000, // Higher z-index to ensure content is above the border effect
        backgroundColor: 'transparent',
        flex: 1, // Take full height
        width: '100%', // Take full width
      }}>
        {children}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEMOIZED EXPORT FOR PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════

export const AnimatedGradientBorder = React.memo(AnimatedGradientBorderComponent, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.borderRadius === nextProps.borderRadius &&
    prevProps.borderWidth === nextProps.borderWidth &&
    prevProps.animationSpeed === nextProps.animationSpeed &&
    prevProps.direction === nextProps.direction &&
    prevProps.speed === nextProps.speed &&
    prevProps.variation === nextProps.variation &&
    prevProps.effectsEnabled === nextProps.effectsEnabled &&
    prevProps.brightness === nextProps.brightness &&
    prevProps.backgroundColor === nextProps.backgroundColor &&
    JSON.stringify(prevProps.gradientColors) === JSON.stringify(nextProps.gradientColors)
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

/** @deprecated Use AnimatedGradientBorder instead */
export const ShimmerBorder = AnimatedGradientBorder;

export default AnimatedGradientBorder;