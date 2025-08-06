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
      ? 'rgba(173, 213, 250, 0.15)'
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
              backgroundColor: theme === 'dark' ? '#0d0d0d' : designTokens.brand.primary,
              opacity: (loading || success) ? 0.9 : 1,
              borderColor: theme === 'dark' ? '#262626' : 'transparent',
              borderWidth: theme === 'dark' ? 1 : 0,
              shadowColor: '#ffffff',
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: theme === 'dark' ? 0.15 : 0.1,
              shadowRadius: 4,
              elevation: theme === 'dark' ? 3 : 2,
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
                  { color: theme === 'dark' ? '#ffffff' : '#1a1a1a' }
                ]}>
                  {loadingTitle}
                </Text>
              ) : success ? (
                <Text style={[
                  styles.primaryButtonText, 
                  { color: theme === 'dark' ? '#ffffff' : '#1a1a1a' }
                ]}>
                  {successTitle}
                </Text>
              ) : (
                <RainbowShimmerText
                  style={StyleSheet.flatten([styles.primaryButtonText, { color: theme === 'dark' ? '#ffffff' : '#1a1a1a' }])}
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
                  color={theme === 'dark' ? '#ffffff' : '#1a1a1a'}
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