/**
 * PostCard Component
 * Handles individual post rendering with all customization logic
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Types
import type { Post } from '../../../services/postsApi';
import type { CardPreferences, ProfileMockup, ProfileData, EngagementData, EngagementActions } from './types';

// Components
import { ProfileSection } from './ProfileSection';
import { EngagementSection } from './EngagementSection';

// Hooks
import { useTheme } from '../../../hooks/useTheme';

// Tokens
import { getThemeColors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';

interface PostCardProps {
  post: Post;
  profile: ProfileMockup;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  profile,
  onLike,
  onComment,
  onShare
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const { preferences } = profile;

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

  return (
    <View style={[styles.premiumCard, { 
      backgroundColor: themeColors.surface,
      borderColor: themeColors.borders.default,
      borderRadius: preferences.cardCornerRadius,
      marginVertical: preferences.layout === 'minimal' ? spacing[2] : spacing[4],
    }]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  premiumCard: {
    marginHorizontal: spacing[4],
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  premiumHeader: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
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
});