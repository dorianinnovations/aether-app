/**
 * Buzz Service - Artist News & Live Activity Integration
 * New streamlined backend integration for buzz screen
 */

import { TokenManager } from '../apiModules/utils/storage';
import { SpotifyAPI } from '../apiModules/endpoints/spotify';
import { API_BASE_URL } from '../apiModules/core/client';

// Artist News Types - Complete Data Structure
export interface NewsArticle {
  id: string;                    // Unique ID: "genius_123", "lastfm_456", "hnhh_789"
  artist: string;               // Artist name
  title: string;                // Article/content title
  description: string;          // Article description/summary
  url: string;                  // Source URL
  imageUrl: string | null;      // Image URL (can be null)
  publishedAt: string;          // ISO timestamp
  source: "Genius" | "Last.fm" | "HotNewHipHop";
  type: "release" | "info" | "news"; // Content type by source
}

export interface ArtistNewsResponse {
  success: boolean;
  data: NewsArticle[];
  meta: {
    artistsSearched: string[];
    totalArticles: number;
    lastUpdated: string;
  };
  sourcesUsed: string[];
  message?: string;
}

// Spotify Live Status Types
export interface LiveTrack {
  currentTrack: {
    name: string;
    artist: string;
    album: string;
    imageUrl: string;
    spotifyUrl: string;
  };
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
  lastUpdated: string;
}

export interface RecentTrack {
  name: string;
  artist: string;
  album: string;
  imageUrl: string;
  spotifyUrl: string;
  playedAt: string;
  timeAgo: string;
}

export interface TopTrack {
  name: string;
  artist: string;
  album: string;
  imageUrl: string;
  spotifyUrl: string;
}

export interface LiveStatusResponse {
  success: boolean;
  data: {
    connected: boolean;
    username: string;
    live: LiveTrack | null;
    recent: RecentTrack | null;
    topTracks: TopTrack[];
  };
  error?: string;
}

export interface MySpotifyStatusResponse {
  success: boolean;
  data: {
    connected: boolean;
    hasValidToken: boolean;
    currentTrack?: {
      name: string;
      artist: string;
      album: string;
      imageUrl: string;
      spotifyUrl: string;
      isPlaying: boolean;
      progressMs: number;
      durationMs: number;
    };
    recentTracks: RecentTrack[];
    topTracks: TopTrack[];
  };
}

