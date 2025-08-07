/**
 * PostCard Component
 * Handles individual post rendering with all customization logic
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Types
import type { Post } from '../../../services/postsApi';
import type { CardPreferences, ProfileMockup, ProfileData, EngagementData, EngagementActions } from './types';

// Components
import { ProfileSection } from './ProfileSection';
import { EngagementSection } from './EngagementSection';

// Hooks
import { useTheme } from '../../../contexts/ThemeContext';
import { authService } from '../../../services/authService';

// Tokens
import { getThemeColors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';

interface PostCardProps {
  post: Post;
  profile: ProfileMockup;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  profile,
  onLike,
  onComment,
  onShare,
  onDelete
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const { preferences } = profile;
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  
  // Get current user to check if they can delete the post
  const currentUser = authService.getCurrentUser();

  // Get dynamic text sizes based on preferences
  const getTextSize = (base: number) => {
    switch (preferences.textSize) {
      case 'small': return base - 2;
      case 'large': return base + 2;
      default: return base;
    }
  };

  // Create profile data for ProfileSection
  const profileData: ProfileData = {
    name: profile.name,
    avatar: profile.avatar,
    relationship: profile.relationship,
    relationshipDetail: profile.relationshipDetail,
    location: profile.location,
    color: profile.color
  };

  // Create engagement data for EngagementSection
  const engagementData: EngagementData = {
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    sharesCount: post.sharesCount,
    userHasLiked: post.userHasLiked,
    engagement: post.engagement as 'high' | 'medium' | 'low'
  };

  // Create engagement actions
  const engagementActions: EngagementActions = {
    onLike: onLike ? () => onLike(post.id) : undefined,
    onComment: onComment ? () => onComment(post.id) : undefined,
    onShare: onShare ? () => onShare(post.id) : undefined,
  };

  // Determine if content has mood indicators
  const getMoodIndicator = () => {
    const content = post.title.toLowerCase();
    
    if (content.includes('🎉') || content.includes('✨') || content.includes('🌟') || content.includes('celebrating')) {
      return { label: 'Celebrating', color: profile.color };
    }
    
    if (content.includes('💪') || content.includes('🏆') || content.includes('crushed') || content.includes('achievement')) {
      return { label: 'Achievement', color: '#10B981' };
    }
    
    if (content.includes('🎨') || content.includes('🎭') || content.includes('incredible') || content.includes('creative')) {
      return { label: 'Creative', color: '#8B5CF6' };
    }
    
    return null;
  };

  const moodIndicator = getMoodIndicator();

  // Check if current user owns this post
  const isUserPost = currentUser?.username === post.author || profile.name === 'You';

  const handleDeletePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDeleteOptions(true);
    
    // Animate scale down for selection feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleConfirmDelete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowDeleteOptions(false);
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowDeleteOptions(false);
            onDelete?.(post.id);
          }
        }
      ]
    );
  };

  return (
    <Animated.View style={[
      styles.premiumCard, 
      { 
        backgroundColor: themeColors.surface,
        borderColor: isUserPost ? `${profile.color}40` : themeColors.borders.default,
        borderWidth: isUserPost ? 1.5 : 1,
        borderRadius: preferences.cardCornerRadius,
        marginVertical: preferences.layout === 'minimal' ? spacing[2] : spacing[4],
        transform: [{ scale: scaleAnim }],
        shadowColor: theme === 'dark' ? '#000000' : profile.color,
        shadowOpacity: theme === 'dark' ? 0.3 : 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: isUserPost ? 8 : 6,
      }
    ]}>
      {/* Header with profile */}
      <View style={[styles.premiumHeader, {
        backgroundColor: preferences.layout === 'magazine' ? `${profile.color}08` : 'transparent',
      }]}>
        <ProfileSection
          profile={profileData}
          preferences={preferences}
          showTimestamp={preferences.showTimestamp}
          timestamp={post.time}
        />
        
        {/* Delete button for user's own posts */}
        {isUserPost && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleDeletePress}
              style={[styles.deleteButton, {
                backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.2)',
              }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather 
                name="trash-2" 
                size={16} 
                color={theme === 'dark' ? '#FF6B6B' : '#DC2626'} 
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content with enhanced expressiveness */}
      <View style={[styles.premiumContent, {
        paddingHorizontal: preferences.layout === 'minimal' ? spacing[4] : spacing[6],
        paddingBottom: preferences.layout === 'minimal' ? spacing[4] : spacing[6],
      }]}>
        <Text style={[styles.contentText, {
          fontSize: getTextSize(16),
          lineHeight: getTextSize(preferences.textStyle === 'compact' ? 20 : preferences.textStyle === 'elegant' ? 26 : 24),
          fontFamily: preferences.textStyle === 'bold' ? 'Nunito-SemiBold' : 'Nunito-Regular',
          fontWeight: preferences.textStyle === 'bold' ? '600' : '400',
          color: themeColors.text,
        }]}>
          {post.title}
        </Text>
        
        {/* Add mood indicator based on content */}
        {moodIndicator && (
          <View style={[styles.moodIndicator, { backgroundColor: `${moodIndicator.color}15` }]}>
            <Text style={[styles.moodText, { color: moodIndicator.color }]}>
              {moodIndicator.label}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <EngagementSection
        data={engagementData}
        actions={engagementActions}
        preferences={preferences}
        accentColor={profile.color}
      />
      
      {/* User post indicator */}
      {isUserPost && (
        <View style={[styles.userPostIndicator, { backgroundColor: profile.color }]} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  premiumCard: {
    marginHorizontal: spacing[4],
    position: 'relative',
    overflow: 'hidden',
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  premiumContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  contentText: {
    // Styles are dynamic based on preferences
  },
  moodIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 12,
    marginTop: spacing[3],
  },
  moodText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  userPostIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 4,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});