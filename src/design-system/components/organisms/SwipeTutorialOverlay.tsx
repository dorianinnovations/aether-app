/**
 * SwipeTutorialOverlay - Tutorial overlay for swipe gesture
 * Shows after successful account creation to demonstrate menu access
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { typography } from '../../tokens/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SwipeTutorialOverlayProps {
  visible: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export const SwipeTutorialOverlay: React.FC<SwipeTutorialOverlayProps> = ({
  visible,
  onClose,
  theme,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) {
      // Show overlay with animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start Lottie animation
      lottieRef.current?.play();

      // Auto-close after 4 seconds
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(autoCloseTimer);
    } else {
      // Hide overlay
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="rgba(0, 0, 0, 0.8)"
        translucent={true}
      />
      
      {/* Dark backdrop */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.backdropTouchable} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Tutorial content */}
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={styles.tutorialContainer}>
          {/* Lottie Animation */}
          <View style={styles.animationContainer}>
            <LottieView
              ref={lottieRef}
              source={require('../../../../assets/SwipeLeft.json')}
              autoPlay
              loop
              style={styles.lottieAnimation}
              colorFilters={theme === 'dark' ? [
                {
                  keypath: "*",
                  color: "#ffffff"
                }
              ] : undefined}
            />
          </View>

          {/* Tutorial text */}
          <View style={styles.textContainer}>
            <Text style={[
              styles.title,
              { color: theme === 'dark' ? '#ffffff' : '#ffffff' }
            ]}>
              Swipe to Access Menu
            </Text>
            <Text style={[
              styles.description,
              { color: theme === 'dark' ? '#cccccc' : '#e6e6e6' }
            ]}>
              Swipe left from the right edge of any screen to quickly access the menu
            </Text>
          </View>

          {/* Positioning indicator */}
          <View style={styles.edgeIndicator}>
            <View style={[
              styles.edgeLine,
              { backgroundColor: theme === 'dark' ? '#ffffff' : '#ffffff' }
            ]} />
            <Text style={[
              styles.edgeText,
              { color: theme === 'dark' ? '#cccccc' : '#e6e6e6' }
            ]}>
              Swipe from here
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  backdropTouchable: {
    flex: 1,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  tutorialContainer: {
    alignItems: 'center',
    maxWidth: 320,
  },
  animationContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...typography.textStyles.bodyMedium,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    ...typography.textStyles.bodySmall,
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16,
  },
  edgeIndicator: {
    position: 'absolute',
    right: -SCREEN_WIDTH * 0.1,
    top: '50%',
    alignItems: 'center',
    transform: [{ translateY: -20 }],
  },
  edgeLine: {
    width: 3,
    height: 60,
    borderRadius: 2,
    marginBottom: 8,
    opacity: 0.8,
  },
  edgeText: {
    ...typography.textStyles.bodySmall,
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    transform: [{ rotate: '90deg' }],
  },
});

export default SwipeTutorialOverlay;