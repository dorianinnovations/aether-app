/**
 * Spotify Integration Component
 * Handles Spotify OAuth connection and displays current playing status
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  StyleSheet,
  Modal,
  // RefreshControl,
  // ScrollView
} from 'react-native';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  useAnimatedStyle,
  interpolate 
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
// import * as AuthSession from 'expo-auth-session';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { logger } from '../../../utils/logger';

// Design System
import { useTheme } from '../../../contexts/ThemeContext';
// import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

// API
import { SpotifyAPI } from '../../../services/api';

// Types
import { SpotifyData } from '../../../types/social';

interface SpotifyIntegrationProps {
  spotifyData?: {
    connected: boolean;
    currentTrack?: {
      name: string;
      artist: string;
      album: string;
      imageUrl?: string;
      spotifyUrl?: string;
      isPlaying?: boolean;
      lastPlayed?: string;
    };
    topTracks?: Array<{
      name: string;
      artist: string;
      album: string;
      imageUrl?: string;
      spotifyUrl?: string;
    }>;
  };
  onStatusChange?: () => void;
}

export const SpotifyIntegration: React.FC<SpotifyIntegrationProps> = ({
  spotifyData,
  onStatusChange
}) => {
  const { theme, colors } = useTheme();
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Live playback state
  const [, setLiveProgressMs] = useState(0);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(Date.now());

  // Animation values
  const pulseAnimation = useSharedValue(0);
  const waveAnimation1 = useSharedValue(0);
  const waveAnimation2 = useSharedValue(0);
  const waveAnimation3 = useSharedValue(0);

  // Use prop data if provided, otherwise use state data
  const spotify = spotifyData || spotifyStatus;
  
  // Type guard to check if spotify data has connected property
  const hasConnectedProperty = (data: any): data is { connected: boolean; currentTrack?: any; topTracks?: any[] } => {
    return data && typeof data.connected === 'boolean';
  };

  // Helper to get current track from either data format
  const getCurrentTrack = (data: any) => {
    if (hasConnectedProperty(data)) {
      return data.currentTrack;
    } else if (data && data.currentlyPlaying) {
      // Convert SpotifyData format to expected format
      const track = {
        name: data.currentlyPlaying.name,
        artist: data.currentlyPlaying.artist,
        album: '', // SpotifyData doesn't have album in currentlyPlaying
        isPlaying: data.currentlyPlaying.isPlaying,
        progressMs: data.currentlyPlaying.progressMs,
        durationMs: data.currentlyPlaying.durationMs
      };
      return track;
    }
    return null;
  };


  // Get live progress (real-time calculation)
  const getLiveProgress = () => {
    const currentTrack = getCurrentTrack(spotify);
    const baseProgressMs = currentTrack?.progressMs || 0;
    
    if (!currentTrack?.isPlaying && currentTrack?.isPlaying !== undefined) {
      return baseProgressMs; // Return static progress when paused
    }
    
    // Calculate live progress based on time elapsed since last update
    const now = Date.now();
    const timeSinceUpdate = now - lastProgressUpdate;
    const estimatedProgress = baseProgressMs + timeSinceUpdate;
    
    // Don't exceed duration
    const duration = currentTrack?.durationMs || 0;
    return Math.min(estimatedProgress, duration);
  };

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnimation.value, [0, 1], [0.6, 1]),
    transform: [{
      scale: interpolate(pulseAnimation.value, [0, 1], [0.8, 1])
    }]
  }));

  const wave1Style = useAnimatedStyle(() => ({
    height: interpolate(waveAnimation1.value, [0, 1], [4, 12])
  }));

  const wave2Style = useAnimatedStyle(() => ({
    height: interpolate(waveAnimation2.value, [0, 1], [8, 16])
  }));

  const wave3Style = useAnimatedStyle(() => ({
    height: interpolate(waveAnimation3.value, [0, 1], [3, 8])
  }));

  // Start/stop animations based on playing state
  useEffect(() => {
    const currentTrack = getCurrentTrack(spotify);
    const isPlaying = currentTrack?.isPlaying;

    if (isPlaying === true || isPlaying === undefined) {
      // Start pulse animation for the dot
      pulseAnimation.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1,
        true
      );
      
      // Start wave animations with different timings
      waveAnimation1.value = withRepeat(
        withTiming(1, { duration: 800 }),
        -1,
        true
      );
      waveAnimation2.value = withRepeat(
        withTiming(1, { duration: 1200 }),
        -1,
        true
      );
      waveAnimation3.value = withRepeat(
        withTiming(1, { duration: 600 }),
        -1,
        true
      );
    } else {
      // Stop animations when not playing
      pulseAnimation.value = withTiming(0);
      waveAnimation1.value = withTiming(0);
      waveAnimation2.value = withTiming(0);
      waveAnimation3.value = withTiming(0);
    }
  }, [getCurrentTrack(spotify)?.isPlaying]);

  // Live progress updater - updates every second when playing
  useEffect(() => {
    const currentTrack = getCurrentTrack(spotify);
    const isPlaying = currentTrack?.isPlaying === true || currentTrack?.isPlaying === undefined;
    
    if (!isPlaying || !currentTrack?.durationMs) return;

    const interval = setInterval(() => {
      setLiveProgressMs(getLiveProgress());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [spotify, lastProgressUpdate]);

  // Sync progress when Spotify data changes
  useEffect(() => {
    const currentTrack = getCurrentTrack(spotify);
    if (currentTrack?.progressMs !== undefined) {
      setLiveProgressMs(currentTrack.progressMs);
      setLastProgressUpdate(Date.now());
    }
  }, [JSON.stringify((spotify as any)?.currentTrack), JSON.stringify((spotify as any)?.currentlyPlaying)]);

  // Rotation effect for top tracks
  useEffect(() => {
    if (topTracks.length > 0) {
      // Clear existing interval
      if (rotationIntervalRef.current) {
        clearInterval(rotationIntervalRef.current);
      }
      
      // Set up rotation every 3 seconds
      rotationIntervalRef.current = setInterval(() => {
        setCurrentTrackIndex((prev) => (prev + 1) % Math.min(topTracks.length, 10));
      }, 3000);
      
      return () => {
        if (rotationIntervalRef.current) {
          clearInterval(rotationIntervalRef.current);
        }
      };
    }
  }, [topTracks.length]);

  // Load initial status and set up live updates
  useEffect(() => {
    loadSpotifyStatus();
    loadTopTracks();
    
    // Set up live polling for connected users
    const startLiveUpdates = () => {
      
      // Use slower polling since we have live progress updates
      const pollInterval = 30000; // 30s to sync with server data
      
      const interval = setInterval(() => {
        loadSpotifyStatus();
      }, pollInterval);
      
      return interval;
    };
    
    let pollInterval: NodeJS.Timeout | null = null;
    
    const isConnected = hasConnectedProperty(spotify) && spotify.connected;
    if (isConnected) {
      pollInterval = startLiveUpdates();
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [hasConnectedProperty(spotify) && spotify?.connected, getCurrentTrack(spotify)?.isPlaying]);

  // Handle deep link return from Spotify
  useEffect(() => {
    const handleUrl = async (url: string) => {
      logger.info('Received Spotify deep link:', url);
      if (url.includes('aether://spotify-auth')) {
        logger.info('Spotify auth callback received');
        
        // Parse query parameters from the URL
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const state = urlObj.searchParams.get('state');
        
        if (code && state) {
          logger.info('Processing OAuth callback with code and state');
          try {
            setConnecting(true);
            // Call the mobile callback endpoint
            await SpotifyAPI.handleMobileCallback(code, state);
            logger.info('OAuth callback processed successfully');
            
            // Refresh status after successful auth
            setTimeout(async () => {
              await loadSpotifyStatus();
              await loadTopTracks();
              onStatusChange?.();
              Alert.alert('Success!', 'Spotify account connected successfully');
            }, 1000);
          } catch (error) {
            logger.error('OAuth callback error:', error);
            Alert.alert('Connection Failed', 'Failed to complete Spotify authentication');
          } finally {
            setConnecting(false);
          }
        } else {
          logger.warn('Missing code or state in callback URL');
          // Still refresh status in case it worked
          setTimeout(async () => {
            await loadSpotifyStatus();
            await loadTopTracks();
            onStatusChange?.();
          }, 1000);
        }
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    
    return () => subscription?.remove();
  }, []);

  const loadSpotifyStatus = async () => {
    try {
      setLoading(true);
      const response = await SpotifyAPI.getStatus();
      if (response.success) {
        // The server returns { success: true, spotify: {...} }
        // But we need to access response.spotify, not response.data
        const spotifyData = response.spotify || response.data;
        setSpotifyStatus(spotifyData);
        // Status loaded successfully
      }
    } catch (err) {
      logger.warn('Failed to load Spotify status:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTopTracks = async () => {
    try {
      const response = await SpotifyAPI.getTopTracks('short_term', 10);
      if (response.success && response.tracks) {
        setTopTracks(response.tracks);
        // Top tracks loaded
      }
    } catch (err) {
      logger.warn('Failed to load top tracks:', err);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      // Starting Spotify connection
      
      // Get the auth URL from server
      const authResponse = await SpotifyAPI.getAuthUrl();
      const authUrlFromServer = authResponse.authUrl || authResponse.data?.authUrl;
      
      if (!authUrlFromServer) {
        throw new Error('Failed to get authentication URL');
      }

      // Opening auth in WebView
      
      // Open in WebView instead of browser
      setAuthUrl(authUrlFromServer);
      setShowWebView(true);
      
    } catch (err: unknown) {
      logger.error('Spotify connection error:', err);
      Alert.alert('Connection Failed', err instanceof Error ? err.message : 'Failed to connect to Spotify');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Spotify',
      'Are you sure you want to disconnect your Spotify account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await SpotifyAPI.disconnect();
              setSpotifyStatus(null);
              Alert.alert('Success', 'Spotify disconnected successfully');
              onStatusChange?.();
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to disconnect Spotify');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await SpotifyAPI.refresh();
      if (response.success) {
        await loadSpotifyStatus();
        await loadTopTracks();
        Alert.alert('Success', 'Spotify data refreshed');
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to refresh Spotify data');
    } finally {
      setRefreshing(false);
    }
  };

  const openTrackInSpotify = async (url?: string) => {
    if (!url) return;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open Spotify');
      }
    } catch (err) {
      logger.error('Failed to open Spotify:', err);
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      padding: 0,
      marginHorizontal: spacing[5],
      marginTop: spacing[2],
      marginBottom: spacing[2],
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginBottom: spacing[1],
      paddingBottom: 0,
    },
    title: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginLeft: spacing[1],
    },
    liveHeaderIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(29, 185, 84, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: spacing.sm,
    },
    liveHeaderDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#1DB954',
      marginRight: 4,
    },
    liveHeaderText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#1DB954',
      letterSpacing: 0.5,
    },
    connectButton: {
      backgroundColor: '#1DB954',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    connectButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      marginLeft: spacing.xs,
    },
    connectedContent: {
      marginTop: 0,
    },
    currentTrack: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderRadius: 0,
      padding: 0,
      marginBottom: 0,
    },
    currentTrackPlaying: {
      borderColor: 'rgba(29, 185, 84, 0.3)',
      backgroundColor: theme === 'dark' ? 'rgba(29, 185, 84, 0.05)' : 'rgba(29, 185, 84, 0.02)',
    },
    albumArtContainer: {
      position: 'relative',
      marginRight: spacing[2],
    },
    albumArt: {
      width: 28,
      height: 28,
      borderRadius: 4,
      borderWidth: 0,
    },
    albumArtPlaceholder: {
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    liveIndicator: {
      position: 'absolute',
      bottom: 4,
      right: 4,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 2,
      backgroundColor: 'rgba(29, 185, 84, 0.9)',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
    },
    liveWave: {
      width: 2,
      backgroundColor: '#FFFFFF',
      borderRadius: 1,
      height: 8, // Default height, will be animated
    },
    trackInfo: {
      flex: 1,
    },
    trackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    trackName: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
      marginBottom: 1,
    },
    playingBadge: {
      backgroundColor: '#1DB954',
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: spacing.sm,
    },
    artistName: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 0,
    },
    albumName: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 6,
    },
    progressContainer: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    progressBar: {
      height: 4,
      backgroundColor: 'rgba(29, 185, 84, 0.2)',
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: spacing.xs,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#1DB954',
      borderRadius: 2,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    timeText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    statusContainer: {
      marginTop: spacing.xs,
    },
    playingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pulsingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#1DB954',
      marginRight: spacing.xs,
    },
    playingText: {
      fontSize: 12,
      color: '#1DB954',
      fontWeight: '500',
    },
    pausedText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    noTrackContainer: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    noTrackSubtext: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(29, 185, 84, 0.2)',
      gap: spacing.md,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 16,
      backgroundColor: 'rgba(29, 185, 84, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(29, 185, 84, 0.3)',
      flex: 1,
      justifyContent: 'center',
    },
    actionButtonText: {
      fontSize: 14,
      color: '#1DB954',
      marginLeft: spacing.xs,
      fontWeight: '600',
    },
    noTrack: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginVertical: spacing.md,
    },
    loader: {
      marginVertical: spacing.lg,
    },
    webViewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      paddingTop: 60, // Account for status bar
    },
    closeButton: {
      padding: spacing.xs,
    },
    webViewTitle: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    webViewLoading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.md,
    },
    loadingText: {
      fontSize: 16,
      opacity: 0.7,
    },
    recentlyPlayedContainer: {
      backgroundColor: theme === 'dark' ? 'rgba(29, 185, 84, 0.08)' : 'rgba(29, 185, 84, 0.03)',
      borderRadius: 12,
      padding: spacing.md,
      marginHorizontal: spacing.md,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(29, 185, 84, 0.2)' : 'rgba(29, 185, 84, 0.15)',
    },
    recentlyPlayedTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1DB954',
      marginBottom: spacing.sm,
    },
    recentTrackCard: {
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.4)',
      borderRadius: 8,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    recentTrackName: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
      marginBottom: 2,
    },
    recentTrackArtist: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    recentTrackTime: {
      fontSize: 11,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    rotationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    trackCounter: {
      backgroundColor: 'rgba(29, 185, 84, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    trackCounterText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#1DB954',
    },
    topTracksRotation: {
      position: 'relative',
      height: 90,
      marginBottom: spacing.sm,
    },
    activeTrackCard: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
    hiddenTrackCard: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      opacity: 0,
      transform: [{ scale: 0.95 }],
    },
    trackRankContainer: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(29, 185, 84, 0.15)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    trackRank: {
      fontSize: 10,
      fontWeight: '700',
      color: '#1DB954',
    },
    trackDetailsContainer: {
      paddingRight: 40,
    },
    recentTrackAlbum: {
      fontSize: 11,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    rotationIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 4,
      marginTop: spacing.xs,
    },
    rotationDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(29, 185, 84, 0.2)',
    },
    rotationDotActive: {
      backgroundColor: '#1DB954',
    },
  });

  if (loading && !spotify) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary || '#1DB954'} style={styles.loader} />
      </View>
    );
  }

  const handleWebViewMessage = (event: any) => {
    const { data } = event.nativeEvent;
    logger.info('WebView message received:', data);
    
    if (data === 'spotify-connected') {
      logger.info('Spotify connection successful!');
      setShowWebView(false);
      setConnecting(false);
      
      // Refresh status after successful connection
      setTimeout(async () => {
        await loadSpotifyStatus();
        await loadTopTracks();
        onStatusChange?.();
        Alert.alert('Success!', 'Spotify account connected successfully');
      }, 1000);
    }
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    // Close WebView if we detect the success page
    if (navState.url.includes('spotify/callback') && navState.title?.includes('Spotify Connected')) {
      logger.info('Detected success page, closing WebView...');
      setTimeout(() => {
        setShowWebView(false);
        setConnecting(false);
        
        // Refresh status
        setTimeout(async () => {
          await loadSpotifyStatus();
          await loadTopTracks();
          onStatusChange?.();
          Alert.alert('Success!', 'Spotify account connected successfully');
        }, 1000);
      }, 2000); // Give user time to see success page
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome name="spotify" size={14} color={colors.textSecondary} />
            <Text style={styles.title}>Playing Now</Text>
          </View>
        </View>

      {!hasConnectedProperty(spotify) || !spotify.connected ? (
        <TouchableOpacity
          style={styles.connectButton}
          onPress={handleConnect}
          disabled={connecting}
        >
          {connecting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <FontAwesome name="spotify" size={20} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>Connect Spotify</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.connectedContent}>
          {getCurrentTrack(spotify) ? (
            <TouchableOpacity
              style={[
                styles.currentTrack,
                getCurrentTrack(spotify)?.isPlaying && styles.currentTrackPlaying
              ]}
              onPress={() => openTrackInSpotify(getCurrentTrack(spotify)?.spotifyUrl)}
              activeOpacity={0.8}
            >
              {/* Album Art with Live Indicator Overlay */}
              <View style={styles.albumArtContainer}>
                {getCurrentTrack(spotify)?.imageUrl ? (
                  <Image
                    source={{ uri: getCurrentTrack(spotify)?.imageUrl }}
                    style={styles.albumArt}
                  />
                ) : (
                  <View style={[styles.albumArt, styles.albumArtPlaceholder]}>
                    <Ionicons name="musical-notes" size={24} color={colors.textSecondary} />
                  </View>
                )}
                
                {/* Live Playing Indicator */}
                {(getCurrentTrack(spotify)?.isPlaying === true || getCurrentTrack(spotify)?.isPlaying === undefined) && (
                  <View style={styles.liveIndicator}>
                    <Animated.View style={[styles.liveWave, wave1Style]} />
                    <Animated.View style={[styles.liveWave, wave2Style]} />
                    <Animated.View style={[styles.liveWave, wave3Style]} />
                  </View>
                )}
              </View>
              
              <View style={styles.trackInfo}>
                <View style={styles.trackHeader}>
                  <Text style={styles.trackName} numberOfLines={1}>
                    {getCurrentTrack(spotify)?.name}
                  </Text>
                </View>
                
                <Text style={styles.artistName} numberOfLines={1}>
                  {getCurrentTrack(spotify)?.artist}
                </Text>
                
                {getCurrentTrack(spotify)?.album && (
                  <Text style={styles.albumName} numberOfLines={1}>
                    {getCurrentTrack(spotify)?.album}
                  </Text>
                )}
                

              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.noTrackContainer}>
              <Ionicons name="musical-notes-outline" size={32} color={colors.textSecondary} />
              <Text style={styles.noTrack}>No track currently playing</Text>
              <Text style={styles.noTrackSubtext}>Music will appear here when you start listening</Text>
            </View>
          )}

        </View>
      )}
    </View>


    {/* Spotify OAuth WebView Modal */}
    <Modal
      visible={showWebView}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowWebView(false);
        setConnecting(false);
      }}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.webViewHeader, { backgroundColor: colors.background, borderBottomColor: colors.borders.default }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowWebView(false);
              setConnecting(false);
            }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.webViewTitle, { color: colors.text }]}>Connect Spotify</Text>
          <View style={{ width: 24 }} />
        </View>
        {authUrl ? (
          <WebView
            source={{ uri: authUrl }}
            onMessage={handleWebViewMessage}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={[styles.webViewLoading, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color="#1DB954" />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading Spotify...</Text>
              </View>
            )}
          />
        ) : null}
      </View>
    </Modal>
  </>
  );
};