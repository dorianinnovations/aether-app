/**
 * Social Screen Types
 * TypeScript interfaces for social platform components
 */

// Import types from main types file
import type { Post, Comment, Community, CreatePostData, CreateCommentData, SocialTab } from '../../../types/social';

// Re-export for convenience
export type { Post, Comment, Community, CreatePostData, CreateCommentData, SocialTab };

export interface SocialScreenProps {
  navigation: any;
}

export interface TabPillsProps {
  activeTab: SocialTab;
  onTabPress: (tab: SocialTab) => void;
}

export interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}

export interface PostsFeedProps {
  posts: Post[];
  loading: boolean;
  onRefresh: () => void;
  onPostPress: (post: Post) => void;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}

export interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePostData) => void;
}

export interface CommunityChipProps {
  community: Community;
  selected?: boolean;
  onPress: (community: Community) => void;
}
