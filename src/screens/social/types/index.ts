/**
 * Social Screen Types
 * TypeScript interfaces for social platform components
 */

// Import types from main types file
import type { NewsPost, Community, SocialTab } from '../../../types/social';

// Re-export for convenience
export type { NewsPost, Community, SocialTab };

export interface SocialScreenProps {
  navigation: any;
}

export interface TabPillsProps {
  activeTab: SocialTab;
  onTabPress: (tab: SocialTab) => void;
}

export interface NewsCardProps {
  post: NewsPost;
}

export interface NewsFeedProps {
  posts: NewsPost[];
  loading: boolean;
  onRefresh: () => void;
}

export interface CommunityChipProps {
  community: Community;
  selected?: boolean;
  onPress: (community: Community) => void;
}
