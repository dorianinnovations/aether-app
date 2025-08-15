/**
 * SIMPLE Google Sign-In that actually works
 * Uses Google's recommended mobile OAuth flow
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { TokenManager } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';

WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  style?: any;
  title?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  style,
  title = 'Google',
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  // Use Expo's AuthSession - this WORKS
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: '1095625189301-0jchnagbsb983tk713fbarvv6dmr5qpm.apps.googleusercontent.com',
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'aether',
        path: 'google-auth',
      }),
    },
    AuthSession.discovery
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        handleGoogleToken(authentication.idToken);
      }
    } else if (response?.type === 'error') {
      console.error('Google auth error:', response.error);
      onError?.(response.error?.message || 'Authentication failed');
      setLoading(false);
    }
  }, [response]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      console.log('Sending ID token to server...');
      
      // Send token to your server
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Store token and user data
        await TokenManager.setToken(data.token);
        await TokenManager.setUserData(data.data.user);
        
        console.log('Google sign-in successful');
        onSuccess?.(data.data.user);
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error: any) {
      console.error('Google authentication error:', error);
      onError?.(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (disabled || loading) return;

    try {
      setLoading(true);
      console.log('Starting Google sign-in...');
      
      // This will open Google's OAuth page
      await promptAsync();
      
      // Don't set loading to false here - the useEffect will handle success/error
    } catch (error: any) {
      console.error('Failed to start Google sign-in:', error);
      onError?.(error.message || 'Failed to start authentication');
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
          borderColor: theme === 'dark' ? '#404040' : '#e1e5e9',
          opacity: disabled ? 0.6 : 1,
        },
        style,
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
              { color: theme === 'dark' ? '#ffffff' : '#000000' },
            ]}
          >
            Signing in...
          </Text>
        </View>
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons
            name="logo-google"
            size={16}
            color="#4285f4"
            style={styles.icon}
          />
          <Text
            style={[
              styles.buttonText,
              { color: theme === 'dark' ? '#ffffff' : '#000000' },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
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
});

export default GoogleSignInButton;