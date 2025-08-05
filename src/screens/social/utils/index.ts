/**
 * Social Screen Utilities
 * Helper functions for social platform functionality
 */

import { COMMUNITY_COLORS } from '../constants';
import type { Post } from '../types';

/**
 * Get community color by ID
 */
export const getCommunityColor = (communityId?: string): string => {
  if (!communityId) return COMMUNITY_COLORS.default;
  return COMMUNITY_COLORS[communityId as keyof typeof COMMUNITY_COLORS] || COMMUNITY_COLORS.default;
};

/**
 * Filter posts by search query
 */
export const filterPosts = (posts: Post[], query: string): Post[] => {
  if (!query.trim()) return posts;
  
  const searchTerm = query.toLowerCase();
  return posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchTerm) ||
      post.userName.toLowerCase().includes(searchTerm) ||
      post.communityName?.toLowerCase().includes(searchTerm) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};

/**
 * Sort posts by timestamp (newest first)
 */
export const sortPostsByTimestamp = (posts: Post[]): Post[] => {
  return [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

/**
 * Format post timestamp for display
 */
export const formatPostTimestamp = (timestamp: string): string => {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  
  return postTime.toLocaleDateString();
};

/**
 * Truncate post content for preview
 */
export const truncateContent = (content: string, maxLength: number = 150): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
};

/**
 * Generate mock posts for testing
 */
export const generateMockPosts = (count: number = 10): Post[] => {
  const mockPosts: Post[] = [];
  const communities = ['general', 'tech', 'creative', 'wellness', 'learning'];
  const userNames = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eve Brown'];
  
  for (let i = 0; i < count; i++) {
    const communityId = communities[Math.floor(Math.random() * communities.length)];
    const userName = userNames[Math.floor(Math.random() * userNames.length)];
    
    mockPosts.push({
      id: `post-${i + 1}`,
      userId: `user-${Math.floor(Math.random() * 5) + 1}`,
      userName,
      content: `This is a sample post content for demonstration purposes. Post number ${i + 1} in the ${communityId} community.`,
      communityId,
      communityName: communityId.charAt(0).toUpperCase() + communityId.slice(1),
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 50),
      shares: Math.floor(Math.random() * 25),
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      isLiked: Math.random() > 0.7,
      tags: [`tag${i % 3 + 1}`, `category${i % 2 + 1}`],
    });
  }
  
  return sortPostsByTimestamp(mockPosts);
};
