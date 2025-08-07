/**
 * User Badges Service
 * Manages user badge assignments and synchronization
 */

import { logger } from '../utils/logger';
import { api } from '../services/apiModules/core/client';

export type BadgeType = 'founder' | 'og';

export interface UserBadge {
  id: string;
  userId: string;
  badgeType: BadgeType;
  awardedAt: string;
  isVisible: boolean;
}

export interface UserBadgesData {
  userId: string;
  badges: UserBadge[];
}

class UserBadgesService {
  private badgesCache = new Map<string, UserBadge[]>();
  
  /**
   * Get badges for a specific user
   */
  async getUserBadges(userId: string, userEmail?: string, userName?: string): Promise<UserBadge[]> {
    try {
      // Handle undefined userId
      if (!userId) {
        logger.warn('getUserBadges called with undefined userId, skipping badge assignment');
        return [];
      }

      // Check cache first
      if (this.badgesCache.has(userId)) {
        return this.badgesCache.get(userId)!;
      }

      // Try to get badges from API first
      try {
        const response = await api.get('/badges/my-badges');
        if (response.data && Array.isArray(response.data.badges)) {
          const badges = response.data.badges;
          this.badgesCache.set(userId, badges);
          logger.info('User badges retrieved from API:', { userId, badgeCount: badges.length });
          return badges;
        }
      } catch (apiError) {
        logger.warn('Failed to fetch badges from API, falling back to hardcoded:', apiError);
      }

      // Fallback to hardcoded data for testing
      const badges = this.getHardcodedBadges(userId, userEmail, userName);
      
      // Cache the result
      this.badgesCache.set(userId, badges);
      
      // User badges retrieved
      return badges;
    } catch (error) {
      logger.error('Error getting user badges:', error);
      return [];
    }
  }

  /**
   * Check if user has a specific badge
   */
  async userHasBadge(userId: string, badgeType: BadgeType): Promise<boolean> {
    const badges = await this.getUserBadges(userId);
    return badges.some(badge => badge.badgeType === badgeType && badge.isVisible);
  }

  /**
   * Award a badge to a user
   */
  async awardBadge(userId: string, badgeType: BadgeType): Promise<UserBadge> {
    try {
      // Try to award badge via API
      const response = await api.post(`/badges/user/${userId}/award`, {
        badgeType,
        isVisible: true
      });

      if (response.data && response.data.badge) {
        const newBadge = response.data.badge;
        
        // Update cache
        const existingBadges = this.badgesCache.get(userId) || [];
        const updatedBadges = [...existingBadges, newBadge];
        this.badgesCache.set(userId, updatedBadges);

        logger.info('Badge awarded via API:', { userId, badgeType, badgeId: newBadge.id });
        return newBadge;
      }
    } catch (apiError) {
      logger.error('Failed to award badge via API:', apiError);
    }

    // Fallback to local badge creation
    const newBadge: UserBadge = {
      id: `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      badgeType,
      awardedAt: new Date().toISOString(),
      isVisible: true,
    };

    // Update cache
    const existingBadges = this.badgesCache.get(userId) || [];
    const updatedBadges = [...existingBadges, newBadge];
    this.badgesCache.set(userId, updatedBadges);

    logger.info('Badge awarded (fallback):', { userId, badgeType, badgeId: newBadge.id });
    return newBadge;
  }

  /**
   * Remove a badge from a user
   */
  async removeBadge(userId: string, badgeType: BadgeType): Promise<boolean> {
    const badges = this.badgesCache.get(userId) || [];
    const filteredBadges = badges.filter(badge => badge.badgeType !== badgeType);
    
    this.badgesCache.set(userId, filteredBadges);
    logger.info('Badge removed:', { userId, badgeType });
    return true;
  }

  /**
   * Get hardcoded badges for testing and specific users
   */
  private getHardcodedBadges(userId: string, userEmail?: string, userName?: string): UserBadge[] {
    const badges: UserBadge[] = [];
    
    // Add safety checks for undefined values
    const safeUserId = userId || '';
    const safeUserEmail = userEmail || '';
    const safeUserName = userName || '';
    
    
    // Check if this is Isaiah (check multiple identifiers)
    const isIsaiah = safeUserId.toLowerCase().includes('isaiah') || 
                     safeUserId === 'isaiah' ||
                     safeUserEmail.toLowerCase().includes('isaiah') ||
                     safeUserName.toLowerCase().includes('isaiah');
    
    if (isIsaiah) {
      badges.push({
        id: 'founder_isaiah',
        userId: safeUserId,
        badgeType: 'founder',
        awardedAt: '2024-01-01T00:00:00Z',
        isVisible: true,
      });
      
      badges.push({
        id: 'og_isaiah',
        userId: safeUserId,
        badgeType: 'og',
        awardedAt: '2025-01-01T00:00:00Z',
        isVisible: true,
      });
      
    } else {
    }

    return badges;
  }

  /**
   * Sync badges with server
   */
  async syncBadgesWithServer(userId: string): Promise<UserBadge[]> {
    try {
      // Clear cache to force fresh API call
      this.badgesCache.delete(userId);
      
      // Get fresh badges from server
      const badges = await this.getUserBadges(userId);
      
      logger.info('Badges synced with server:', { userId, badgeCount: badges.length });
      return badges;
    } catch (error) {
      logger.error('Error syncing badges with server:', error);
      return this.badgesCache.get(userId) || [];
    }
  }

  /**
   * Get badge statistics (admin only)
   */
  async getBadgeStats(): Promise<any> {
    try {
      const response = await api.get('/badges/admin/stats');
      return response.data;
    } catch (error) {
      logger.error('Error getting badge stats:', error);
      return null;
    }
  }

  /**
   * Clear cache for a specific user
   */
  clearUserCache(userId: string): void {
    this.badgesCache.delete(userId);
    logger.info('User badges cache cleared:', { userId });
  }

  /**
   * Clear all cached badges
   */
  clearAllCache(): void {
    this.badgesCache.clear();
    logger.info('All badges cache cleared');
  }
}

// Export singleton instance
export const userBadgesService = new UserBadgesService();
export default userBadgesService;