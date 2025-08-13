/**
 * SpotifyLinkPrompt Component
 * Displays "Link Spotify?" banner with link icon when user hasn't connected their account
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SpotifyLinkPromptProps {
  theme: 'light' | 'dark';
  onPress?: () => void;
}

export const SpotifyLinkPrompt: React.FC<SpotifyLinkPromptProps> = ({ 
  theme,
  onPress 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { TokenManager } = await import('../../../services/apiModules/utils/storage');
        const token = await TokenManager.getToken();
        setIsAuthenticated(!!token);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handlePress = async () => {
    if (isAuthenticated === false) {
      Alert.alert(
        'Login Required',
        'Please log in to your account first before connecting Spotify.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        {
          backgroundColor: theme === 'dark' 
            ? 'rgba(30, 215, 96, 0.08)' 
            : 'rgba(30, 215, 96, 0.06)',
          borderColor: theme === 'dark'
            ? 'rgba(30, 215, 96, 0.15)'
            : 'rgba(30, 215, 96, 0.12)',
          opacity: isAuthenticated === false ? 0.6 : 1.0,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <Ionicons 
          name="link" 
          size={12} 
          color={theme === 'dark' ? '#1ED760' : '#1DB954'} 
          style={styles.icon}
        />
        <Text 
          style={[
            styles.text,
            {
              color: theme === 'dark' 
                ? '#B0B0B0' 
                : '#6B6B6B',
            }
          ]}
          numberOfLines={1}
        >
          Link Spotify?
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0.5,
    justifyContent: 'center',
    alignSelf: 'center',
    maxWidth: '90%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    letterSpacing: -0.1,
    flexShrink: 1,
  },
});