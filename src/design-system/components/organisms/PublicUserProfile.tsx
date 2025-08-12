/**
 * PublicUserProfile Organism
 * Read-only profile display for viewing other users' public profiles
 */

import * as React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ProfileHeader, ProfileFieldsGroup, SpotifyIntegration, SocialStats, GrailsSection } from '../molecules';
import { LottieLoader, UserBadgeType } from '../atoms';
import { spacing } from '../../tokens/spacing';
import { OnlineStatusType } from '../atoms/OnlineStatus';
import { useTheme } from '../../../contexts/ThemeContext';

export interface SocialLinks {
  instagram?: string;
  x?: string; // formerly Twitter
  spotify?: string;
  facebook?: string;
  website?: string;
}

export interface UserProfile {
  email: string;
  username?: string;
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string; // kept for backward compatibility
  socialLinks?: SocialLinks;
  profilePicture?: string;
  bannerImage?: string;
  badges?: Array<{
    id: string;
    badgeType: UserBadgeType;
    isVisible: boolean;
  }>;
}

export interface SocialProfile {
  currentStatus?: string;
  mood?: string;
  currentPlans?: string;
  friendsCount?: number;
  followersCount?: number;
  grails?: {
    topTracks: Array<{
      id: string;
      name: string;
      artist: string;
      album: string;
      imageUrl?: string;
      spotifyUrl?: string;
    }>;
    topAlbums: Array<{
      id: string;
      name: string;
      artist: string;
      imageUrl?: string;
      spotifyUrl?: string;
      releaseDate?: string;
    }>;
  };
  spotify?: {
    connected: boolean;
    currentTrack?: {
      name: string;
      artist: string;
    };
    recentTracks?: Array<{
      name: string;
      artist: string;
    }>;
  };
  personality?: {
    interests?: Array<{
      topic: string;
      confidence: number;
    }>;
    communicationStyle?: {
      [key: string]: number;
    };
    totalMessages?: number;
    lastAnalyzed?: string;
  };
}

export interface PublicUserProfileProps {
  /** User profile data */
  profile: UserProfile;
  /** Social profile data */
  socialProfile?: SocialProfile;
  /** Whether profile is loading */
  loading?: boolean;
  /** View mode */
  viewMode?: 'basic' | 'busy';
  /** Online status */
  onlineStatus?: OnlineStatusType;
  /** Custom styles */
  style?: ViewStyle;
  /** Scroll view ref */
  scrollRef?: React.RefObject<ScrollView | null>;
  /** Whether to show grip bar overlay */
  showGripBar?: boolean;
  /** Scroll event handler */
  onScroll?: (event: any) => void;
}

export const PublicUserProfile: React.FC<PublicUserProfileProps> = ({
  profile,
  socialProfile,
  loading = false,
  viewMode = 'basic',
  onlineStatus = 'offline', // Default to offline for other users
  style,
  scrollRef,
  showGripBar = false,
  onScroll,
}) => {
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieLoader size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, style]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {/* Profile Header - Read Only */}
      <ProfileHeader
        profileImageUri={profile.profilePicture}
        bannerImageUri={profile.bannerImage}
        username={profile.username}
        displayName={profile.displayName}
        badges={profile.badges}
        editable={false} // Always read-only
        uploading={false}
        status={onlineStatus}
        statusMessage={socialProfile?.currentStatus}
        showDetailedStatus={viewMode === 'busy'}
        friendsCount={socialProfile?.friendsCount}
        followersCount={socialProfile?.followersCount}
        showGripBar={showGripBar}
        // No editing callbacks
        configureMode={false}
      />

      {/* Profile Fields - Read Only */}
      <ProfileFieldsGroup
        profile={profile}
        editable={false} // Always read-only
        viewMode={viewMode}
        // No editing callbacks
      />

      {/* Social Stats */}
      <SocialStats 
        friendsCount={socialProfile?.friendsCount}
        followersCount={socialProfile?.followersCount}
      />

      {/* Spotify Integration - Read Only */}
      <View style={styles.spotifySection}>
        <SpotifyIntegration 
          spotifyData={socialProfile?.spotify ? {
            ...socialProfile.spotify,
            currentTrack: socialProfile.spotify.currentTrack ? {
              ...socialProfile.spotify.currentTrack,
              album: (socialProfile.spotify.currentTrack as any).album || 'Unknown Album'
            } : undefined
          } : { connected: false }}
          // No status change callback - read only
        />
        
        {/* Grails Section - Read Only */}
        <GrailsSection
          grailsData={socialProfile?.grails}
          editable={false} // Always read-only for public profiles
          theme={theme}
          spotifyConnected={socialProfile?.spotify?.connected || false}
        />
      </View>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 0,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  spotifySection: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[16], // Even more space from profile header
    marginBottom: spacing[8], // More spacing at bottom
  },
  bottomSpacing: {
    height: 100, // Extra space for floating elements
  },
});

export default PublicUserProfile;