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
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
              borderColor: theme === 'dark' ? '#404040' : '#e1e5e9',
              borderWidth: 1,
              shadowColor: theme === 'dark' ? '#000000' : '#000000',
              shadowOffset: { width: 0, height: theme === 'dark' ? 4 : 2 },
              shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
              shadowRadius: theme === 'dark' ? 8 : 4,
              elevation: theme === 'dark' ? 4 : 2,
              opacity: (loading || success) ? 0.6 : 1,
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
                  { color: theme === 'dark' ? '#ffffff' : '#000000' }
                ]}>
                  {loadingTitle}
                </Text>
              ) : success ? (
                <Text style={[
                  styles.primaryButtonText, 
                  { color: theme === 'dark' ? '#ffffff' : '#000000' }
                ]}>
                  {successTitle}
                </Text>
              ) : (
                <Text style={[
                  styles.primaryButtonText, 
                  { color: theme === 'dark' ? '#ffffff' : '#000000' }
                ]}>
                  {title}
                </Text>
              )}
            </View>
            {authStatus !== 'idle' && (
              <View style={styles.spinnerContainer}>
                <AnimatedAuthStatus
                  status={authStatus}
                  color={theme === 'dark' ? '#ffffff' : '#000000'}
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