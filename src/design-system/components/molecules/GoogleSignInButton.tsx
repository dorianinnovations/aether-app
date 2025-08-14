/**
 * Google Sign-In Button Component
 * Elegant Google OAuth button with Aether's design system using Expo AuthSession
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
// import * as AuthSession from 'expo-auth-session';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AuthAPI } from '../../../services/apiModules/endpoints/auth';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { logger } from '../../../utils/logger';

interface GoogleSignInButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  style?: any;
  compact?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  style,
  compact = false,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Temporary: Google OAuth will be implemented once auth session is fixed
  // const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  const handleGoogleSignIn = async () => {
    if (disabled || loading) return;

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Button press animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Temporary: Show not implemented message
      setTimeout(() => {
        onError?.('Google Sign-In coming soon! Use email signup for now.');
        setLoading(false);
      }, 1000);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      logger.error('Google Sign-In error:', error);
      onError?.(error.message || 'Google Sign-In failed');
      setLoading(false);
    }
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
            borderColor: theme === 'dark' ? '#404040' : '#e1e5e9',
            shadowColor: theme === 'dark' ? '#000000' : '#000000',
            shadowOffset: { width: 0, height: theme === 'dark' ? 4 : 2 },
            shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
            shadowRadius: theme === 'dark' ? 8 : 4,
            elevation: theme === 'dark' ? 4 : 2,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={handleGoogleSignIn}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <ActivityIndicator 
              size="small" 
              color={theme === 'dark' ? '#ffffff' : '#4285f4'} 
              style={styles.icon}
            />
          ) : (
            <Ionicons
              name="logo-google"
              size={18}
              color="#4285f4"
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              compact && styles.buttonTextCompact,
              {
                color: theme === 'dark' ? '#ffffff' : '#000000',
              },
            ]}
          >
            {loading ? 'Signing in...' : compact ? 'Google' : 'Continue with Google'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  icon: {
    width: 18,
    height: 18,
  },
  buttonText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonTextCompact: {
    fontSize: 14,
  },
});

export default GoogleSignInButton;