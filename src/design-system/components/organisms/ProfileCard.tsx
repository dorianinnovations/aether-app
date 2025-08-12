/**
 * ProfileCard Organism
 * Complete profile card combining all profile components
 */

import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ViewStyle,
  TextInput,
} from 'react-native';
import { ProfileHeader, ProfileFieldsGroup, SocialProfileSection, SpotifyIntegration, SocialStats, GrailsSection } from '../molecules';
import { LottieLoader, UserBadgeType, InteractiveBadge, AdvancedBadge } from '../atoms';
import { spacing } from '../../tokens/spacing';
import { OnlineStatusType } from '../atoms/OnlineStatus';
import { GrailsData } from '../molecules/GrailsSection';
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
  grails?: GrailsData;
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

export interface ProfileCardProps {
  /** User profile data */
  profile: UserProfile;
  /** Social profile data */
  socialProfile?: SocialProfile;
  /** Whether the profile is in edit mode */
  editMode?: boolean;
  /** Whether an upload is in progress */
  uploading?: boolean;
  /** Whether profile is refreshing */
  refreshing?: boolean;
  /** View mode */
  viewMode?: 'basic' | 'busy';
  /** Online status */
  onlineStatus?: OnlineStatusType;
  /** Callbacks */
  onRefresh?: () => void;
  onFieldChange?: (field: keyof UserProfile, value: string | SocialLinks) => void;
  onProfileImagePress?: () => void;
  onBannerPress?: () => void;
  onDeleteProfileImage?: () => void;
  onDeleteBanner?: () => void;
  onSpotifyStatusChange?: () => void;
  onConfigurePress?: () => void;
  onUsernamePress?: () => void;
  onInputFocus?: (inputRef: TextInput) => void;
  onGrailsChange?: (grails: GrailsData) => void;
  onEnableEditMode?: () => void;
  /** Whether configure mode is active */
  configureMode?: boolean;
  /** Custom styles */
  style?: ViewStyle;
  /** Scroll view ref */
  scrollRef?: React.RefObject<ScrollView | null>;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  socialProfile,
  editMode = false,
  uploading = false,
  refreshing = false,
  viewMode = 'basic',
  onlineStatus = 'online',
  onRefresh,
  onFieldChange,
  onProfileImagePress,
  onBannerPress,
  onDeleteProfileImage,
  onDeleteBanner,
  onSpotifyStatusChange,
  onConfigurePress,
  onUsernamePress,
  onInputFocus,
  onGrailsChange,
  onEnableEditMode,
  configureMode = false,
  style,
  scrollRef,
}) => {
  const { theme } = useTheme();

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, style]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={['transparent']}
            style={{ backgroundColor: 'transparent' }}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Custom Refresh Indicator */}
      {refreshing && (
        <View style={styles.refreshIndicator}>
          <LottieLoader size="small" />
        </View>
      )}

      {/* Profile Header */}
      <ProfileHeader
        profileImageUri={profile.profilePicture}
        bannerImageUri={profile.bannerImage}
        username={profile.username}
        displayName={profile.displayName}
        badges={profile.badges}
        editable={editMode}
        uploading={uploading}
        status={onlineStatus}
        statusMessage={socialProfile?.currentStatus}
        showDetailedStatus={viewMode === 'busy'}
        friendsCount={socialProfile?.friendsCount}
        followersCount={socialProfile?.followersCount}
        onProfileImagePress={onProfileImagePress}
        onBannerPress={onBannerPress}
        onDeleteProfileImage={onDeleteProfileImage}
        onDeleteBanner={onDeleteBanner}
        onConfigurePress={onConfigurePress}
        onUsernamePress={onUsernamePress}
        configureMode={configureMode}
      />

      {/* Profile Fields */}
      <ProfileFieldsGroup
        profile={profile}
        editable={editMode}
        viewMode={viewMode}
        onFieldChange={onFieldChange}
        onInputFocus={onInputFocus}
      />

      {/* Social Stats - Full Width Above Spotify */}
      <SocialStats 
        friendsCount={socialProfile?.friendsCount}
        followersCount={socialProfile?.followersCount}
      />

      {/* Spotify Integration */}
      <View style={styles.spotifySection}>
        <SpotifyIntegration 
          spotifyData={socialProfile?.spotify ? {
            ...socialProfile.spotify,
            currentTrack: socialProfile.spotify.currentTrack ? {
              ...socialProfile.spotify.currentTrack,
              album: (socialProfile.spotify.currentTrack as any).album || 'Unknown Album'
            } : undefined
          } : { connected: false }}
          onStatusChange={onSpotifyStatusChange}
        />
        
        {/* Grails Section */}
        <GrailsSection
          grailsData={socialProfile?.grails}
          editable={editMode}
          onGrailsChange={onGrailsChange}
          onEnableEditMode={onEnableEditMode}
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
    paddingTop: 120,
    paddingBottom: 40,
  },
  refreshIndicator: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    zIndex: 1000,
  },
  socialSection: {
    paddingHorizontal: spacing[5],
    marginTop: spacing[4],
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

export default ProfileCard;