export interface BuzzServiceConfig {
  apiBaseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export class BuzzService {
  private config: BuzzServiceConfig;

  constructor(config: BuzzServiceConfig) {
    this.config = config;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const token = await TokenManager.getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.apiBaseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Artist News Methods - Fallback until backend is ready
  async getArtistNews(limit: number = 10): Promise<ArtistNewsResponse> {
    try {
      // Try the new endpoint first
      return this.makeRequest<ArtistNewsResponse>(`/api/artist-news?limit=${limit}`);
    } catch (error) {
      console.log('New artist news endpoint not available, using fallback data');
      // Return fallback data until backend is ready
      return {
        success: true,
        data: this.generateFallbackNews(limit),
        meta: {
          artistsSearched: ['Drake', 'The Weeknd', 'Travis Scott'],
          totalArticles: limit,
          lastUpdated: new Date().toISOString()
        },
        sourcesUsed: ['Genius', 'Last.fm', 'HotNewHipHop']
      };
    }
  }

  // Spotify Live Status Methods - Use existing API
  async getFriendLiveStatus(username: string): Promise<LiveStatusResponse> {
    try {
      return this.makeRequest<LiveStatusResponse>(`/api/spotify/live-status/${username}`);
    } catch (error) {
      console.log('Friend live status endpoint not available');
      return {
        success: false,
        data: {
          connected: false,
          username,
          live: null,
          recent: null,
          topTracks: []
        },
        error: 'Endpoint not available'
      };
    }
  }

  async getMySpotifyStatus(): Promise<MySpotifyStatusResponse> {
    try {
      // Use existing Spotify API
      const spotifyStatus = await SpotifyAPI.getStatus();
      
      // Transform existing API response to match new interface
      return {
        success: true,
        data: {
          connected: spotifyStatus.connected || false,
          hasValidToken: spotifyStatus.hasValidToken || false,
          currentTrack: spotifyStatus.currentTrack ? {
            name: spotifyStatus.currentTrack.name,
            artist: spotifyStatus.currentTrack.artist,
            album: spotifyStatus.currentTrack.album,
            imageUrl: spotifyStatus.currentTrack.imageUrl || spotifyStatus.currentTrack.image,
            spotifyUrl: spotifyStatus.currentTrack.spotifyUrl || spotifyStatus.currentTrack.external_urls?.spotify,
            isPlaying: spotifyStatus.currentTrack.is_playing || false,
            progressMs: spotifyStatus.currentTrack.progress_ms || 0,
            durationMs: spotifyStatus.currentTrack.duration_ms || 0
          } : undefined,
          recentTracks: spotifyStatus.recentTracks || [],
          topTracks: spotifyStatus.topTracks || []
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          connected: false,
          hasValidToken: false,
          recentTracks: [],
          topTracks: []
        }
      };
    }
  }

  // Generate fallback news data
  private generateFallbackNews(limit: number): NewsArticle[] {
    const fallbackArticles: NewsArticle[] = [
      {
        id: 'genius_sample_1',
        artist: 'Drake',
        title: 'God\'s Plan',
        description: 'Drake\'s hit single "God\'s Plan" showcases his signature blend of melodic rap and introspective lyrics. The track, which became a massive commercial success, demonstrates Drake\'s ability to create music that resonates with both mainstream audiences and hip-hop purists. The song\'s production features atmospheric beats and subtle instrumentation that complement Drake\'s smooth vocal delivery and thoughtful wordplay.',
        url: 'https://genius.com/drake-gods-plan-lyrics',
        imageUrl: 'https://images.genius.com/sample/song_art.jpg',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        source: 'Genius',
        type: 'release'
      },
      {
        id: 'lastfm_sample_1',
        artist: 'The Weeknd',
        title: 'The Weeknd - Artist Info',
        description: 'Abel Makkonen Tesfaye, known professionally as The Weeknd, is a Canadian singer, songwriter, and record producer. He has received numerous accolades, including four Grammy Awards, 20 Billboard Music Awards, 22 Juno Awards, six American Music Awards, two MTV Video Music Awards, and nominations for an Academy Award and a Golden Globe Award. Known for his sonic versatility and dark lyricism, his music explores escapism, romance, and melancholia, and is often inspired by personal experiences.',
        url: 'https://www.last.fm/music/The+Weeknd',
        imageUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/sample.jpg',
        publishedAt: new Date().toISOString(),
        source: 'Last.fm',
        type: 'info'
      },
      {
        id: 'hnhh_sample_1',
        artist: 'Travis Scott',
        title: 'Travis Scott Announces New Album Release Date',
        description: 'Houston rapper Travis Scott has finally revealed the official release date for his highly anticipated album. The announcement comes after months of speculation and teasing from the multi-platinum artist. Scott, known for his innovative production style and high-energy performances, promises that this new project will push creative boundaries and feature collaborations with some of the biggest names in hip-hop. Fans have been eagerly waiting for new material since his last major release, and early previews suggest this album will be worth the wait.',
        url: 'https://www.hotnewhiphop.com/travis-scott-announces-album-news.html',
        imageUrl: null,
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        source: 'HotNewHipHop',
        type: 'news'
      },
      {
        id: 'genius_sample_2',
        artist: 'Kendrick Lamar',
        title: 'HUMBLE.',
        description: 'Kendrick Lamar\'s "HUMBLE." stands as one of the most impactful tracks in modern hip-hop, combining hard-hitting production with Lamar\'s commanding vocal presence. The song\'s minimalist yet powerful beat, produced by Mike WiLL Made-It, creates the perfect backdrop for Kendrick\'s assertive lyrics about authenticity and staying grounded despite success. The track showcases Lamar\'s incredible range as both a technical rapper and a compelling storyteller.',
        url: 'https://genius.com/kendrick-lamar-humble-lyrics',
        imageUrl: 'https://images.genius.com/kendrick-sample.jpg',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        source: 'Genius',
        type: 'release'
      },
      {
        id: 'hnhh_sample_2',
        artist: 'J. Cole',
        title: 'J. Cole Surprises Fans with Impromptu Studio Session',
        description: 'Grammy-nominated rapper J. Cole surprised fans this week with an impromptu studio session that was livestreamed across his social media platforms. The North Carolina native showcased his creative process, working on beats and freestyling over new instrumentals. Cole, who has always been known for his introspective lyrics and conscious rap style, gave fans an intimate look into how he crafts his music. The session lasted over two hours and featured several unreleased tracks that had fans speculating about a potential new project on the horizon.',
        url: 'https://www.hotnewhiphop.com/j-cole-studio-session-news.html',
        imageUrl: null,
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        source: 'HotNewHipHop',
        type: 'news'
      }
    ];

    return fallbackArticles.slice(0, limit);
  }

  // Generate additional releases for Releases tab
  private generateAdditionalReleases(limit: number): NewsArticle[] {
    const releases: NewsArticle[] = [
      {
        id: 'genius_release_1',
        artist: 'Future',
        title: 'Mask Off',
        description: 'Future\'s hit single "Mask Off" features his signature melodic trap style with hypnotic production. The track showcases Future\'s ability to blend catchy hooks with atmospheric beats, creating a sound that\'s both commercially appealing and artistically compelling.',
        url: 'https://genius.com/future-mask-off-lyrics',
        imageUrl: 'https://images.genius.com/future-sample.jpg',
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        source: 'Genius',
        type: 'release'
      },
      {
        id: 'genius_release_2',
        artist: 'Lil Baby',
        title: 'Drip Too Hard',
        description: 'Lil Baby\'s "Drip Too Hard" exemplifies his rapid-fire delivery and confident lyricism. The track features hard-hitting 808s and melodic elements that have become signature sounds in modern trap music.',
        url: 'https://genius.com/lil-baby-drip-too-hard-lyrics',
        imageUrl: 'https://images.genius.com/lil-baby-sample.jpg',
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        source: 'Genius',
        type: 'release'
      },
      {
        id: 'genius_release_3',
        artist: 'Doja Cat',
        title: 'Paint The Town Red',
        description: 'Doja Cat\'s "Paint The Town Red" showcases her versatility as an artist, blending pop sensibilities with hip-hop elements. The track features her distinctive vocal style and creative production choices.',
        url: 'https://genius.com/doja-cat-paint-the-town-red-lyrics',
        imageUrl: 'https://images.genius.com/doja-cat-sample.jpg',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        source: 'Genius',
        type: 'release'
      }
    ];
    
    return releases.slice(0, limit);
  }

  // Generate additional artist info for Custom tab
  private generateAdditionalArtistInfo(limit: number): NewsArticle[] {
    const artistInfo: NewsArticle[] = [
      {
        id: 'lastfm_info_1',
        artist: 'Kendrick Lamar',
        title: 'Kendrick Lamar - Artist Info',
        description: 'Kendrick Lamar Duckworth is widely regarded as one of the most influential hip-hop artists of his generation. Known for his complex lyricism and conceptual albums, Lamar has won multiple Grammy Awards and a Pulitzer Prize for his album "DAMN."',
        url: 'https://www.last.fm/music/Kendrick+Lamar',
        imageUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/kendrick-sample.jpg',
        publishedAt: new Date().toISOString(),
        source: 'Last.fm',
        type: 'info'
      },
      {
        id: 'lastfm_info_2',
        artist: 'Tyler, The Creator',
        title: 'Tyler, The Creator - Artist Info',
        description: 'Tyler Gregory Okonma, known professionally as Tyler, The Creator, is an American rapper, singer, songwriter, and record producer. He is the leader of the alternative hip hop collective Odd Future.',
        url: 'https://www.last.fm/music/Tyler,+The+Creator',
        imageUrl: 'https://lastfm.freetls.fastly.net/i/u/300x300/tyler-sample.jpg',
        publishedAt: new Date().toISOString(),
        source: 'Last.fm',
        type: 'info'
      }
    ];
    
    return artistInfo.slice(0, limit);
  }

  // Generate additional news for Custom tab
  private generateAdditionalNews(limit: number): NewsArticle[] {
    const news: NewsArticle[] = [
      {
        id: 'hnhh_news_1',
        artist: 'Kanye West',
        title: 'Kanye West Teases New Music in Latest Instagram Post',
        description: 'Kanye West has been active on social media lately, sharing cryptic posts that appear to hint at new music. The Chicago rapper and producer posted a series of studio photos that have fans speculating about an upcoming project.',
        url: 'https://www.hotnewhiphop.com/kanye-west-teases-new-music-news.html',
        imageUrl: null,
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: 'HotNewHipHop',
        type: 'news'
      },
      {
        id: 'hnhh_news_2',
        artist: 'Cardi B',
        title: 'Cardi B Announces Summer Tour Dates',
        description: 'Cardi B has officially announced her highly anticipated summer tour, with dates spanning major cities across North America. The Bronx rapper promises an unforgettable show featuring hits from her latest album.',
        url: 'https://www.hotnewhiphop.com/cardi-b-tour-announcement-news.html',
        imageUrl: null,
        publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        source: 'HotNewHipHop',
        type: 'news'
      }
    ];
    
    return news.slice(0, limit);
  }

  // Utility Methods
  async getNewsArticles(limit: number = 10): Promise<NewsArticle[]> {
    try {
      const response = await this.getArtistNews(limit);
      return response.success ? response.data : [];
    } catch (error) {
      console.error('Error fetching artist news:', error);
      return [];
    }
  }

  // Source-specific utility methods
  async getReleases(limit: number = 10): Promise<NewsArticle[]> {
    try {
      const articles = await this.getNewsArticles(limit);
      const releases = articles.filter(article => article.type === 'release');
      
      // If we don't have enough releases from main feed, generate more
      if (releases.length < limit) {
        const additionalReleases = this.generateAdditionalReleases(limit - releases.length);
        return [...releases, ...additionalReleases];
      }
      
      return releases.slice(0, limit);
    } catch (error) {
      console.error('Error fetching releases:', error);
      return this.generateAdditionalReleases(limit);
    }
  }

  async getArtistInfo(limit: number = 10): Promise<NewsArticle[]> {
    try {
      const articles = await this.getNewsArticles(limit);
      const artistInfo = articles.filter(article => article.type === 'info');
      
      // If we don't have enough artist info, generate more
      if (artistInfo.length < limit) {
        const additionalInfo = this.generateAdditionalArtistInfo(limit - artistInfo.length);
        return [...artistInfo, ...additionalInfo];
      }
      
      return artistInfo.slice(0, limit);
    } catch (error) {
      console.error('Error fetching artist info:', error);
      return this.generateAdditionalArtistInfo(limit);
    }
  }

  async getHipHopNews(limit: number = 10): Promise<NewsArticle[]> {
    try {
      const articles = await this.getNewsArticles(limit);
      const news = articles.filter(article => article.type === 'news');
      
      // If we don't have enough news, generate more
      if (news.length < limit) {
        const additionalNews = this.generateAdditionalNews(limit - news.length);
        return [...news, ...additionalNews];
      }
      
      return news.slice(0, limit);
    } catch (error) {
      console.error('Error fetching hip-hop news:', error);
      return this.generateAdditionalNews(limit);
    }
  }

  // Helper methods for frontend rendering
  getSourceIcon(source: string): string {
    switch (source) {
      case 'Genius': return '🎤';
      case 'Last.fm': return '🎵';
      case 'HotNewHipHop': return '🔥';
      default: return '📰';
    }
  }

  getSourceBadgeColor(source: string): string {
    switch (source) {
      case 'Genius': return '#FFFF00'; // Yellow
      case 'Last.fm': return '#D51007'; // Red
      case 'HotNewHipHop': return '#FF6B35'; // Orange
      default: return '#6B7280'; // Gray
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'release': return '💿';
      case 'info': return 'ℹ️';
      case 'news': return '📰';
      default: return '📄';
    }
  }

  getFallbackImageUrl(type: string): string {
    switch (type) {
      case 'release': return '/default-album-art.jpg';
      case 'info': return '/default-artist-photo.jpg';
      case 'news': return '/default-news-thumbnail.jpg';
      default: return '/default-placeholder.jpg';
    }
  }

  async checkFriendActivity(username: string): Promise<LiveTrack | RecentTrack | null> {
    try {
      const response = await this.getFriendLiveStatus(username);
      if (response.success) {
        return response.data.live || response.data.recent;
      }
      return null;
    } catch (error) {
      console.error('Error checking friend activity:', error);
      return null;
    }
  }

  async getCurrentUserActivity(): Promise<LiveTrack | RecentTrack | null> {
    try {
      const response = await this.getMySpotifyStatus();
      if (response.success && response.data.currentTrack) {
        return {
          currentTrack: response.data.currentTrack,
          isPlaying: response.data.currentTrack.isPlaying,
          progressMs: response.data.currentTrack.progressMs,
          durationMs: response.data.currentTrack.durationMs,
          lastUpdated: new Date().toISOString()
        };
      }
      
      // Return most recent track if available
      if (response.success && response.data.recentTracks.length > 0) {
        return response.data.recentTracks[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error checking current user activity:', error);
      return null;
    }
  }
}

// Default configuration - use existing API base URL
const defaultConfig: BuzzServiceConfig = {
  apiBaseUrl: API_BASE_URL,
  timeout: 30000, // Increased timeout to 30 seconds
  retryAttempts: 3
};

// Export singleton instance
export const buzzService = new BuzzService(defaultConfig);