/**
 * Aether - Onboarding Screen
 * Minimal swipe-based onboarding with opacity transitions and staggered animations
 * Introduces users to AI personalization and behavioral middleware concepts
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { PanGestureHandler, State, PanGestureHandlerGestureEvent, PanGestureHandlerStateChangeEvent } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import { RainbowShimmerText } from '../../design-system/components/atoms';
import { designTokens, getThemeColors } from '../../design-system/tokens/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { typography } from '../../design-system/tokens/typography';

const { width, height } = Dimensions.get('window');

const getStepColor = (stepIndex: number, theme: 'light' | 'dark'): string => {
  const lightColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
  const darkColors = ['#FF8A80', '#64FFDA', '#40C4FF', '#A7FFEB'];
  
  const colors = theme === 'dark' ? darkColors : lightColors;
  return colors[stepIndex] || colors[0];
};

interface OnboardingScreenProps {
  navigation: any;
  route: any;
}

interface OnboardingStep {
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  category: 'FOUNDATION' | 'CONNECTION' | 'EXPERIENCE' | 'FRIENDS';
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: "LISTEN TO MUSIC WITH AI",
    subtitle: "Get the full story behind every song, right as it plays",
    description: "Connect Spotify and AetheR becomes your music companion who knows everything about what's playing. Deep dive into lyrics, discover hidden samples, learn about the artist's journey, or just vibe together—all in real-time. No need to say what song you're on, AetheR already knows and is ready to chat about whatever catches your ear.",
    accent: "VIBES",
    category: "FOUNDATION"
  },
  {
    title: "FIND YOUR SOUND",
    subtitle: "Music discovery that speaks your language",
    description: "Tell AetheR what you're feeling—get back exactly what you need. From 'rainy day vibes' to 'songs like this but harder,' AetheR gets it. Save straight to Spotify, keep exploring, build your perfect soundtrack.",
    accent: "DISCOVERY",
    category: "CONNECTION"
  },
  {
    title: "DIAL IN YOUR PERFECT SOUND",
    subtitle: "Fine-tune discovery in real-time",
    description: "Swipe through tracks while tweaking your settings live. Too mainstream? Slide it underground. Need more energy? Crank it up. Adjust era, mood, obscurity, genre blend—watch your recommendations transform instantly. Every swipe teaches AetheR, every dial makes it yours.",
    accent: "CONTROL",
    category: "EXPERIENCE"
  },
  {
    title: "BUILD YOUR MUSIC PROFILE",
    subtitle: "Your taste, visualized",
    description: "Customize themes, colors, and layouts. Display top tracks, current rotation, and listening stats. Premium unlocks animated backgrounds, exclusive badges, and unlimited updates. Make your profile uniquely yours.",
    accent: "PROFILE",
    category: "FRIENDS"
  },
  {
    title: "CONNECT WITH FRIENDS",
    subtitle: "Share music, discover together",
    description: "See what friends are playing now. Share discoveries, exchange playlists, discuss new releases. Message about concerts, create group sessions, explore together. Music is social—your platform should be too.",
    accent: "SOCIAL",
    category: "FRIENDS"
  }
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation, route: _route }) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  
  // Animation refs
  const translateX = useRef(new Animated.Value(0)).current;
  const stepOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const descriptionOpacity = useRef(new Animated.Value(0)).current;
  const borderOpacity = useRef(new Animated.Value(0)).current;
  const progressOpacity = useRef(new Animated.Value(0)).current;
  const swipeHintOpacity = useRef(new Animated.Value(0)).current;
  const readyTextOpacity = useRef(new Animated.Value(0)).current;
  
  const panRef = useRef<PanGestureHandler>(null);

  useEffect(() => {
    animateStepIn();
    
    if (currentStep === 0) {
      // Show swipe hint on first step
      setShowSwipeHint(true);
      swipeHintOpacity.setValue(1);
    } else {
      // Fade out hint when leaving first step
      Animated.timing(swipeHintOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowSwipeHint(false);
      });
    }
    
    // Show "Ready to continue?" text on step 5 with delay and pulse
    if (currentStep === 4) { // Step 5 is index 4
      setTimeout(() => {
        // Start slow pulsing animation
        readyTextOpacity.setValue(0.25); // Set initial value
        Animated.loop(
          Animated.sequence([
            Animated.timing(readyTextOpacity, {
              toValue: 0.6,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(readyTextOpacity, {
              toValue: 0.25,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
          { iterations: -1 } // Infinite loop
        ).start();
      }, 1500); // 1.5 second delay
    } else {
      readyTextOpacity.setValue(0);
    }
  }, [currentStep]);

  const animateStepIn = () => {
    // Reset all animations
    stepOpacity.setValue(0);
    titleOpacity.setValue(0);
    subtitleOpacity.setValue(0);
    descriptionOpacity.setValue(0);
    borderOpacity.setValue(0);
    progressOpacity.setValue(0);

    // Advanced staggered sequence with precision timing
    const staggerDelay = 40;
    
    Animated.stagger(staggerDelay, [
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(borderOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(titleOpacity, {
        toValue: 1,
        tension: 300,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(descriptionOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateStepOut = (direction: 'left' | 'right', callback: () => void) => {
    setIsAnimating(true);
    
    const targetX = direction === 'left' ? -width : width;
    
    // Just slide the current card out
    Animated.timing(translateX, {
      toValue: targetX,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // Set up for next card to slide in from opposite side
      translateX.setValue(direction === 'left' ? width : -width);
      callback();
      
      // Animate new card in from opposite side
      Animated.timing(translateX, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
      });
    });
  };

  const handleNextStep = () => {
    if (isAnimating) return;
    
    // Progressive haptic intensity based on step
    const hapticIntensities = [
      Haptics.ImpactFeedbackStyle.Light,
      Haptics.ImpactFeedbackStyle.Medium, 
      Haptics.ImpactFeedbackStyle.Heavy,
      Haptics.ImpactFeedbackStyle.Heavy
    ];
    
    Haptics.impactAsync(hapticIntensities[currentStep]);
    
    if (currentStep < onboardingSteps.length - 1) {
      animateStepOut('left', () => {
        setCurrentStep(currentStep + 1);
      });
    } else {
      // Final step - smooth transition to signup
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Smooth slide out to the left
      setIsAnimating(true);
      Animated.timing(translateX, {
        toValue: -width,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('SignUp');
      });
    }
  };

  const handlePrevStep = () => {
    if (isAnimating || currentStep === 0) return;
    
    // Subtle reverse haptic
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    animateStepOut('right', () => {
      setCurrentStep(currentStep - 1);
    });
  };

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (isAnimating) return;
    
    const { translationX } = event.nativeEvent;
    translateX.setValue(translationX * 0.3); // Dampened movement
  };

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state === State.BEGAN) {
      // Subtle gesture start haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      // Reset position with enhanced spring
      Animated.spring(translateX, {
        toValue: 0,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }).start();

      // Refined swipe thresholds for premium feel
      const swipeThreshold = width * 0.2;
      const velocityThreshold = 800;
      
      if (Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > velocityThreshold) {
        // Gesture completion haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        if (translationX > 0 || velocityX > 0) {
          // Swipe right - previous step
          handlePrevStep();
        } else {
          // Swipe left - next step
          handleNextStep();
        }
      } else {
        // Failed gesture - subtle warning haptic
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <PageBackground theme={theme} variant="onboarding">
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent={true}
        />

        {/* Dark mode overlay effect */}
        {theme === "dark" && (
          <View
            style={[styles.darkModeOverlay, { backgroundColor: "#0a0a0a" }]}
            pointerEvents="none"
          ></View>
        )}

        <PanGestureHandler
          ref={panRef}
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-20, 20]}
          failOffsetY={[-40, 40]}
        >
          <Animated.View style={styles.gestureContainer}>

            {/* Advanced Content Framework */}
            <Animated.View
              style={[
                styles.contentFrame,
                {
                  opacity: stepOpacity,
                  transform: [{ translateX }],
                },
              ]}
            >
              {/* Futuristic Border Container */}
              <Animated.View 
                style={[
                  styles.borderContainer,
                  { 
                    opacity: borderOpacity,
                    backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FAFAFA',
                    borderColor: theme === 'dark' ? '#333333' : '#e5e7eb',
                    // Neumorphic bottom-right shadow
                    shadowColor: theme === 'dark' ? '#000000' : '#000000',
                    shadowOffset: { width: 3, height: 6 },
                    shadowOpacity: theme === 'dark' ? 0.4 : 0.25,
                    shadowRadius: 10,
                    elevation: 6,
                  }
                ]}
              >

                {/* Main Title */}
                <Animated.View style={[styles.titleSection, { opacity: titleOpacity }]}>
                  <RainbowShimmerText
                    style={[
                      styles.titleText,
                      { 
                        color: theme === 'dark' ? '#FFFFFF' : '#333333',
                      }
                    ] as any}
                    intensity="normal"
                    duration={3000}
                    delay={1200}
                    waveWidth="normal"
                  >
                    {currentStepData.title}
                  </RainbowShimmerText>
                </Animated.View>

                {/* Subtitle */}
                <Animated.View style={[styles.subtitleSection, { opacity: subtitleOpacity }]}>
                  <Text
                    style={[
                      styles.subtitleText,
                      { 
                        color: theme === 'dark' ? '#999999' : '#666666',
                      }
                    ]}
                  >
                    {currentStepData.subtitle}
                  </Text>
                </Animated.View>

                {/* Technical Description */}
                <Animated.View style={[styles.descriptionSection, { opacity: descriptionOpacity }]}>
                  <Text
                    style={[
                      styles.descriptionText,
                      { 
                        color: theme === 'dark' ? '#cccccc' : '#4a4a4a',
                      }
                    ]}
                  >
                    {currentStepData.description}
                  </Text>
                </Animated.View>


              </Animated.View>
            </Animated.View>

            {/* Navigation Hint - Fades out after first step */}
            {showSwipeHint && (
              <Animated.View style={[styles.navigationHint, { opacity: swipeHintOpacity }]}>
                <LottieView
                  source={require('../../../assets/SwipeLeft.json')}
                  autoPlay
                  loop
                  style={[styles.swipeLottie, { opacity: 0.2 }]}
                  resizeMode="contain"
                />
              </Animated.View>
            )}

            {/* Tiny Progress Dots at Bottom */}
            <View style={styles.bottomProgressContainer}>
              <View style={styles.bottomProgressTrack}>
                {onboardingSteps.map((step, index) => (
                  <View key={index} style={styles.bottomProgressSegment}>
                    <View
                      style={[
                        styles.bottomProgressNode,
                        {
                          backgroundColor: index === currentStep 
                            ? (theme === 'dark' ? '#FFFFFF' : '#333333')
                            : (theme === 'dark' ? '#333333' : '#e5e7eb'),
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
              
              {/* Ready to continue text - only on step 5 */}
              {currentStep === 4 && (
                <Animated.View style={[styles.readyTextContainer, { opacity: readyTextOpacity }]}>
                  <Text style={[
                    styles.readyText,
                    { color: theme === 'dark' ? '#CCCCCC' : '#666666' }
                  ]}>
                    Ready to continue?
                  </Text>
                </Animated.View>
              )}
            </View>

          </Animated.View>
        </PanGestureHandler>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkModeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  gestureContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  
  // Advanced Progress System
  progressContainer: {
    alignItems: 'center',
    gap: 16,
    marginTop: 60,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressSegment: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressConnector: {
    width: 24,
    height: 1,
    marginHorizontal: 4,
  },
  progressLabel: {
    ...typography.textStyles.bodyMedium,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 1.2,
    fontFamily: 'monospace',
  },
  
  // Futuristic Content Framework
  contentFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  borderContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 32,
    gap: 24,
  },
  
  // Category System
  categoryHeader: {
    alignItems: 'flex-start',
  },
  categoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    fontFamily: 'monospace',
  },
  categoryDivider: {
    height: 1,
    flex: 1,
  },
  
  // Typography Hierarchy
  titleSection: {
    alignItems: 'flex-start',
    width: '100%',
  },
  titleText: {
    ...typography.textStyles.displayMedium,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'left',
    letterSpacing: -0.8,
    lineHeight: 28,
    fontFamily: 'System',
    fontVariant: ['small-caps'],
  },
  subtitleSection: {
    alignItems: 'flex-start',
    width: '100%',
  },
  subtitleText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
    letterSpacing: -0.2,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  descriptionSection: {
    alignItems: 'flex-start',
    width: '100%',
  },
  descriptionText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'left',
    lineHeight: 24,
    letterSpacing: -0.1,
    fontFamily: 'System',
  },
  
  // Accent Footer
  accentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  accentLine: {
    height: 1,
    flex: 1,
  },
  accentText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    fontFamily: 'monospace',
  },
  
  // Navigation System
  navigationHint: {
    position: 'absolute',
    bottom: 250, // Raised a bit more
    right: 24,
    zIndex: 10,
  },
  swipeLottie: {
    width: 100,
    height: 100,
  },
  
  // Bottom Progress Indicator
  bottomProgressContainer: {
    alignItems: 'center',
    paddingBottom: 20,
    marginTop: -40,
  },
  bottomProgressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomProgressSegment: {
    alignItems: 'center',
  },
  bottomProgressNode: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  readyTextContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  readyText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    letterSpacing: 0.2,
    fontStyle: 'italic',
  },
});

export default OnboardingScreen;