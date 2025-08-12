/**
 * ProfileFieldsGroup Molecule
 * Composite component for grouping and managing profile fields
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TextInput,
} from 'react-native';
import { ProfileField, ProfileFieldType, SocialLinksBar } from '../atoms';
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
  /** Callback when input is focused */
  onInputFocus?: (inputRef: TextInput) => void;
  /** Custom styles */
  style?: ViewStyle;
}

export const ProfileFieldsGroup: React.FC<ProfileFieldsGroupProps> = ({
  profile,
  editable = false,
  viewMode = 'basic',
  onFieldChange,
  onInputFocus,
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
      {/* Display Name */}
      <ProfileField
        label="Display Name"
        value={profile.displayName}
        fieldType="displayName"
        editable={editable}
        showWhenEmpty={editable}
        onChangeText={(text) => onFieldChange?.('displayName', text)}
        onInputFocus={onInputFocus}
      />

      {/* Bio */}
      <ProfileField
        label="Bio"
        value={profile.bio}
        fieldType="bio"
        editable={editable}
        showWhenEmpty={editable}
        multiline={true}
        numberOfLines={4}
        onChangeText={(text) => onFieldChange?.('bio', text)}
        onInputFocus={onInputFocus}
      />

      {/* Location - conditional display based on view mode */}
      {(viewMode === 'busy' || profile.location || editable) && (
        <ProfileField
          label="Location"
          value={profile.location}
          fieldType="location"
          editable={editable}
          showWhenEmpty={viewMode === 'busy' || editable}
          onChangeText={(text) => onFieldChange?.('location', text)}
          onInputFocus={onInputFocus}
        />
      )}

      {/* Social Links - Compact Bar or Edit Fields */}
      {editable ? (
        // Show individual fields in edit mode
        (viewMode === 'busy' || profile.socialLinks || profile.website || editable) && (
          <View style={styles.linksSection}>
            {/* Instagram */}
            {(viewMode === 'busy' || profile.socialLinks?.instagram || editable) && (
              <ProfileField
                label="Instagram"
                value={profile.socialLinks?.instagram}
                fieldType="instagram"
                editable={editable}
                showWhenEmpty={viewMode === 'busy' || editable}
                onChangeText={(text) => handleSocialLinkChange('instagram', text)}
                onInputFocus={onInputFocus}
              />
            )}
            
            {/* X (Twitter) */}
            {(viewMode === 'busy' || profile.socialLinks?.x || editable) && (
              <ProfileField
                label="X (Twitter)"
                value={profile.socialLinks?.x}
                fieldType="twitter"
                editable={editable}
                showWhenEmpty={viewMode === 'busy' || editable}
                onChangeText={(text) => handleSocialLinkChange('x', text)}
                onInputFocus={onInputFocus}
              />
            )}
            
            {/* Spotify */}
            {(viewMode === 'busy' || profile.socialLinks?.spotify || editable) && (
              <ProfileField
                label="Spotify"
                value={profile.socialLinks?.spotify}
                fieldType="spotify"
                editable={editable}
                showWhenEmpty={viewMode === 'busy' || editable}
                onChangeText={(text) => handleSocialLinkChange('spotify', text)}
                onInputFocus={onInputFocus}
              />
            )}
            
            {/* Facebook */}
            {(viewMode === 'busy' || profile.socialLinks?.facebook || editable) && (
              <ProfileField
                label="Facebook"
                value={profile.socialLinks?.facebook}
                fieldType="facebook"
                editable={editable}
                showWhenEmpty={viewMode === 'busy' || editable}
                onChangeText={(text) => handleSocialLinkChange('facebook', text)}
                onInputFocus={onInputFocus}
              />
            )}
            
            {/* Website */}
            {(viewMode === 'busy' || profile.website || profile.socialLinks?.website || editable) && (
              <ProfileField
                label="Website"
                value={profile.socialLinks?.website || profile.website}
                fieldType="url"
                editable={editable}
                showWhenEmpty={viewMode === 'busy' || editable}
                onChangeText={(text) => handleSocialLinkChange('website', text)}
                onInputFocus={onInputFocus}
              />
            )}
          </View>
        )
      ) : (
        // Show compact social links bar in view mode
        <SocialLinksBar
          socialLinks={{
            ...profile.socialLinks,
            website: profile.socialLinks?.website || profile.website
          }}
          style={styles.socialLinksBar}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[5],
    paddingTop: 40, // Reduced space since no prominent display
    position: 'relative',
  },
  linksSection: {
    marginTop: spacing[4],
  },
  linksSectionHeader: {
    marginBottom: spacing[2],
  },
  socialLinksBar: {
    position: 'absolute',
    right: spacing[3],
    top: spacing[6],
    zIndex: 1,
  },
});

export default ProfileFieldsGroup;