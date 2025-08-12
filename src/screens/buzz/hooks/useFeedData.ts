/**
 * useFeedData Hook
 * Manages artist news and live activity data for buzz screen
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../../../utils/logger';
import { buzzService, NewsArticle, LiveTrack, RecentTrack } from '../../../services/buzz';

// Enhanced FeedItem interface that combines news and activity data
export interface FeedItem {
  id: string;
  type: 'news' | 'live-activity' | 'recent-activity';
  title: string;
  content: string;
  url?: string;
  imageUrl?: string | null;
  publishedAt: string;
  source: string;
  viewed?: boolean;
  interacted?: boolean;
  priority: 'low' | 'medium' | 'high';
  // News specific
  artist?: string;
  category?: string;
  description?: string;
  // Activity specific
  track?: {
    name: string;
    artist: string;
    album: string;
    isPlaying?: boolean;
    progressMs?: number;
    durationMs?: number;
    spotifyUrl: string;
  };
  username?: string;
  timeAgo?: string;
}

type FeedTab = 'looped' | 'releases' | 'custom';

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
        logger.info('Checking Spotify connection...');
        const status = await buzzService.getMySpotifyStatus();
        logger.info('Spotify status received:', { 
          success: status.success, 
          connected: status.data?.connected,
          hasValidToken: status.data?.hasValidToken 
        });
        setHasSpotifyConnected(status.success && status.data.connected);
      } catch (error) {
        logger.debug('Spotify connection check failed:', error);
        setHasSpotifyConnected(false);
      }
    };
    
    checkSpotifyConnection();
  }, []);

  // Helper function to convert NewsArticle to FeedItem with source-specific rendering
  const newsToFeedItem = (article: NewsArticle): FeedItem => {
    const baseItem: FeedItem = {
      id: article.id,
      type: 'news',
      title: article.title,
      content: article.description,
      url: article.url,
      imageUrl: article.imageUrl,
      publishedAt: article.publishedAt,
      source: article.source,
      viewed: viewedItems.current.has(article.id),
      priority: article.type === 'release' ? 'high' : 'medium',
      artist: article.artist,
      category: article.type,
      description: article.description
    };

    // Source-specific customizations
    switch (article.source) {
      case 'Genius':
        return {
          ...baseItem,
          title: `${article.artist} - ${article.title}`, // Format as "Artist - Song"
          priority: 'high', // Releases are high priority
        };
      
      case 'Last.fm':
        return {
          ...baseItem,
          title: `${article.artist} - Artist Info`,
          priority: 'medium',
        };
      
      case 'HotNewHipHop':
        return {
          ...baseItem,
          priority: 'medium',
        };
      
      default:
        return baseItem;
    }
  };

  // Helper function to convert activity to FeedItem
  const activityToFeedItem = (activity: LiveTrack | RecentTrack, username?: string): FeedItem => {
    const isLive = 'isPlaying' in activity;
    const trackName = isLive ? activity.currentTrack.name : activity.name;
    const trackArtist = isLive ? activity.currentTrack.artist : activity.artist;
    const trackAlbum = isLive ? activity.currentTrack.album : activity.album;
    const trackImage = isLive ? activity.currentTrack.imageUrl : activity.imageUrl;
    const trackUrl = isLive ? activity.currentTrack.spotifyUrl : activity.spotifyUrl;
    const timestamp = isLive ? activity.lastUpdated : activity.playedAt;
    const id = `${isLive ? 'live' : 'recent'}-${username || 'me'}-${trackName}`;
    
    return {
      id,
      type: isLive ? 'live-activity' : 'recent-activity',
      title: isLive 
        ? `${username ? `${username} is` : 'You are'} listening to ${trackName}`
        : `${username ? `${username} played` : 'You played'} ${trackName}`,
      content: `${trackArtist} • ${trackAlbum}`,
      imageUrl: trackImage,
      publishedAt: timestamp,
      source: 'Spotify',
      viewed: viewedItems.current.has(id),
      priority: isLive ? 'high' : 'medium',
      track: {
        name: trackName,
        artist: trackArtist,
        album: trackAlbum,
        isPlaying: isLive ? activity.isPlaying : false,
        progressMs: isLive ? activity.progressMs : undefined,
        durationMs: isLive ? activity.durationMs : undefined,
        spotifyUrl: trackUrl
      },
      username,
      timeAgo: 'timeAgo' in activity ? activity.timeAgo : undefined
    };
  };

  const loadFeed = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let items: FeedItem[] = [];
      
      switch (activeTab) {
        case 'looped': {
          // Show all content mixed together - news, releases, and activity
          logger.info('Loading looped feed...');
          const [newsArticles, userActivity] = await Promise.allSettled([
            buzzService.getNewsArticles(15),
            buzzService.getCurrentUserActivity()
          ]);
          
          if (newsArticles.status === 'fulfilled') {
            logger.info('News articles loaded:', newsArticles.value.length);
            items.push(...newsArticles.value.map(newsToFeedItem));
          }
          
          if (userActivity.status === 'fulfilled' && userActivity.value) {
            logger.info('User activity loaded');
            items.push(activityToFeedItem(userActivity.value));
          }
          break;
        }
        
        case 'releases': {
          // Show only music releases (Genius type content)
          logger.info('Loading releases...');
          const articles = await buzzService.getReleases(20);
          items = articles.map(newsToFeedItem);
          break;
        }
        
        case 'custom': {
          // Show customizable content - artist info and hip-hop news
          logger.info('Loading custom content...');
          const [artistInfo, hipHopNews] = await Promise.allSettled([
            buzzService.getArtistInfo(10),
            buzzService.getHipHopNews(10)
          ]);
          
          if (artistInfo.status === 'fulfilled') {
            items.push(...artistInfo.value.map(newsToFeedItem));
          }
          
          if (hipHopNews.status === 'fulfilled') {
            items.push(...hipHopNews.value.map(newsToFeedItem));
          }
          break;
        }
        
        default: {
          // Default to looped feed
          const articles = await buzzService.getNewsArticles(10);
          items = articles.map(newsToFeedItem);
        }
      }
      
      // Sort by publication date (newest first)
      items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      setFeedItems(items);
      
    } catch (error) {
      logger.error('Error loading feed:', error);
      setError('Failed to load feed. Please try again.');
      setFeedItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, loading]);

  const refreshFeed = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    setError(null);
    
    try {
      // Clear viewed items on refresh to show fresh content
      viewedItems.current.clear();
      
      // Reuse the loadFeed logic
      await loadFeed();
      
    } catch (error) {
      logger.error('Error refreshing feed:', error);
      setError('Failed to refresh feed. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [loadFeed, refreshing]);

  const markItemAsViewed = useCallback((itemId: string) => {
    viewedItems.current.add(itemId);
    
    setFeedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, viewed: true }
          : item
      )
    );
    
    // Log interaction for future analytics integration
    logger.debug('Marked item as viewed:', itemId);
  }, []);

  const interactWithItem = useCallback((itemId: string, type: 'like' | 'share' | 'save') => {
    // Update local state
    setFeedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, interacted: true }
          : item
      )
    );
    
    // Log interaction for future analytics integration
    logger.debug('Item interaction:', { itemId, type, context: activeTab });
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