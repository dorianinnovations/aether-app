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

export interface UserProfile {
  email: string;
  username?: string;
  displayName?: string;
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
    paddingTop: 40, // Reduced space since no prominent display
  },
});

export default ProfileFieldsGroup;