/**
 * Spotify Integration Component
 * Handles Spotify OAuth connection and displays current playing status
 */

import React, { useState, useEffect } from 'react';
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
      return {
        name: data.currentlyPlaying.name,
        artist: data.currentlyPlaying.artist,
        album: '', // SpotifyData doesn't have album in currentlyPlaying
        isPlaying: data.currentlyPlaying.isPlaying
      };
    }
    return null;
  };

  // Load initial status
  useEffect(() => {
    loadSpotifyStatus();
  }, []);

  // Handle deep link return from Spotify
  useEffect(() => {
    const handleUrl = async (url: string) => {
      console.log('🎵 Received deep link:', url);
      if (url.includes('aether://spotify-auth')) {
        console.log('🎵 Spotify auth callback received');
        
        // Parse query parameters from the URL
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const state = urlObj.searchParams.get('state');
        
        if (code && state) {
          console.log('🎵 Processing OAuth callback with code and state');
          try {
            setConnecting(true);
            // Call the mobile callback endpoint
            await SpotifyAPI.handleMobileCallback(code, state);
            console.log('🎵 OAuth callback processed successfully');
            
            // Refresh status after successful auth
            setTimeout(async () => {
              await loadSpotifyStatus();
              onStatusChange?.();
              Alert.alert('Success!', 'Spotify account connected successfully');
            }, 1000);
          } catch (error) {
            console.error('🎵 OAuth callback error:', error);
            Alert.alert('Connection Failed', 'Failed to complete Spotify authentication');
          } finally {
            setConnecting(false);
          }
        } else {
          console.log('🎵 Missing code or state in callback URL');
          // Still refresh status in case it worked
          setTimeout(async () => {
            await loadSpotifyStatus();
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
        setSpotifyStatus(response.data);
      }
    } catch (err) {
      logger.warn('Failed to load Spotify status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      console.log('🎵 Starting Spotify connection...');
      
      // Get the auth URL from server
      const authResponse = await SpotifyAPI.getAuthUrl();
      const authUrlFromServer = authResponse.authUrl || authResponse.data?.authUrl;
      
      if (!authUrlFromServer) {
        throw new Error('Failed to get authentication URL');
      }

      console.log('🎵 Opening Spotify auth in WebView');
      
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
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
      borderRadius: 16,
      padding: spacing.md,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      width: '95%',
      alignSelf: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
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
      marginTop: spacing.sm,
    },
    currentTrack: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)',
      borderRadius: 12,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    albumArt: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: spacing.sm,
    },
    trackInfo: {
      flex: 1,
    },
    trackName: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
    },
    artistName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    albumName: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    playingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.xs,
    },
    playingText: {
      fontSize: 12,
      color: '#1DB954',
      marginLeft: spacing.xs,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: spacing.md,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 12,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.6)',
    },
    actionButtonText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: spacing.xs,
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
    console.log('🎵 WebView message received:', data);
    
    if (data === 'spotify-connected') {
      console.log('🎵 Spotify connection successful!');
      setShowWebView(false);
      setConnecting(false);
      
      // Refresh status after successful connection
      setTimeout(async () => {
        await loadSpotifyStatus();
        onStatusChange?.();
        Alert.alert('Success!', 'Spotify account connected successfully');
      }, 1000);
    }
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    // Close WebView if we detect the success page
    if (navState.url.includes('spotify/callback') && navState.title?.includes('Spotify Connected')) {
      console.log('🎵 Detected success page, closing WebView...');
      setTimeout(() => {
        setShowWebView(false);
        setConnecting(false);
        
        // Refresh status
        setTimeout(async () => {
          await loadSpotifyStatus();
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
            <FontAwesome name="spotify" size={24} color="#1DB954" />
            <Text style={styles.title}> Spotify</Text>
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
              style={styles.currentTrack}
              onPress={() => openTrackInSpotify(getCurrentTrack(spotify)?.spotifyUrl)}
              activeOpacity={0.8}
            >
              {getCurrentTrack(spotify)?.imageUrl && (
                <Image
                  source={{ uri: getCurrentTrack(spotify)?.imageUrl }}
                  style={styles.albumArt}
                />
              )}
              <View style={styles.trackInfo}>
                <Text style={styles.trackName} numberOfLines={1}>
                  {getCurrentTrack(spotify)?.name}
                </Text>
                <Text style={styles.artistName} numberOfLines={1}>
                  {getCurrentTrack(spotify)?.artist}
                </Text>
                <Text style={styles.albumName} numberOfLines={1}>
                  {getCurrentTrack(spotify)?.album}
                </Text>
                {getCurrentTrack(spotify)?.isPlaying && (
                  <View style={styles.playingIndicator}>
                    <Ionicons name="play-circle" size={14} color="#1DB954" />
                    <Text style={styles.playingText}>Now Playing</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.noTrack}>No track currently playing</Text>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={colors.primary || '#1DB954'} />
              ) : (
                <>
                  <Ionicons name="refresh" size={18} color={colors.text} />
                  <Text style={styles.actionButtonText}>Refresh</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDisconnect}
            >
              <Ionicons name="unlink" size={18} color={colors.text} />
              <Text style={styles.actionButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
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