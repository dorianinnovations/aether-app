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
  Image,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { TokenManager } from '../../../services/api';
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
  title?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  style,
  compact = false,
  title = 'Google',
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Listen for the callback from the OAuth flow
    const handleUrl = async (url: string) => {
      console.log('Received deep link URL:', url);
      
      if (url.includes('google-auth')) {
        try {
          const parsedUrl = new URL(url);
          const token = parsedUrl.searchParams.get('token');
          const userStr = parsedUrl.searchParams.get('user');
          const error = parsedUrl.searchParams.get('error');

          console.log('OAuth callback params:', { token: !!token, user: !!userStr, error });

          if (error) {
            console.log('OAuth error:', error);
            onError?.(decodeURIComponent(error));
            setLoading(false);
            return;
          }

          if (token && userStr) {
            try {
              const user = JSON.parse(decodeURIComponent(userStr));
              console.log('Successfully parsed user data:', user);
              
              // Store the token
              await TokenManager.setToken(token);
              await TokenManager.setUserData(user);
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSuccess?.(user);
            } catch (err) {
              console.error('Failed to process auth data:', err);
              onError?.('Failed to process authentication');
            }
          } else {
            console.log('Missing token or user data in callback');
            onError?.('Authentication failed - missing data');
          }
        } catch (err) {
          console.error('Error parsing callback URL:', err);
          onError?.('Failed to process callback');
        }
        setLoading(false);
      }
    };

    // Listen for URL changes
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    // Also check if app was opened with a URL initially
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    return () => subscription?.remove();
  }, [onSuccess, onError]);

  // Custom Google OAuth implementation using WebBrowser
  const generateRandomString = (length: number) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  const openGoogleOAuth = async () => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    
    // Validate that we have a client ID
    if (!clientId) {
      throw new Error('Google Client ID not configured. Please check your .env file.');
    }
    
    // Use HTTPS redirect URI (required by Google's new policy)
    const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI || 'https://aether-server-j5kh.onrender.com/auth/google/callback';
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);
    
    // Debug: Log the redirect URI so you can add it to Google Console
    console.log('Google OAuth Redirect URI:', redirectUri);
    console.log('Google Client ID:', clientId);
    
    const authUrl = 
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      'response_type=id_token&' +
      'scope=openid%20profile%20email&' +
      `state=${state}&` +
      `nonce=${nonce}&` +
      'prompt=select_account';

    console.log('Full OAuth URL:', authUrl);

    const result = await WebBrowser.openAuthSessionAsync(authUrl, 'aether://google-auth');
    
    // The callback will be handled by the URL listener in useEffect
    if (result.type === 'cancel') {
      throw new Error('OAuth failed or was cancelled');
    }
    
    // For successful auth, the callback URL listener will handle the response
    return true;
  };

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

      // Open Google OAuth (callback will be handled by URL listener)
      await openGoogleOAuth();
      
      // Don't set loading to false here - the URL listener will handle that
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      logger.error('Google Sign-In error:', error);
      
      let errorMessage = 'Google Sign-In failed';
      if (error.message === 'OAuth failed or was cancelled') {
        errorMessage = 'Sign-in was cancelled';
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
        {loading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator 
              size="small" 
              color={theme === 'dark' ? '#ffffff' : '#4285f4'} 
              style={styles.icon}
            />
            <Text
              style={[
                styles.buttonText,
                {
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                },
              ]}
            >
              Signing in...
            </Text>
          </View>
        ) : (
          <View style={styles.buttonContent}>
            <Image
              source={
                theme === 'dark'
                  ? require('../../../../assets/images/google/google-g-dark.png')
                  : require('../../../../assets/images/google/google-g-light.png')
              }
              style={styles.googleIcon}
            />
            <Text
              style={[
                styles.buttonText,
                {
                  color: theme === 'dark' ? '#ffffff' : '#000000',
                },
              ]}
            >
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 37,
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
    gap: 8,
    paddingHorizontal: 4,
  },
  icon: {
    width: 16,
    height: 16,
  },
  buttonText: {
    ...typography.textStyles.bodyMedium,
    fontSize: 14,
    fontWeight: '500',
  },
  googleIcon: {
    width: 16,
    height: 16,
  },
});

export default GoogleSignInButton;