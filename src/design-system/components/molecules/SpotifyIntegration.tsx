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
  // RefreshControl,
  // ScrollView
} from 'react-native';
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

  // Use prop data if provided, otherwise use state data
  const spotify = spotifyData || spotifyStatus;

  // Load initial status
  useEffect(() => {
    loadSpotifyStatus();
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
      
      // Get the auth URL from server
      const authResponse = await SpotifyAPI.getAuthUrl();
      const authUrl = authResponse.authUrl || authResponse.data?.authUrl;
      
      if (!authUrl) {
        throw new Error('Failed to get authentication URL');
      }

      logger.debug('Opening Spotify auth URL:', authUrl);

      // Open in browser for OAuth flow
      const supported = await Linking.canOpenURL(authUrl);
      if (!supported) {
        throw new Error('Cannot open Spotify authentication page');
      }
      
      await Linking.openURL(authUrl);
      
      // Show instructions to user
      Alert.alert(
        'Complete Authentication',
        'Please complete the Spotify login in your browser. Once done, return to the app.',
        [
          {
            text: 'OK',
            onPress: async () => {
              // Check status after user returns
              setTimeout(async () => {
                await loadSpotifyStatus();
                onStatusChange?.();
              }, 2000);
            }
          }
        ]
      );
      
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
  });

  if (loading && !spotify) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary || '#1DB954'} style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <FontAwesome name="spotify" size={24} color="#1DB954" />
          <Text style={styles.title}> Spotify</Text>
        </View>
      </View>

      {!spotify?.connected ? (
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
          {spotify.currentTrack ? (
            <TouchableOpacity
              style={styles.currentTrack}
              onPress={() => openTrackInSpotify(spotify.currentTrack.spotifyUrl)}
              activeOpacity={0.8}
            >
              {spotify.currentTrack.imageUrl && (
                <Image
                  source={{ uri: spotify.currentTrack.imageUrl }}
                  style={styles.albumArt}
                />
              )}
              <View style={styles.trackInfo}>
                <Text style={styles.trackName} numberOfLines={1}>
                  {spotify.currentTrack.name}
                </Text>
                <Text style={styles.artistName} numberOfLines={1}>
                  {spotify.currentTrack.artist}
                </Text>
                <Text style={styles.albumName} numberOfLines={1}>
                  {spotify.currentTrack.album}
                </Text>
                {spotify.currentTrack.isPlaying && (
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
  );
};