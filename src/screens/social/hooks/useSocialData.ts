/**
 * Social Data Hook
 * Manages posts loading, caching, and auto-refresh functionality
 */

import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../types';
import { generateMockPosts } from '../utils';

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
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, use mock data - replace with actual API call
      const mockPosts = generateMockPosts(20);
      setPosts(mockPosts);
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
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // For now, use mock data - replace with actual API call
      const mockPosts = generateMockPosts(20);
      setPosts(mockPosts);
    } catch (err) {
      setError('Failed to refresh posts');
      console.error('Error refreshing posts:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const addPost = useCallback((post: Post) => {
    setPosts(prevPosts => [post, ...prevPosts]);
  }, []);

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
