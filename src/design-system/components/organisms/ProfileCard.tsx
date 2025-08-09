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
} from 'react-native';
import { ProfileHeader, ProfileFieldsGroup, SocialProfileSection, SpotifyIntegration } from '../molecules';
import { ProfileInsights } from './ProfileInsights';
import { LottieLoader, UserBadgeType } from '../atoms';
import { spacing } from '../../tokens/spacing';
import { OnlineStatusType } from '../atoms/OnlineStatus';

export interface UserProfile {
  email: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
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
  /** Whether to show AI insights expanded */
  showInsightsExpanded?: boolean;
  /** Callbacks */
  onRefresh?: () => void;
  onFieldChange?: (field: keyof UserProfile, value: string) => void;
  onProfileImagePress?: () => void;
  onBannerPress?: () => void;
  onDeleteProfileImage?: () => void;
  onDeleteBanner?: () => void;
  onInsightsToggle?: (expanded: boolean) => void;
  onSpotifyStatusChange?: () => void;
  /** Custom styles */
  style?: ViewStyle;
  /** Scroll view ref */
  scrollRef?: React.RefObject<ScrollView>;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  socialProfile,
  editMode = false,
  uploading = false,
  refreshing = false,
  viewMode = 'basic',
  onlineStatus = 'online',
  showInsightsExpanded = false,
  onRefresh,
  onFieldChange,
  onProfileImagePress,
  onBannerPress,
  onDeleteProfileImage,
  onDeleteBanner,
  onInsightsToggle,
  onSpotifyStatusChange,
  style,
  scrollRef,
}) => {

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
        editable={editMode}
        uploading={uploading}
        status={onlineStatus}
        statusMessage={socialProfile?.currentStatus}
        showDetailedStatus={viewMode === 'busy'}
        onProfileImagePress={onProfileImagePress}
        onBannerPress={onBannerPress}
        onDeleteProfileImage={onDeleteProfileImage}
        onDeleteBanner={onDeleteBanner}
      />

      {/* Profile Fields */}
      <ProfileFieldsGroup
        profile={profile}
        editable={editMode}
        viewMode={viewMode}
        onFieldChange={onFieldChange}
      />

      {/* Social Profile Section */}
      {socialProfile && (
        <SocialProfileSection
          socialProfile={socialProfile}
          style={styles.socialSection}
        />
      )}

      {/* Spotify Integration */}
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

      {/* AI Insights */}
      {socialProfile?.personality && (
        <ProfileInsights
          personalityData={socialProfile.personality}
          expanded={showInsightsExpanded}
          onToggle={onInsightsToggle}
          style={styles.insightsSection}
        />
      )}

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
  insightsSection: {
    paddingHorizontal: spacing[5],
  },
  bottomSpacing: {
    height: 100, // Extra space for floating elements
  },
});

export default ProfileCard;