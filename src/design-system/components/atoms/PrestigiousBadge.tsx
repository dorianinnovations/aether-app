/**
 * PrestigiousBadge Component - THE MOST EXCLUSIVE BADGES
 * 
 * These are the ONLY two prestigious badges that should exist in the entire app:
 * - VIP Badge (formerly OG)
 * - LEGEND Badge (formerly Founder)
 * 
 * This component wraps AdvancedBadge with the perfect "extreme" intensity 
 * configuration that makes these badges truly special.
 * 
 * IMPORTANT: These badges represent the highest tier of user recognition.
 * More prestigious badge types can be added to this component in the future,
 * but they should be rare and meaningful.
 * 
 * Current Exclusive Badge Types:
 * - 'vip': For original/early users (maps from 'og' in database)
 * - 'legend': For founders/creators (maps from 'founder' in database)
 * 
 * Future badge types can be added here when new prestigious tiers are needed.
 */

import React from 'react';
import { AdvancedBadge } from './AdvancedBadge';

/**
 * The exclusive prestigious badge types - only these two should exist!
 */
export type PrestigiousBadgeType = 'vip' | 'legend';

export interface PrestigiousBadgeProps {
  /** The prestigious badge type - only 'vip' or 'legend' allowed */
  type: PrestigiousBadgeType;
  /** Theme for the badge */
  theme: 'light' | 'dark';
  /** Size of the badge */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show tooltip */
  showTooltip?: boolean;
  /** Custom key for React lists */
  badgeKey?: string;
}

/**
 * PrestigiousBadge - The most exclusive badges in the app
 * 
 * This component ensures consistent styling for the two most prestigious 
 * badge types with the perfect "extreme" intensity that makes them pop.
 */
export const PrestigiousBadge: React.FC<PrestigiousBadgeProps> = ({
  type,
  theme,
  size = 'small',
  showTooltip = false,
  badgeKey,
}) => {
  return (
    <AdvancedBadge
      key={badgeKey}
      type={type as any}
      theme={theme}
      intensity="extreme"
      showTooltip={showTooltip}
      size={size}
    />
  );
};

/**
 * Badge mapping utility for database badge types to prestigious display types
 * This ensures consistent mapping across the entire application.
 */
export const mapDatabaseBadgeToPrestigious = (databaseBadgeType: string): PrestigiousBadgeType | null => {
  const badgeMapping: { [key: string]: PrestigiousBadgeType } = {
    'founder': 'legend',    // Founder becomes LEGEND  
    'og': 'vip',           // OG becomes VIP
    'verified': 'vip',     // Verified becomes VIP
    'creator': 'vip',      // Creator becomes VIP (lower tier than legend)
    'early': 'vip',        // Early becomes VIP
    'supporter': 'vip',    // Supporter becomes VIP
  };
  
  return badgeMapping[databaseBadgeType] || null;
};

/**
 * Get all available prestigious badge types
 * Useful for validation and iteration
 */
export const getAllPrestigiousBadgeTypes = (): PrestigiousBadgeType[] => {
  return ['vip', 'legend'];
};

export default PrestigiousBadge;