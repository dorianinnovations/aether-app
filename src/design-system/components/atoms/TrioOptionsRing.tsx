/**
 * TrioOptionsRing - Circular ring with three smart prompt options
 * Minimal and impactful design inspired by navigation rings
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { designTokens } from '../../tokens/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TrioOption {
  id: string;
  text: string;
  type: 'background' | 'tracks' | 'personal';
}

interface TrioOptionsRingProps {
  visible: boolean;
  onClose: () => void;
  onOptionSelect: (option: TrioOption) => void;
  options: TrioOption[];
  theme: 'light' | 'dark';
}

const TrioOptionsRing: React.FC<TrioOptionsRingProps> = ({
  visible,
  onClose,
  onOptionSelect,
  options = [],
  theme,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const labelsAnim = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef([new Animated.Value(1), new Animated.Value(1), new Animated.Value(1)]).current;
  const ringProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Simple, fast entrance - everything appears together
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        // Professional sequential dot animations - smooth and refined
        Animated.stagger(80, dotsAnim.map(anim => 
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic), // Smoother, more premium curve
          })
        )),
        // Professional label animations with refined timing
        Animated.stagger(60, labelsAnim.map((anim, index) => 
          Animated.timing(anim, {
            toValue: 1,
            duration: 250,
            delay: 150 + (index * 40), // Tighter, more controlled timing
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic), // Consistent premium curve
          })
        )),
      ]).start();
      
      // Ring loading animation - circular progress
      Animated.timing(ringProgressAnim, {
        toValue: 1,
        duration: 800, // 0.8 seconds for nice loading feel
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start(() => {
        // Start shimmer after ring is complete
        Animated.loop(
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.cubic),
          })
        ).start();
      });
    } else {
      // Quick fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Reset other animations
      ringAnim.setValue(0);
      dotsAnim.forEach(anim => anim.setValue(0));
      labelsAnim.forEach(anim => anim.setValue(0));
      shimmerAnim.setValue(0);
      pressAnim.forEach(anim => anim.setValue(1));
      ringProgressAnim.setValue(0);
    }
  }, [visible]);

  const handleOptionPress = (option: TrioOption, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Professional press animation - subtle and refined
    Animated.sequence([
      Animated.timing(pressAnim[index], {
        toValue: 0.92, // More subtle scale down
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(pressAnim[index], {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
    
    setTimeout(() => {
      onOptionSelect(option);
      onClose();
    }, 150);
  };

  // Clean circular ring - simple and elegant
  const ringRadiusX = 200;
  const ringRadiusY = 180; // Perfect circle
  const ringCenter = { x: screenWidth / 2, y: screenHeight - -50 }; // Lower
  
  // Position dots in rainbow arc - bring them closer to center
  const dotPositions = options.length === 3 ? [
    { angle: -Math.PI * 0.7, label: 'left' }, // Left side, on screen
    { angle: -Math.PI / 2, label: 'top' }, // Top center
    { angle: -Math.PI * 0.3, label: 'right' }, // Right side, on screen
  ] : options.map((_, index) => ({
    angle: -Math.PI * 0.7 + (index * Math.PI * 0.9) / (options.length - 1), // Narrower arc to keep on screen
    label: `option-${index}`,
  }));

  const getDotPosition = (angle: number) => ({
    x: ringCenter.x + ringRadiusX * Math.cos(angle),
    y: ringCenter.y - ringRadiusY * Math.sin(angle), // Subtract for upward arc
  });

  const getLabelPosition = (angle: number, labelWidth: number = 100) => {
    const extendedRadius = ringRadiusX + 50; // Push labels even further out for better visibility
    return {
      x: ringCenter.x + extendedRadius * Math.cos(angle) - labelWidth / 2,
      y: ringCenter.y - extendedRadius * Math.sin(angle) - 15, // Adjust for text height
    };
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        

        <Animated.View
          style={[
            styles.ringContainer,
            {
              position: 'absolute',
              left: ringCenter.x - ringRadiusX,
              top: ringCenter.y - ringRadiusY,
              width: ringRadiusX * 2,
              height: ringRadiusY * 2,
              transform: [
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {/* Clean Neumorphic Ring */}
          <Animated.View
            style={[
              styles.neumorphicRing,
              {
                width: ringRadiusX * 2,
                height: ringRadiusY * 2,
                borderRadius: ringRadiusX,
                backgroundColor: theme === 'dark' ? '#131313ff' : '#f0f0f0',
                opacity: ringAnim,
                // Enhanced neumorphic borders
                borderWidth: 3,
                borderTopColor: theme === 'dark' ? '#404040' : '#ffffff',
                borderLeftColor: theme === 'dark' ? '#404040' : '#ffffff', 
                borderRightColor: theme === 'dark' ? '#353535ff' : '#d1d9e6',
                borderBottomColor: theme === 'dark' ? '#1a1a1a' : '#d1d9e6',
                // Dark shadow (bottom-right)
                shadowColor: theme === 'dark' ? '#000000' : '#d1d9e6',
                shadowOffset: { width: 8, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 14,
              },
            ]}
          />
          
          {/* Light highlight overlay */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: ringCenter.x - ringRadiusX,
                top: ringCenter.y - ringRadiusY,
                width: ringRadiusX * 2,
                height: ringRadiusY * 2,
                borderRadius: ringRadiusX,
                // No transform needed for highlight
                backgroundColor: 'transparent',
                opacity: ringAnim,
                // Light shadow (top-left)
                shadowColor: theme === 'dark' ? '#404040' : '#ffffff',
                shadowOffset: { width: -8, height: -8 },
                shadowOpacity: theme === 'dark' ? 0.3 : 0.8,
                shadowRadius: 16,
              },
              styles.neumorphicRing,
            ]}
          />
          

          {/* Dots and Labels */}
          {options.slice(0, 3).map((option, index) => {
            const position = dotPositions[index];
            const dotPos = getDotPosition(position.angle);
            const labelPos = getLabelPosition(position.angle);
            
            // Enhanced color coding with gradients
            const dotColors: [string, string, ...string[]] = option.type === 'background' 
              ? ['#FF6B6B', '#FF4757', '#FF3742'] // Red gradient
              : option.type === 'tracks'
              ? ['#54A0FF', '#2ED573', '#26D0CE'] // Blue-green gradient  
              : ['#FFB8B8', '#FFA502', '#FF6348']; // Orange gradient
              
            const dotColor = dotColors[1]; // Main color for solid elements

            return (
              <React.Fragment key={option.id}>
                {/* Gradient Dot with Shimmer */}
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      left: ringRadiusX + (ringRadiusX - 1.5) * Math.cos(position.angle) - 4,
                      top: ringRadiusY + (ringRadiusY - 1.5) * Math.sin(position.angle) - 4,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      overflow: 'hidden',
                      opacity: dotsAnim[index],
                      transform: [
                        {
                          scale: dotsAnim[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.7, 1], // Subtle entrance without overshoot
                          }),
                        },
                        {
                          scale: pressAnim[index],
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={dotColors}
                    style={styles.dotGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  
                  {/* Subtle shine overlay */}
                  <Animated.View
                    style={[
                      styles.dotShine,
                      {
                        opacity: shimmerAnim.interpolate({
                          inputRange: [0, 0.4, 0.6, 1],
                          outputRange: [0, 0, 0.3, 0], // More subtle opacity
                        }),
                        transform: [
                          {
                            translateX: shimmerAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-15, 15],
                            }),
                          },
                          {
                            rotate: '45deg',
                          },
                        ],
                      },
                    ]}
                  />
                </Animated.View>

                {/* Label - positioned relative to ring container */}
                <Animated.View
                  style={[
                    styles.labelContainer,
                    {
                      position: 'absolute',
                      left: ringRadiusX + (ringRadiusX + 20) * Math.cos(position.angle) - 50,
                      top: ringRadiusY + (ringRadiusY + 20) * Math.sin(position.angle) - 20,
                      opacity: labelsAnim[index],
                      transform: [
                        {
                          translateY: labelsAnim[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 0], // Reduced translation for refinement
                          }),
                        },
                        {
                          scale: labelsAnim[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1], // Very subtle scale for premium feel
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleOptionPress(option, index)}
                    activeOpacity={0.8}
                    style={[
                      styles.labelButton,
                      {
                        borderColor: dotColor,
                        shadowColor: dotColor,
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 4,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={theme === 'dark' 
                        ? ['#2a2a2a', '#1f1f1f'] 
                        : ['#ffffff', '#f8f8f8']}
                      style={styles.labelGradient}
                    >
                        <Text
                          style={[
                            styles.labelText,
                            {
                              color: theme === 'dark' 
                                ? designTokens.text.primaryDark 
                                : designTokens.text.primary,
                            },
                          ]}
                        >
                          {option.text}
                        </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </React.Fragment>
            );
          })}

        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // More visible overlay for testing
  },
  spotlightBlur: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  ringContainer: {
    position: 'relative',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPath: {
    position: 'absolute',
    borderWidth: 16,
    borderStyle: 'solid',
    // Show arc from top-left to top-right (covering our dot range)
    borderTopWidth: 16,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  fullRingPath: {
    position: 'absolute',
    borderWidth: 40,
    borderStyle: 'solid',
  },
  neumorphicRing: {
    position: 'absolute',
    borderWidth: 25,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'solid',
  },
  neumorphicInner: {
    position: 'absolute',
    borderWidth: 40,
    borderColor: 'transparent',
    borderStyle: 'solid',
    top: 0,
    left: 0,
  },
  dotGradient: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dotShine: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 1,
    left: 3,
    top: 0,
  },
  labelContainer: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelButton: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  labelGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  centerIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  centerText: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
});

export default TrioOptionsRing;