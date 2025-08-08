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
import { UserBadge, UserBadgeType } from '../atoms/UserBadge';
import { spacing } from '../../tokens/spacing';

export interface UserProfile {
  email: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
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
  onFieldChange?: (field: keyof UserProfile, value: string) => void;
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
  return (
    <View style={[styles.container, style]}>
      {/* Username with badges */}
      {profile.username && (
        <ProfileField
          label="Username"
          value={`@${profile.username}`}
          editable={false} // Username typically not editable
          monospace={true}
          rightContent={
            <View style={styles.badgeContainer}>
              {profile.badges?.filter(badge => badge.isVisible).map((badge) => (
                <UserBadge
                  key={badge.id}
                  type={badge.badgeType}
                  style={styles.badge}
                  glowIntensity="medium"
                />
              ))}
            </View>
          }
        />
      )}

      {/* Email */}
      <ProfileField
        label="Email"
        value={profile.email}
        editable={false} // Email typically not editable in profile
      />

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

      {/* Website - conditional display based on view mode */}
      {(viewMode === 'busy' || profile.website || editable) && (
        <ProfileField
          label="Website"
          value={profile.website}
          placeholder="Enter your website URL"
          editable={editable}
          showWhenEmpty={viewMode === 'busy' || editable}
          keyboardType="url"
          autoCapitalize="none"
          onChangeText={(text) => onFieldChange?.('website', text)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[5],
    paddingTop: 80, // Space for profile image overlap
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  badge: {
    // Badge styles handled by UserBadge component
  },
});

export default ProfileFieldsGroup;