/**
 * Social Screen Utilities
 * Helper functions for social platform functionality
 */

import { COMMUNITY_COLORS } from '../constants';
import type { NewsPost } from '../types';

/**
 * Get community color by ID
 */
export const getCommunityColor = (communityId?: string): string => {
  if (!communityId) return COMMUNITY_COLORS.default;
  return COMMUNITY_COLORS[communityId as keyof typeof COMMUNITY_COLORS] || COMMUNITY_COLORS.default;
};

/**
 * Filter news posts by search query
 */
export const filterPosts = (posts: NewsPost[], query: string): NewsPost[] => {
  if (!query.trim()) return posts;
  
  const searchTerm = query.toLowerCase();
  return posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchTerm) ||
      post.title.toLowerCase().includes(searchTerm) ||
      post.category?.toLowerCase().includes(searchTerm) ||
      post.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
  );
};

/**
 * Sort news posts by timestamp (newest first)
 */
export const sortPostsByTimestamp = (posts: NewsPost[]): NewsPost[] => {
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
 * Generate mock news posts for testing
 */
export const generateMockPosts = (count: number = 10): NewsPost[] => {
  const mockPosts: NewsPost[] = [];
  const communities = ['general', 'tech', 'creative', 'wellness', 'learning'];
  const userNames = ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Eve Brown'];
  
  for (let i = 0; i < count; i++) {
    const category = communities[Math.floor(Math.random() * communities.length)];
    const priorities: NewsPost['priority'][] = ['low', 'medium', 'high', 'urgent'];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    mockPosts.push({
      id: `news-${i + 1}`,
      title: `News Update ${i + 1}`,
      content: `This is a sample news content for demonstration purposes. News item ${i + 1} in the ${category} category.`,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority,
      category,
      tags: [`tag${i % 3 + 1}`, `category${i % 2 + 1}`],
    });
  }
  
  return sortPostsByTimestamp(mockPosts);
};
