/**
 * Social Data Hook
 * Manages posts loading, caching, and auto-refresh functionality
 */

import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../types';
import { generateMockPosts } from '../utils';
import { SocialProxyAPI } from '../../../services/apiModules/endpoints/social';

export interface UseSocialDataReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  fetchPosts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  addPost: (post: Post) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  removePost: (postId: string) => void;
}

export const useSocialData = (): UseSocialDataReturn => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch real timeline data from API
        const response = await SocialProxyAPI.getTimeline(1, 20);
        if (response.success && response.data && Array.isArray(response.data)) {
          // Transform API response to Post format if needed
          const transformedPosts: Post[] = response.data.map((item: any, index: number) => ({
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
          setPosts(transformedPosts);
        } else {
          // Fallback to mock data if API returns empty or invalid data
          console.log('API returned empty data, using mock posts');
          const mockPosts = generateMockPosts(20);
          setPosts(mockPosts);
        }
      } catch (apiError) {
        // If API fails, fall back to mock data
        console.log('API failed, using mock posts:', apiError);
        const mockPosts = generateMockPosts(20);
        setPosts(mockPosts);
      }
    } catch (err) {
      setError('Failed to fetch posts');
      console.error('Error fetching posts:', err);
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
          // Transform API response to Post format if needed
          const transformedPosts: Post[] = response.data.map((item: any, index: number) => ({
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
          setPosts(transformedPosts);
        } else {
          // Fallback to mock data if API returns empty or invalid data
          console.log('API returned empty data during refresh, using mock posts');
          const mockPosts = generateMockPosts(20);
          setPosts(mockPosts);
        }
      } catch (apiError) {
        // If API fails, fall back to mock data
        console.log('API failed during refresh, using mock posts:', apiError);
        const mockPosts = generateMockPosts(20);
        setPosts(mockPosts);
      }
    } catch (err) {
      setError('Failed to refresh posts');
      console.error('Error refreshing posts:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const addPost = useCallback(async (post: Post) => {
    try {
      // Try to post to real API if it's a status update
      if (post.content && post.content.trim()) {
        try {
          await SocialProxyAPI.updateStatus(post.content.trim(), '', 'excited'); // Default status and mood
          console.log('Posted status to API successfully');
        } catch (apiError) {
          console.log('Failed to post to API, adding locally:', apiError);
        }
      }
      
      // Always add to local state for immediate UI update
      setPosts(prevPosts => [post, ...prevPosts]);
      
      // Refresh posts to get latest from server (including the one we just posted)
      setTimeout(() => {
        refreshPosts();
      }, 1000);
    } catch (err) {
      console.error('Error adding post:', err);
      // Still add locally even if API fails
      setPosts(prevPosts => [post, ...prevPosts]);
    }
  }, [refreshPosts]);

  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, ...updates } : post
      )
    );
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
    fetchPosts,
    refreshPosts,
    addPost,
    updatePost,
    removePost,
  };
};
