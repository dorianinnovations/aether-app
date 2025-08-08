/**
 * ProfileHeader Molecule
 * Composite component combining banner, profile image, and online status
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { BannerImage, ProfileImage, OnlineStatus, OnlineStatusType } from '../atoms';
import { spacing } from '../../tokens/spacing';

export interface ProfileHeaderProps {
  /** Profile image URI */
  profileImageUri?: string | null;
  /** Banner image URI */
  bannerImageUri?: string | null;
  /** Whether images are editable */
  editable?: boolean;
  /** Whether upload is in progress */
  uploading?: boolean;
  /** Online status */
  status?: OnlineStatusType;
  /** Custom status message */
  statusMessage?: string;
  /** Show detailed status */
  showDetailedStatus?: boolean;
  /** Banner height */
  bannerHeight?: number;
  /** Profile image size */
  profileImageSize?: 'small' | 'medium' | 'large' | 'xlarge';
  /** Callbacks */
  onProfileImagePress?: () => void;
  onBannerPress?: () => void;
  onDeleteProfileImage?: () => void;
  onDeleteBanner?: () => void;
  /** Custom styles */
  style?: ViewStyle;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileImageUri,
  bannerImageUri,
  editable = false,
  uploading = false,
  status = 'online',
  statusMessage,
  showDetailedStatus = false,
  bannerHeight = 200,
  profileImageSize = 'large',
  onProfileImagePress,
  onBannerPress,
  onDeleteProfileImage,
  onDeleteBanner,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Banner Image */}
      <BannerImage
        imageUri={bannerImageUri}
        height={bannerHeight}
        editable={editable}
        uploading={uploading}
        onPress={onBannerPress}
        showDeleteButton={editable}
        onDelete={onDeleteBanner}
      >
        {/* Online Status Indicator */}
        <OnlineStatus
          status={status}
          statusMessage={statusMessage}
          showDetails={showDetailedStatus}
          size="medium"
          position="absolute"
          positioning={{
            bottom: -48,
            right: spacing[5],
          }}
        />

        {/* Profile Image Container */}
        <View style={styles.profileImageContainer}>
          <ProfileImage
            imageUri={profileImageUri}
            size={profileImageSize}
            editable={editable}
            uploading={uploading}
            onPress={onProfileImagePress}
            showDeleteButton={editable}
            onDelete={onDeleteProfileImage}
          />
        </View>
      </BannerImage>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing[4],
    position: 'relative',
    overflow: 'visible',
    zIndex: 1,
  },
  profileImageContainer: {
    position: 'absolute',
    bottom: -60,
    left: spacing[5],
    zIndex: 100,
    elevation: 10,
  },
});

export default ProfileHeader;