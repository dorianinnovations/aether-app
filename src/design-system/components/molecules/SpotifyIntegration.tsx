/**
 * Spotify Integration Component
 * Handles Spotify connection, display, and controls in profile
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';

// Design System
import { useTheme } from '../../../contexts/ThemeContext';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';

// Hooks
import { useSpotifyIntegration } from '../../../hooks/useSocialProxy';
// API
import { SpotifyAPI } from '../../../services/api';

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
  const {
    spotifyStatus,
    loading,
    error,
    getSpotifyAuth,
    disconnectSpotify,
    refreshSpotifyData,
    clearError
  } = useSpotifyIntegration();

  const [connecting, setConnecting] = useState(false);

  // Use prop data if provided, otherwise use hook data
  const spotify = spotifyData || spotifyStatus;

  useEffect(() => {
    if (error) {
      Alert.alert('Spotify Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      
      // Get the auth URL from server
      const authResponse = await getSpotifyAuth();
      if (!authResponse.success) {
        throw new Error(authResponse.message || 'Failed to get auth URL');
      }

      // Use Expo AuthSession to handle OAuth flow
      const redirectUri = AuthSession.makeRedirectUri({ 
        scheme: 'aether',
        path: 'spotify-auth'
      });
      
      console.log('OAuth redirect URI:', redirectUri);
      console.log('Spotify auth URL:', authResponse.authUrl);

      // Open the auth URL and wait for redirect
      const result = await AuthSession.startAsync({
        authUrl: authResponse.authUrl,
        returnUrl: redirectUri
      });

      console.log('OAuth result:', result);

      if (result.type === 'success') {
        const { code, state } = result.params;
        
        if (code && state) {
          // Send the code back to our server
          const callbackResponse = await SpotifyAPI.handleMobileCallback(code, state);
          
          if (callbackResponse.success) {
            Alert.alert('Success', 'Spotify connected successfully!');
            onStatusChange?.();
          } else {
            Alert.alert('Connection Failed', callbackResponse.message || 'Failed to connect Spotify');
          }
        } else {
          Alert.alert('Connection Failed', 'Missing authorization code');
        }
      } else if (result.type === 'error') {
        Alert.alert('Connection Failed', result.errorCode || 'Authorization failed');
      } else {
        // User cancelled
        console.log('User cancelled OAuth flow');
      }
    } catch (err: any) {
      console.error('Spotify connection error:', err);
      Alert.alert('Connection Failed', err.message || 'Failed to connect to Spotify');
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
              await disconnectSpotify();
              onStatusChange?.();
              Alert.alert('Success', 'Spotify account disconnected');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to disconnect Spotify');
            }
          }
        }
      ]
    );
  };

  const handleRefresh = async () => {
    try {
      await refreshSpotifyData();
      onStatusChange?.();
    } catch (err: any) {
      Alert.alert('Refresh Failed', err.message || 'Failed to refresh Spotify data');
    }
  };

  const openTrackInSpotify = (spotifyUrl?: string) => {
    if (spotifyUrl) {
      Linking.openURL(spotifyUrl).catch(() => {
        Alert.alert('Error', 'Failed to open Spotify');
      });
    }
  };

  if (!spotify?.connected) {
    return (
      <View style={[styles.spotifySection, { backgroundColor: colors.surface }]}>
        <View style={styles.spotifyHeader}>
          <View style={styles.spotifyTitleRow}>
            <MaterialIcons name="music-note" size={20} color="#1DB954" />
            <Text style={[styles.spotifyTitle, { color: colors.text }]}>
              Spotify Integration
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleConnect}
            disabled={connecting || loading}
            style={[styles.connectButton, { backgroundColor: '#1DB954' }]}
            activeOpacity={0.8}
          >
            {connecting || loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialIcons name="link" size={16} color="white" />
                <Text style={styles.connectButtonText}>Connect</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.spotifyDescription, { color: colors.textSecondary }]}>
          Connect your Spotify account to share your music taste with friends and show live listening status.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.spotifySection, { backgroundColor: colors.surface }]}>
      <View style={styles.spotifyHeader}>
        <View style={styles.spotifyTitleRow}>
          <MaterialIcons name="music-note" size={20} color="#1DB954" />
          <Text style={[styles.spotifyTitle, { color: colors.text }]}>
            Spotify Connected
          </Text>
          <View style={[styles.connectedIndicator, { backgroundColor: '#1DB954' }]} />
        </View>
        
        <View style={styles.spotifyActions}>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={loading}
            style={[styles.actionButton, { backgroundColor: colors.background }]}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Feather name="refresh-cw" size={14} color={colors.text} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleDisconnect}
            style={[styles.actionButton, { backgroundColor: colors.background }]}
            activeOpacity={0.7}
          >
            <Feather name="x" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Track */}
      {spotify.currentTrack && (
        <TouchableOpacity
          style={[styles.currentTrack, { borderColor: colors.borders.default }]}
          onPress={() => openTrackInSpotify(spotify.currentTrack?.spotifyUrl)}
          activeOpacity={0.8}
        >
          <View style={styles.trackInfo}>
            {spotify.currentTrack.imageUrl && (
              <Image
                source={{ uri: spotify.currentTrack.imageUrl }}
                style={styles.trackImage}
              />
            )}
            <View style={styles.trackDetails}>
              <Text style={[styles.trackName, { color: colors.text }]} numberOfLines={1}>
                {spotify.currentTrack.name}
              </Text>
              <Text style={[styles.trackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                {spotify.currentTrack.artist}
              </Text>
              {spotify.currentTrack.lastPlayed && (
                <Text style={[styles.trackTime, { color: colors.textSecondary }]}>
                  {spotify.currentTrack.isPlaying ? 'Now playing' : 'Recently played'}
                </Text>
              )}
            </View>
          </View>
          <Feather name="external-link" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Top Tracks */}
      {spotify.topTracks && spotify.topTracks.length > 0 && (
        <View style={styles.topTracksSection}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Recent Favorites
          </Text>
          {spotify.topTracks.slice(0, 3).map((track: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={[styles.topTrack, { borderColor: colors.borders.default }]}
              onPress={() => openTrackInSpotify(track.spotifyUrl)}
              activeOpacity={0.8}
            >
              {track.imageUrl && (
                <Image
                  source={{ uri: track.imageUrl }}
                  style={styles.topTrackImage}
                />
              )}
              <View style={styles.topTrackDetails}>
                <Text style={[styles.topTrackName, { color: colors.text }]} numberOfLines={1}>
                  {track.name}
                </Text>
                <Text style={[styles.topTrackArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  spotifySection: {
    borderRadius: 16,
    padding: spacing[4],
    marginVertical: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.2)',
  },
  
  spotifyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  
  spotifyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  
  spotifyTitle: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
  },
  
  connectedIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  spotifyActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 8,
    gap: spacing[1],
  },
  
  connectButtonText: {
    color: 'white',
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
  },
  
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  spotifyDescription: {
    ...typography.textStyles.bodySmall,
    lineHeight: 20,
  },
  
  currentTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing[3],
  },
  
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  trackImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: spacing[3],
  },
  
  trackDetails: {
    flex: 1,
  },
  
  trackName: {
    ...typography.textStyles.bodyMedium,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  trackArtist: {
    ...typography.textStyles.bodySmall,
    marginBottom: 2,
  },
  
  trackTime: {
    ...typography.textStyles.caption,
    fontSize: 11,
  },
  
  topTracksSection: {
    marginTop: spacing[2],
  },
  
  sectionTitle: {
    ...typography.textStyles.bodySmall,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  
  topTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing[1],
  },
  
  topTrackImage: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  
  topTrackDetails: {
    flex: 1,
  },
  
  topTrackName: {
    ...typography.textStyles.bodySmall,
    fontWeight: '500',
    marginBottom: 2,
  },
  
  topTrackArtist: {
    ...typography.textStyles.caption,
  },
});

export default SpotifyIntegration;