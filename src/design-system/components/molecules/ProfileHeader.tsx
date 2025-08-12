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
import { BannerImage, ProfileImage, OnlineStatusType, UserBadge, UserBadgeType, InteractiveBadge, PrestigiousBadge, mapDatabaseBadgeToPrestigious } from '../atoms';
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
  /** User badges */
  badges?: Array<{
    id: string;
    badgeType: UserBadgeType;
    isVisible: boolean;
  }>;
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
  /** Friends count */
  friendsCount?: number;
  /** Followers count */
  followersCount?: number;
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
  /** Callback when username is pressed */
  onUsernamePress?: () => void;
  /** Whether to show grip bar overlay */
  showGripBar?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profileImageUri,
  bannerImageUri,
  username,
  displayName,
  badges,
  editable = false,
  uploading = false,
  bannerHeight = 200,
  profileImageSize = 'large',
  friendsCount,
  followersCount,
  onProfileImagePress,
  onBannerPress,
  onDeleteProfileImage,
  onDeleteBanner,
  onUsernamePress,
  showGripBar = false,
  style,
}) => {
  const { colors, theme } = useTheme();
  
  // Custom subtle glassmorphism for profile stats
  const subtleGlassStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.15)',
    borderWidth: 0.5,
    borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
    backdropFilter: 'blur(10px)',
  };

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
        addBottomFade={true}
        theme={theme}
      >
        {/* Grip Bar Overlay */}
        {showGripBar && (
          <View style={styles.gripBarOverlay}>
            <View style={[styles.gripHandle, { backgroundColor: colors.borders.default }]} />
          </View>
        )}

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
            {/* Username centered */}
            <View style={styles.usernameDisplayContainer}>
              <Text
                style={[styles.usernameText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {username}
              </Text>
            </View>
            
            {/* Accolades/Badges under username */}
            {badges && badges.length > 0 && (
              <View style={styles.accoladesContainer}>
                {badges
                  .filter(badge => badge.isVisible)
                  .map(badge => {
                    const displayType = mapDatabaseBadgeToPrestigious(badge.badgeType);
                    
                    // Show prestigious badges (VIP and LEGEND) if they exist
                    if (displayType) {
                      return (
                        <PrestigiousBadge 
                          key={badge.id}
                          badgeKey={badge.id}
                          type={displayType}
                          theme={theme}
                          showTooltip={true}
                          size="small"
                        />
                      );
                    }
                    
                    // Show standard badges for all other types
                    return (
                      <UserBadge 
                        key={badge.id}
                        type={badge.badgeType}
                        theme={theme}
                        visible={true}
                      />
                    );
                  })}
              </View>
            )}
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
    bottom: -50,
    left: spacing[3], // Moved further left
    zIndex: 100,
    elevation: 10,
  },
  usernameContainer: {
    position: 'absolute',
    bottom: -60, // Adjusted to -60
    left: 150, // Adjusted to 150
    right: spacing[3],
    zIndex: 1002,
    elevation: 1002,
    paddingVertical: spacing[2],
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: spacing[1],
  },
  accoladesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing[1] * 0.5,
    flexWrap: 'wrap',
    marginTop: spacing[1],
    zIndex: 1001,
    elevation: 1001,
  },
  usernameRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing[1],
  },
  usernameBox: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 6,
    minWidth: 75,
    minHeight: 26,
    overflow: 'visible',
    flex: 0,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  onlineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00ff00',
  },
  username: {
    // Font styling now handled by typography.textStyles.username
  },
  usernameDisplayContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: spacing[1],
    minHeight: 26,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  socialStats: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  socialStatItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 6,
    minWidth: 75,
    minHeight: 26,
    overflow: 'visible',
    flex: 0,
  },
  socialStatCount: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  socialStatLabel: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 13,
    opacity: 0.8,
  },
  gripBarOverlay: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  gripHandle: {
    width: 100,
    height: 3,
    borderRadius: 2,
    opacity: 0.7,
  },
});

export default ProfileHeader;