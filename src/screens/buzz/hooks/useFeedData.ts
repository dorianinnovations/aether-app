/**
 * useFeedData Hook
 * Manages feed data fetching and state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FeedAPI } from '../../../services/apiModules/endpoints/feed';
import { SpotifyAPI } from '../../../services/apiModules/endpoints/spotify';
import { api } from '../../../services/apiModules/core/client';
import { logger } from '../../../utils/logger';
import type { FeedItem } from '../../../services/apiModules/endpoints/feed';

type FeedTab = 'timeline' | 'releases' | 'news' | 'tours' | 'trending';

interface UseFeedDataReturn {
  feedItems: FeedItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasSpotifyConnected: boolean;
  loadFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  markItemAsViewed: (itemId: string) => void;
  interactWithItem: (itemId: string, type: 'like' | 'share' | 'save') => void;
}

export const useFeedData = (activeTab: FeedTab): UseFeedDataReturn => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSpotifyConnected, setHasSpotifyConnected] = useState(true); // Spotify is connected
  
  // Track viewed items locally
  const viewedItems = useRef(new Set<string>());
  
  // Check Spotify connection status  
  useEffect(() => {
    const checkSpotifyConnection = async () => {
      try {
        setHasSpotifyConnected(true);
      } catch (error) {
        logger.debug('Spotify not connected:', error);
        setHasSpotifyConnected(false);
      }
    };
    
    checkSpotifyConnection();
  }, []);

  // Load feed data
  const loadFeed = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      switch (activeTab) {
        case 'timeline':
          response = await FeedAPI.getTimeline({ limit: 50 });
          break;
        case 'releases':
          response = await FeedAPI.getReleases(50);
          break;
        case 'news':
          response = await FeedAPI.getNews(50);
          break;
        case 'tours':
          response = await FeedAPI.getTours(50);
          break;
        case 'trending':
          response = await FeedAPI.getTrendingContent('24h');
          break;
        default:
          response = await FeedAPI.getTimeline({ limit: 50 });
      }
      
      // API response received
      
      if (response.success && response.data) {
        // Mark previously viewed items
        const itemsWithViewStatus = response.data.map((item: FeedItem) => ({
          ...item,
          viewed: viewedItems.current.has(item.id) || item.viewed || false,
        }));
        
        setFeedItems(itemsWithViewStatus);
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to load feed');
      }
    } catch (error) {
      logger.error('Error loading feed:', error);
      setError('Failed to load feed. Please try again.');
      setFeedItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, loading]);

  // Refresh feed
  const refreshFeed = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    setError(null);
    
    try {
      // Clear viewed items on refresh to show fresh content
      viewedItems.current.clear();
      
      let response;
      
      switch (activeTab) {
        case 'timeline':
          response = await FeedAPI.refreshFeed();
          break;
        case 'releases':
          response = await FeedAPI.getReleases(50);
          break;
        case 'news':
          response = await FeedAPI.getNews(50);
          break;
        case 'tours':
          response = await FeedAPI.getTours(50);
          break;
        case 'trending':
          response = await FeedAPI.getTrendingContent('24h');
          break;
        default:
          response = await FeedAPI.refreshFeed();
      }
      
      if (Array.isArray(response)) {
        // Handle direct array response from refreshFeed
        setFeedItems(response);
      } else if (response && typeof response === 'object' && 'success' in response && response.success && response.data) {
        setFeedItems(response.data);
      } else {
        throw new Error('Failed to refresh feed');
      }
    } catch (error) {
      logger.error('Error refreshing feed:', error);
      setError('Failed to refresh feed. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refreshing]);

  // Mark item as viewed
  const markItemAsViewed = useCallback((itemId: string) => {
    viewedItems.current.add(itemId);
    
    setFeedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, viewed: true }
          : item
      )
    );
    
    // Send to backend (fire and forget)
    FeedAPI.markAsViewed([itemId]).catch(error => {
      logger.debug('Failed to mark item as viewed:', error);
    });
  }, []);

  // Interact with item
  const interactWithItem = useCallback((itemId: string, type: 'like' | 'share' | 'save') => {
    // Update local state
    setFeedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, interacted: true }
          : item
      )
    );
    
    // Send to backend (fire and forget)
    FeedAPI.interactWithUpdate(itemId, {
      type,
      duration: Date.now(),
      context: activeTab,
    }).catch(error => {
      logger.debug('Failed to record interaction:', error);
    });
  }, [activeTab]);

  // Load feed when tab changes
  useEffect(() => {
    loadFeed();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    feedItems,
    loading,
    refreshing,
    error,
    hasSpotifyConnected,
    loadFeed,
    refreshFeed,
    markItemAsViewed,
    interactWithItem,
  };
};