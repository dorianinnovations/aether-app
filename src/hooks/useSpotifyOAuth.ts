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
      
      // Check if user is authenticated first
      const { TokenManager } = await import('../services/apiModules/utils/storage');
      const token = await TokenManager.getToken();
      
      if (!token) {
        throw new Error('You must be logged in to connect Spotify');
      }
      
      // Get the authorization URL from your backend
      const authResponse = await SpotifyAPI.getAuthUrl();
      const authUrlFromServer = authResponse.authUrl || authResponse.data?.authUrl;
      
      if (authUrlFromServer) {
        setAuthUrl(authUrlFromServer);
        setShowWebView(true);
      } else {
        throw new Error('Failed to get authentication URL');
      }
    } catch (error: any) {
      logger.error('Spotify connection error:', error);
      
      let title = 'Connection Error';
      let errorMessage = 'Unable to connect to Spotify. Please try again.';
      
      // Handle specific error scenarios
      if (error.message?.includes('logged in')) {
        title = 'Login Required';
        errorMessage = 'Please log in to your account first before connecting Spotify.';
      } else if (error.message?.includes('network') || error.message?.includes('timeout') || error.code === 'NETWORK_ERROR') {
        title = 'Network Error';
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.response?.status === 401) {
        title = 'Session Expired';
        errorMessage = 'Your session has expired. Please log in again and try connecting Spotify.';
      } else if (error.response?.status === 403) {
        title = 'Permission Denied';
        errorMessage = 'Access denied. Please contact support if this issue persists.';
      } else if (error.response?.status === 429) {
        title = 'Rate Limited';
        errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
      } else if (error.response?.status >= 500) {
        title = 'Server Error';
        errorMessage = 'Spotify services are currently unavailable. Please try again later.';
      } else if (error.response?.data?.message) {
        // Use server-provided error message if available
        errorMessage = error.response.data.message;
      }
      
      Alert.alert(title, errorMessage, [{ text: 'OK' }]);
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

  const handleSpotifyCallback = useCallback(async (code: string) => {
    setConnecting(true);
    
    try {
      logger.debug('Processing Spotify callback with code:', code);
      
      const response = await SpotifyAPI.handleCallback(code);
      logger.debug('Spotify callback response:', response);
      
      // Handle different response formats
      if (response.success && response.data) {
        // Format: { success: true, data: {...} }
        setSpotifyStatus(response.data);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Show success message
        Alert.alert(
          'Success!',
          'Your Spotify account has been connected successfully.',
          [{ text: 'OK' }]
        );
      } else if (response.success === true) {
        // Format: { success: true, spotify: {...} } or other structure
        const spotifyData = response.spotify || response.data || response;
        setSpotifyStatus(spotifyData);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Show success message
        Alert.alert(
          'Success!',
          'Your Spotify account has been connected successfully.',
          [{ text: 'OK' }]
        );
      } else if (response.connected !== undefined) {
        // Format: { connected: true, ... } (direct Spotify data)
        setSpotifyStatus(response);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Show success message
        Alert.alert(
          'Success!',
          'Your Spotify account has been connected successfully.',
          [{ text: 'OK' }]
        );
      } else {
        // Log the response structure for debugging
        logger.error('Unexpected response structure:', response);
        throw new Error(response.message || response.error || 'Failed to connect Spotify account');
      }
    } catch (error: any) {
      logger.error('Spotify callback error:', error);
      
      let title = 'Connection Failed';
      let message = 'Failed to connect your Spotify account. Please try again.';
      
      // Handle specific error scenarios
      if (error.response?.status === 409 || error.message?.includes('already connected') || error.message?.includes('account conflict')) {
        title = 'Account Already Connected';
        message = 'This Spotify account is already connected to another user. Please disconnect it first or use a different Spotify account.';
      } else if (error.response?.status === 401 || error.message?.includes('unauthorized') || error.message?.includes('invalid')) {
        title = 'Authorization Failed';
        message = 'Spotify authorization failed. Please try connecting again and make sure you approve the connection.';
      } else if (error.response?.status === 403 || error.message?.includes('forbidden') || error.message?.includes('permission')) {
        title = 'Permission Denied';
        message = 'Permission denied by Spotify. Please make sure your Spotify account has the necessary permissions.';
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error') || error.message?.includes('Could not connect')) {
        title = 'Connection Error';
        message = 'Unable to connect to Spotify servers. Please check your internet connection and try again.';
      } else if (error.response?.status === 429) {
        title = 'Too Many Requests';
        message = 'Too many connection attempts. Please wait a few minutes before trying again.';
      } else if (error.response?.status >= 500) {
        title = 'Server Error';
        message = 'Spotify servers are currently unavailable. Please try again later.';
      } else if (error.response?.data?.message) {
        // Use server-provided error message if available
        message = error.response.data.message;
      }
      
      Alert.alert(title, message, [{ text: 'OK' }]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setConnecting(false);
    }
  }, []);

  const handleWebViewNavigation = useCallback((navState: any) => {
    const url = navState.url;
    
    // Handle WebView loading errors
    if (navState.code && navState.code < 0) {
      logger.warn('WebView navigation error:', navState);
      
      let title = 'Connection Error';
      let message = 'Unable to load Spotify authentication page. Please check your internet connection and try again.';
      
      if (navState.code === -1004) {
        title = 'Network Error';
        message = 'Could not connect to Spotify servers. Please check your internet connection and try again.';
      } else if (navState.code === -1009) {
        title = 'No Internet';
        message = 'No internet connection available. Please connect to the internet and try again.';
      } else if (navState.code === -1001) {
        title = 'Request Timeout';
        message = 'The request timed out. Please try again with a better internet connection.';
      }
      
      setShowWebView(false);
      Alert.alert(title, message, [{ text: 'OK' }]);
      return;
    }
    
    // Check if this is the callback URL with authorization code
    if (url.includes('callback') && url.includes('code=')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const code = urlParams.get('code');
      
      if (code) {
        setShowWebView(false);
        handleSpotifyCallback(code);
      }
    }
    
    // Handle OAuth errors
    if (url.includes('error=')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      setShowWebView(false);
      
      let title = 'Authentication Error';
      let message = 'Spotify authentication failed.';
      
      if (error === 'access_denied') {
        title = 'Access Denied';
        message = 'You denied access to your Spotify account. Please try again and approve the connection to use Spotify features.';
      } else if (error === 'invalid_request') {
        title = 'Invalid Request';
        message = 'There was an issue with the authentication request. Please try connecting again.';
      } else if (error === 'unauthorized_client') {
        title = 'Unauthorized';
        message = 'This app is not authorized to connect to Spotify. Please contact support.';
      } else if (errorDescription) {
        message = errorDescription;
      }
      
      Alert.alert(title, message, [{ text: 'OK' }]);
    }
  }, [handleSpotifyCallback]);


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