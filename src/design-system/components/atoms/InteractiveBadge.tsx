/**
 * Interactive Badge Component - Advanced interaction system
 * Features: Haptic feedback, gesture recognition, sound effects, magnetic interactions
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  PanGestureHandler, 
  TapGestureHandler,
  LongPressGestureHandler,
  State as GestureState,
  GestureHandlerRootView
} from 'react-native-gesture-handler';
import { 
  View,
  Animated,
  ViewStyle, 
  Dimensions, 
  Vibration,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { AdvancedBadge, BadgeType, BadgeStyle, BadgeAnimation } from './AdvancedBadge';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface InteractiveBadgeProps {
  type: BadgeType;
  style?: BadgeStyle;
  animation?: BadgeAnimation;
  visible?: boolean;
  enableHaptics?: boolean;
  enableSounds?: boolean;
  enableMagnetism?: boolean;
  enableGestures?: boolean;
  magneticRadius?: number;
  dragEnabled?: boolean;
  theme?: 'light' | 'dark';
  onPress?: () => void;
  onLongPress?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  containerStyle?: ViewStyle;
}

// Sound effects configuration (placeholder - would need actual sound files)
const soundEffects = {
  tap: null, // require('../../../../assets/sounds/badge-tap.mp3'),
  hover: null, // require('../../../../assets/sounds/badge-hover.mp3'),
  drag: null, // require('../../../../assets/sounds/badge-drag.mp3'),
  magnetic: null, // require('../../../../assets/sounds/badge-magnetic.mp3'),
};

// Haptic feedback patterns
const hapticPatterns = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

export const InteractiveBadge: React.FC<InteractiveBadgeProps> = ({
  type,
  style,
  animation,
  visible = true,
  enableHaptics = false,
  enableSounds = false,
  enableMagnetism = false,
  enableGestures = false,
  magneticRadius = 50,
  dragEnabled = false,
  theme = 'light',
  onPress,
  onLongPress,
  onDragStart,
  onDragEnd,
  containerStyle,
}) => {
  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const magneticField = useRef(new Animated.Value(0)).current;
  const glowIntensity = useRef(new Animated.Value(1)).current;

  // Gesture states
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [magneticTarget, setMagneticTarget] = useState<{ x: number; y: number } | null>(null);
  
  // Sound system (placeholder)
  const [sounds, setSounds] = useState<{ [key: string]: any }>({});

  // Initialize sound effects (disabled for now - would need actual sound files)
  useEffect(() => {
    if (!enableSounds) return;

    const loadSounds = async () => {
      // Sound loading would go here when assets are available
      };

    loadSounds();

    return () => {
      Object.values(sounds).forEach(sound => {
        if (sound && sound.unloadAsync) {
          sound.unloadAsync();
        }
      });
    };
  }, [enableSounds]);

  // Haptic feedback helper
  const triggerHaptic = async (pattern: keyof typeof hapticPatterns) => {
    if (!enableHaptics) return;

    try {
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(hapticPatterns[pattern] as Haptics.ImpactFeedbackStyle);
      } else {
        Vibration.vibrate(50);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  };

  // Play sound effect (placeholder - would need actual sound files)
  const playSound = async (soundKey: keyof typeof soundEffects) => {
    if (!enableSounds) return;
    // Sound playback would go here when assets are available
  };

  // Magnetic field animation
  const animateMagneticField = (intensity: number) => {
    Animated.spring(magneticField, {
      toValue: intensity,
      tension: 300,
      friction: 10,
      useNativeDriver: false,
    }).start();
  };

  // Glow intensity animation
  const animateGlow = (intensity: number) => {
    Animated.timing(glowIntensity, {
      toValue: intensity,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Calculate magnetic attraction
  const calculateMagneticForce = (x: number, y: number, targetX: number, targetY: number) => {
    const distance = Math.sqrt(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2));
    
    if (distance > magneticRadius) return { x: 0, y: 0, strength: 0 };
    
    const strength = Math.max(0, 1 - (distance / magneticRadius));
    const angle = Math.atan2(targetY - y, targetX - x);
    
    return {
      x: Math.cos(angle) * strength * 20,
      y: Math.sin(angle) * strength * 20,
      strength,
    };
  };

  // Gesture Handlers
  const handleTap = async () => {
    await triggerHaptic('light');
    await playSound('tap');
    
    // No animations - badges should never move

    onPress?.();
  };

  const handleLongPress = async () => {
    await triggerHaptic('heavy');
    await playSound('hover');
    
    // No rotation animation - badges should never move

    onLongPress?.();
  };

  const handlePanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: false }
  );

  const handlePanStateChange = async (event: any) => {
    const { state, translationX, translationY, x, y } = event.nativeEvent;

    switch (state) {
      case GestureState.BEGAN:
        setIsDragging(true);
        await triggerHaptic('medium');
        await playSound('drag');
        
        // No drag animation - badges should never move
        onDragStart?.();
        break;

      case GestureState.ACTIVE:
        if (enableMagnetism) {
          // Check for magnetic targets (you can extend this to include other badges or UI elements)
          const magneticForce = calculateMagneticForce(
            x, y,
            screenWidth / 2, screenHeight / 2 // Example: center of screen as magnetic target
          );

          if (magneticForce.strength > 0.7) {
            animateMagneticField(magneticForce.strength);
            await triggerHaptic('light');
            await playSound('magnetic');
          }
        }
        break;

      case GestureState.END:
      case GestureState.CANCELLED:
        setIsDragging(false);
        
        // No snap back animation - badges should never move
        onDragEnd?.();
        break;
    }
  };

  if (!visible) return null;

  const badgeTransform = [
    { translateX },
    { translateY },
    { scale },
    { 
      rotate: rotation.interpolate({
        inputRange: [0, 360],
        outputRange: ['0deg', '360deg'],
      })
    },
  ];

  const magneticFieldStyle = {
    opacity: magneticField.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.3],
    }),
    transform: [
      {
        scale: magneticField.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.5],
        }),
      },
    ],
  };

  return (
    <GestureHandlerRootView style={[containerStyle]}>
      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        {/* Magnetic Field Visualization */}
        {enableMagnetism && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: magneticRadius * 2,
                height: magneticRadius * 2,
                borderRadius: magneticRadius,
                borderWidth: 2,
                borderColor: type === 'founder' ? '#EF4444' : '#8B5CF6',
                backgroundColor: 'transparent',
              },
              magneticFieldStyle,
            ]}
          />
        )}

        {/* Interactive Badge */}
        <PanGestureHandler
          enabled={enableGestures && dragEnabled}
          onGestureEvent={handlePanGestureEvent}
          onHandlerStateChange={handlePanStateChange}
        >
          <Animated.View style={{ transform: badgeTransform }}>
            <LongPressGestureHandler
              enabled={enableGestures}
              onHandlerStateChange={(event) => {
                if (event.nativeEvent.state === GestureState.ACTIVE) {
                  handleLongPress();
                }
              }}
              minDurationMs={500}
            >
              <Animated.View>
                <TapGestureHandler
                  enabled={enableGestures}
                  onHandlerStateChange={(event) => {
                    if (event.nativeEvent.state === GestureState.END) {
                      handleTap();
                    }
                  }}
                >
                  <Animated.View>
                    <AdvancedBadge
                      type={type}
                      style={style}
                      animation={animation}
                      theme={theme}
                      intensity={isDragging ? 'intense' : 'normal'}
                      interactive={false} // We handle interactions here
                      showTooltip={!isDragging}
                    />
                  </Animated.View>
                </TapGestureHandler>
              </Animated.View>
            </LongPressGestureHandler>
          </Animated.View>
        </PanGestureHandler>

        {/* Drag Trail Effect */}
        {isDragging && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: type === 'founder' ? '#EF4444' : '#8B5CF6',
                opacity: 0.3,
                transform: [
                  {
                    translateX: translateX.interpolate({
                      inputRange: [-100, 0, 100],
                      outputRange: [-50, 0, 50],
                    }),
                  },
                  {
                    translateY: translateY.interpolate({
                      inputRange: [-100, 0, 100],
                      outputRange: [-50, 0, 50],
                    }),
                  },
                ],
              },
            ]}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
};

export default InteractiveBadge;