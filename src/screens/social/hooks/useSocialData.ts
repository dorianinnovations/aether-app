/**
 * Social Data Hook
 * Manages posts loading, caching, and auto-refresh functionality
 */

import { useState, useEffect, useCallback } from 'react';
import type { NewsPost } from '../types';
import { generateMockPosts } from '../utils';
import { SocialProxyAPI } from '../../../services/apiModules/endpoints/social';

export interface UseSocialDataReturn {
  posts: NewsPost[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  fetchNewsPosts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  addPost: (post: NewsPost) => void;
  updatePost: (postId: string, updates: Partial<NewsPost>) => void;
  removePost: (postId: string) => void;
}

export const useSocialData = (): UseSocialDataReturn => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNewsPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch real timeline data from API
        const response = await SocialProxyAPI.getTimeline(1, 20);
        if (response.success && response.data && Array.isArray(response.data)) {
          // Transform API response to NewsPost format if needed
          const transformedNewsPosts: NewsPost[] = response.data.map((item: any, index: number) => ({
            id: item.id || `api-post-${index}`,
            userId: item.userId || item.user?.id || `user-${index}`,
            userName: item.userName || item.user?.username || item.user?.name || `User ${index}`,
            content: item.content || item.text || item.message || 'No content',
            communityId: item.communityId || 'general',
            communityName: item.communityName || 'General',
            likes: item.likes || item.likeCount || 0,
            comments: item.comments || item.commentCount || 0,
            shares: item.shares || item.shareCount || 0,
            timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
            isLiked: item.isLiked || false,
            tags: item.tags || [],
          }));
          setPosts(transformedNewsPosts);
        } else {
          // Fallback to mock data if API returns empty or invalid data
          const mockNewsPosts = generateMockPosts(20);
          setPosts(mockNewsPosts);
        }
      } catch (apiError) {
        // If API fails, fall back to mock data
        const mockNewsPosts = generateMockPosts(20);
        setPosts(mockNewsPosts);
      }
    } catch (err) {
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPosts = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      try {
        // Try to fetch real timeline data from API
        const response = await SocialProxyAPI.getTimeline(1, 20);
        if (response.success && response.data && Array.isArray(response.data)) {
          // Transform API response to NewsPost format if needed
          const transformedNewsPosts: NewsPost[] = response.data.map((item: any, index: number) => ({
            id: item.id || `api-post-${index}`,
            userId: item.userId || item.user?.id || `user-${index}`,
            userName: item.userName || item.user?.username || item.user?.name || `User ${index}`,
            content: item.content || item.text || item.message || 'No content',
            communityId: item.communityId || 'general',
            communityName: item.communityName || 'General',
            likes: item.likes || item.likeCount || 0,
            comments: item.comments || item.commentCount || 0,
            shares: item.shares || item.shareCount || 0,
            timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
            isLiked: item.isLiked || false,
            tags: item.tags || [],
          }));
          setPosts(transformedNewsPosts);
        } else {
          // Fallback to mock data if API returns empty or invalid data
          const mockNewsPosts = generateMockPosts(20);
          setPosts(mockNewsPosts);
        }
      } catch (apiError) {
        // If API fails, fall back to mock data
        const mockNewsPosts = generateMockPosts(20);
        setPosts(mockNewsPosts);
      }
    } catch (err) {
      setError('Failed to refresh posts');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const addPost = useCallback(async (post: NewsPost) => {
    try {
      // Try to post to real API if it's a status update
      if (post.content && post.content.trim()) {
        try {
          await SocialProxyAPI.updateStatus(post.content.trim(), '', 'excited'); // Default status and mood
        } catch (apiError) {
        }
      }
      
      // Always add to local state for immediate UI update
      setPosts(prevNewsPosts => [post, ...prevNewsPosts]);
      
      // Refresh posts to get latest from server (including the one we just posted)
      setTimeout(() => {
        refreshPosts();
      }, 1000);
    } catch (err) {
      // Still add locally even if API fails
      setPosts(prevNewsPosts => [post, ...prevNewsPosts]);
    }
  }, [refreshPosts]);

  const updatePost = useCallback((postId: string, updates: Partial<NewsPost>) => {
    setPosts(prevNewsPosts =>
      prevNewsPosts.map(post =>
        post.id === postId ? { ...post, ...updates } : post
      )
    );
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts(prevNewsPosts => prevNewsPosts.filter(post => post.id !== postId));
  }, []);

  // Initial load
  useEffect(() => {
    fetchNewsPosts();
  }, [fetchNewsPosts]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        refreshPosts();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loading, refreshing, refreshPosts]);

  return {
    posts,
    loading,
    error,
    refreshing,
    fetchNewsPosts,
    refreshPosts,
    addPost,
    updatePost,
    removePost,
  };
};
