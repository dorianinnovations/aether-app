/**
 * Google Sign-In Button Component
 * Elegant Google OAuth button with Aether's design system
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
import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
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
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

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

      // Configure Google Sign-In
      await GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // This should be in your .env
        offlineAccess: true,
      });

      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();

      // Trigger Google Sign-In
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.idToken) {
        // Send token to backend
        const response = await AuthAPI.googleAuth(userInfo.idToken);
        
        if (response.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSuccess?.(response.data?.user);
        } else {
          throw new Error(response.data?.error || 'Google authentication failed');
        }
      } else {
        throw new Error('No ID token received from Google');
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      logger.error('Google Sign-In error:', error);
      
      let errorMessage = 'Google Sign-In failed';
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'Sign-in was cancelled';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign-in is already in progress';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Google Play Services not available';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onError?.(errorMessage);
    } finally {
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
              {
                color: theme === 'dark' ? '#ffffff' : '#000000',
              },
            ]}
          >
            {loading ? 'Signing in...' : 'Continue with Google'}
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
    letterSpacing: -0.2,
  },
});