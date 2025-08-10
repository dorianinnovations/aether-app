/**
 * ProfileHeader Molecule
 * Composite component combining banner, profile image, and online status
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BannerImage, ProfileImage, OnlineStatus, OnlineStatusType } from '../atoms';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing } from '../../tokens/spacing';
import { typography } from '../../tokens/typography';

export interface ProfileHeaderProps {
  /** Profile image URI */
  profileImageUri?: string | null;
  /** Banner image URI */
  bannerImageUri?: string | null;
  /** Username */
  username?: string;
  /** Display name */
  displayName?: string;
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
  /** Callback when configure button is pressed */
  onConfigurePress?: () => void;
  /** Whether configure mode is active */
  configureMode?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileImageUri,
  bannerImageUri,
  username,
  displayName,
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
  onConfigurePress,
  configureMode = false,
  style,
}) => {
  const { colors, theme } = useTheme();

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

        {/* Username Display - positioned to the right of profile image */}
        {username && (
          <View style={styles.usernameContainer}>
            {displayName && (
              <Text
                style={[styles.displayName, { color: colors.text }]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {displayName}
              </Text>
            )}
            <View style={styles.usernameRowContainer}>
              <View style={[styles.usernameBox, { 
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
                borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)'
              }]}>
                <View style={styles.usernameRow}>
                  <View style={styles.onlineDot} />
                  <Text
                    style={[styles.username, typography.textStyles.username, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {username}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.configButton}
                onPress={onConfigurePress}
                activeOpacity={0.6}
              >
                <Feather 
                  name="chevron-down" 
                  size={16} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  usernameContainer: {
    position: 'absolute',
    bottom: -60,
    left: 160, // Positioned to the right of the profile image
    right: spacing[5],
    zIndex: 99,
    paddingVertical: spacing[2],
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: spacing[1],
  },
  usernameRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing[1],
  },
  usernameBox: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  configButton: {
    padding: spacing[1],
    justifyContent: 'center',
    alignItems: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff00',
  },
  username: {
    // Font styling now handled by typography.textStyles.username
  },
});

export default ProfileHeader;