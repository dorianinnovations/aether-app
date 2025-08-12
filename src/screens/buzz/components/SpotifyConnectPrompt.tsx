/**
 * SpotifyConnectPrompt Component
 * Prompt to connect Spotify for personalized feed
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Design System
import { typography } from '../../../design-system/tokens/typography';
import { spacing } from '../../../design-system/tokens/spacing';
import type { ThemeColors } from '../types';

interface SpotifyConnectPromptProps {
  colors: ThemeColors;
  isDarkMode: boolean;
}

const SpotifyConnectPrompt: React.FC<SpotifyConnectPromptProps> = ({ colors, isDarkMode }) => {
  const handleConnectPress = () => {
    // TODO: Implement Spotify OAuth flow
    // For now, open Spotify website
    Linking.openURL('https://www.spotify.com');
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isDarkMode
              ? 'rgba(30, 215, 96, 0.1)'
              : 'rgba(30, 215, 96, 0.05)',
          },
        ]}
      >
        <Ionicons name="musical-notes" size={48} color="#1DB954" />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>
        Connect Spotify for Personalized Feed
      </Text>
      
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        See news, releases, and trending content from artists you love
      </Text>
      
      <TouchableOpacity
        style={[
          styles.connectButton,
          {
            backgroundColor: '#1DB954',
          },
        ]}
        onPress={handleConnectPress}
        activeOpacity={0.8}
      >
        <Ionicons name="musical-note" size={24} color="white" style={styles.buttonIcon} />
        <Text style={styles.connectButtonText}>Connect Spotify</Text>
      </TouchableOpacity>
      
      <Text style={[styles.hint, { color: colors.textTertiary }]}>
        Your listening data stays private and secure
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 3,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  connectButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: 'white',
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default SpotifyConnectPrompt;