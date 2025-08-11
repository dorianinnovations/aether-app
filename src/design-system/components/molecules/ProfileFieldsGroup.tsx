/**
 * ProfileFieldsGroup Molecule
 * Composite component for grouping and managing profile fields
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ProfileField } from '../atoms';
import { UserBadgeType } from '../atoms/UserBadge';
import { spacing } from '../../tokens/spacing';

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
  badges?: Array<{
    id: string;
    badgeType: UserBadgeType;
    isVisible: boolean;
  }>;
}

export interface ProfileFieldsGroupProps {
  /** Profile data */
  profile: UserProfile;
  /** Whether fields are editable */
  editable?: boolean;
  /** View mode - affects which fields are shown */
  viewMode?: 'basic' | 'busy';
  /** Callback when field value changes */
  onFieldChange?: (field: keyof UserProfile, value: string | SocialLinks) => void;
  /** Custom styles */
  style?: ViewStyle;
}

export const ProfileFieldsGroup: React.FC<ProfileFieldsGroupProps> = ({
  profile,
  editable = false,
  viewMode = 'basic',
  onFieldChange,
  style,
}) => {
  // Helper function to handle social link changes
  const handleSocialLinkChange = (platform: keyof SocialLinks, value: string) => {
    const updatedSocialLinks: SocialLinks = {
      ...profile.socialLinks,
      [platform]: value,
    };
    onFieldChange?.('socialLinks', updatedSocialLinks);
  };
  return (
    <View style={[styles.container, style]}>
      {/* Bio */}
      <ProfileField
        label="Bio"
        value={profile.bio}
        placeholder="Tell us about yourself..."
        editable={editable}
        showWhenEmpty={editable}
        multiline={true}
        numberOfLines={4}
        onChangeText={(text) => onFieldChange?.('bio', text)}
      />

      {/* Location - conditional display based on view mode */}
      {(viewMode === 'busy' || profile.location || editable) && (
        <ProfileField
          label="Location"
          value={profile.location}
          placeholder="Enter your location"
          editable={editable}
          showWhenEmpty={viewMode === 'busy' || editable}
          onChangeText={(text) => onFieldChange?.('location', text)}
        />
      )}

      {/* Social Links Section */}
      {(viewMode === 'busy' || profile.socialLinks || profile.website || editable) && (
        <View style={styles.linksSection}>
          <View style={styles.linksSectionHeader}>
            {/* Links header could be added here if needed */}
          </View>
          
          {/* Instagram */}
          {(viewMode === 'busy' || profile.socialLinks?.instagram || editable) && (
            <ProfileField
              label="Instagram"
              value={profile.socialLinks?.instagram}
              placeholder="Enter Instagram username"
              editable={editable}
              showWhenEmpty={viewMode === 'busy' || editable}
              keyboardType="default"
              autoCapitalize="none"
              icon="instagram"
              onChangeText={(text) => handleSocialLinkChange('instagram', text)}
            />
          )}
          
          {/* X (Twitter) */}
          {(viewMode === 'busy' || profile.socialLinks?.x || editable) && (
            <ProfileField
              label="X (Twitter)"
              value={profile.socialLinks?.x}
              placeholder="Enter X username"
              editable={editable}
              showWhenEmpty={viewMode === 'busy' || editable}
              keyboardType="default"
              autoCapitalize="none"
              icon="twitter"
              onChangeText={(text) => handleSocialLinkChange('x', text)}
            />
          )}
          
          {/* Spotify */}
          {(viewMode === 'busy' || profile.socialLinks?.spotify || editable) && (
            <ProfileField
              label="Spotify"
              value={profile.socialLinks?.spotify}
              placeholder="Enter Spotify profile URL"
              editable={editable}
              showWhenEmpty={viewMode === 'busy' || editable}
              keyboardType="url"
              autoCapitalize="none"
              icon="music"
              onChangeText={(text) => handleSocialLinkChange('spotify', text)}
            />
          )}
          
          {/* Facebook */}
          {(viewMode === 'busy' || profile.socialLinks?.facebook || editable) && (
            <ProfileField
              label="Facebook"
              value={profile.socialLinks?.facebook}
              placeholder="Enter Facebook username"
              editable={editable}
              showWhenEmpty={viewMode === 'busy' || editable}
              keyboardType="default"
              autoCapitalize="none"
              icon="facebook"
              onChangeText={(text) => handleSocialLinkChange('facebook', text)}
            />
          )}
          
          {/* Website - kept for general website links */}
          {(viewMode === 'busy' || profile.website || profile.socialLinks?.website || editable) && (
            <ProfileField
              label="Website"
              value={profile.socialLinks?.website || profile.website}
              placeholder="Enter your website URL"
              editable={editable}
              showWhenEmpty={viewMode === 'busy' || editable}
              keyboardType="url"
              autoCapitalize="none"
              icon="globe"
              onChangeText={(text) => handleSocialLinkChange('website', text)}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[5],
    paddingTop: 40, // Reduced space since no prominent display
  },
  linksSection: {
    marginTop: spacing[4],
  },
  linksSectionHeader: {
    marginBottom: spacing[2],
  },
});

export default ProfileFieldsGroup;