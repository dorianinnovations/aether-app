import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { RainbowShimmerText } from '../atoms/RainbowShimmerText';
import { AnimatedAuthStatus } from '../atoms/AnimatedAuthStatus';
import { designTokens } from '../../tokens/colors';
import { typography } from '../../tokens/typography';

interface AuthButtonProps {
  onPress: () => void;
  loading: boolean;
  success: boolean;
  theme: 'light' | 'dark';
  authStatus: 'idle' | 'loading' | 'success' | 'error';
  onAnimationComplete?: () => void;
  title?: string;
  loadingTitle?: string;
  successTitle?: string;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  onPress,
  loading,
  success,
  theme,
  authStatus,
  onAnimationComplete,
  title = 'Create Account',
  loadingTitle = 'Creating Account',
  successTitle = 'Success!',
}) => {
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const buttonGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlowAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlowAnim, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();
    return () => glowAnimation.stop();
  }, []);

  const getMinimalGlowColor = () => {
    return theme === 'dark' 
      ? 'rgba(255, 255, 255, 0.6)'
      : 'rgba(26, 26, 26, 0.08)';
  };

  const handlePress = () => {
    // Button press animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(buttonScaleAnim, {
          toValue: 0.92,
          duration: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScaleAnim, {
          toValue: 1.05,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onPress();
  };

  return (
    <View style={styles.buttonContainer}>
      <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
        <Animated.View 
          style={{ 
            opacity: buttonGlowAnim,
            shadowColor: getMinimalGlowColor(),
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 6,
            borderRadius: 12,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              opacity: (loading || success) ? 0.9 : 1,
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(220, 220, 220, 0.3)',
              borderWidth: theme === 'dark' ? 1 : 1,
              shadowColor: theme === 'dark' ? '#ffffff' : '#000000',
              shadowOffset: theme === 'dark' ? { width: 0, height: 0 } : { width: 2, height: 4 },
              shadowOpacity: theme === 'dark' ? 0.4 : 0.15,
              shadowRadius: theme === 'dark' ? 8 : 6,
              elevation: theme === 'dark' ? 6 : 4,
            }
          ]}
          onPress={handlePress}
          disabled={loading || success}
          activeOpacity={0.9}
        >
          <View style={styles.buttonContent}>
            <View style={styles.buttonTextContainer}>
              {loading ? (
                <Text style={[
                  styles.primaryButtonText, 
                  { color: theme === 'dark' ? '#2a2a2a' : '#1a1a1a' }
                ]}>
                  {loadingTitle}
                </Text>
              ) : success ? (
                <Text style={[
                  styles.primaryButtonText, 
                  { color: theme === 'dark' ? '#2a2a2a' : '#1a1a1a' }
                ]}>
                  {successTitle}
                </Text>
              ) : (
                <RainbowShimmerText
                  style={StyleSheet.flatten([styles.primaryButtonText, { color: theme === 'dark' ? '#2a2a2a' : '#1a1a1a' }])}
                  intensity="vibrant"
                  duration={4000}
                  waveWidth="wide"
                  colorMode="rainbow-cycle"
                >
                  {title}
                </RainbowShimmerText>
              )}
            </View>
            {authStatus !== 'idle' && (
              <View style={styles.spinnerContainer}>
                <AnimatedAuthStatus
                  status={authStatus}
                  color={theme === 'dark' ? '#2a2a2a' : '#1a1a1a'}
                  size={16}
                  onAnimationComplete={() => {
                    if (authStatus === 'error' && onAnimationComplete) {
                      onAnimationComplete();
                    }
                  }}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 37,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});