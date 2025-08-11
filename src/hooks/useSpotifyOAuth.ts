/**
 * Spotify OAuth Hook
 * Handles Spotify authentication and connection management
 */

import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SpotifyAPI } from '../services/api';
import { logger } from '../utils/logger';
import type { SpotifyData } from '../types/social';

export const useSpotifyOAuth = () => {
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');

  const connectToSpotify = useCallback(async () => {
    if (connecting) return;
    
    setConnecting(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      logger.debug('Initiating Spotify connection...');
      
      // Get the authorization URL from your backend
      const authResponse = await SpotifyAPI.getAuthUrl();
      
      if (authResponse.success && authResponse.data?.authUrl) {
        setAuthUrl(authResponse.data.authUrl);
        setShowWebView(true);
      } else {
        throw new Error('Failed to get Spotify authorization URL');
      }
    } catch (error) {
      logger.error('Spotify connection error:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect to Spotify. Please try again.',
        [{ text: 'OK' }]
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setConnecting(false);
    }
  }, [connecting]);

  const disconnectFromSpotify = useCallback(async () => {
    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const response = await SpotifyAPI.disconnect();
      
      if (response.success) {
        setSpotifyStatus(null);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Failed to disconnect from Spotify');
      }
    } catch (error) {
      logger.error('Spotify disconnect error:', error);
      Alert.alert(
        'Disconnect Error',
        'Unable to disconnect from Spotify. Please try again.',
        [{ text: 'OK' }]
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSpotifyData = useCallback(async () => {
    if (!spotifyStatus?.connected) return;

    setRefreshing(true);
    try {
      const response = await SpotifyAPI.getCurrentTrack();
      
      if (response.success && response.data) {
        setSpotifyStatus(prevStatus => ({
          ...prevStatus!,
          currentTrack: response.data.currentTrack || null,
        }));
      }
    } catch (error) {
      logger.error('Spotify refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [spotifyStatus]);

  const handleWebViewNavigation = useCallback((navState: any) => {
    const url = navState.url;
    
    // Check if this is the callback URL with authorization code
    if (url.includes('callback') && url.includes('code=')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const code = urlParams.get('code');
      
      if (code) {
        setShowWebView(false);
        handleSpotifyCallback(code);
      }
    }
    
    // Handle errors
    if (url.includes('error=')) {
      setShowWebView(false);
      Alert.alert(
        'Authentication Error',
        'Spotify authentication was cancelled or failed.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  const handleSpotifyCallback = useCallback(async (code: string) => {
    setConnecting(true);
    
    try {
      logger.debug('Processing Spotify callback with code:', code);
      
      const response = await SpotifyAPI.handleCallback(code);
      
      if (response.success && response.data) {
        setSpotifyStatus(response.data);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Failed to complete Spotify authentication');
      }
    } catch (error) {
      logger.error('Spotify callback error:', error);
      Alert.alert(
        'Authentication Error',
        'Failed to complete Spotify connection. Please try again.',
        [{ text: 'OK' }]
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setConnecting(false);
    }
  }, []);

  const openSpotifyApp = useCallback(async (trackUri?: string) => {
    try {
      let url = 'spotify://';
      
      if (trackUri) {
        url = trackUri;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        // Fallback to web version
        const webUrl = trackUri 
          ? trackUri.replace('spotify:', 'https://open.spotify.com/')
          : 'https://open.spotify.com/';
        
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      logger.error('Error opening Spotify:', error);
    }
  }, []);

  return {
    // State
    spotifyStatus,
    loading,
    connecting,
    refreshing,
    showWebView,
    authUrl,

    // Actions
    connectToSpotify,
    disconnectFromSpotify,
    refreshSpotifyData,
    handleWebViewNavigation,
    openSpotifyApp,
    
    // Setters
    setSpotifyStatus,
    setShowWebView,
  };
};