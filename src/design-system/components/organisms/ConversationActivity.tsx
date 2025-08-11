/**
 * Mobile-Optimized Conversation Activity Indicator
 * Simple dots to show recent message frequency - perfect for mobile
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { getThemeColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { FriendsAPI } from '../../../services/api';
import { logger } from '../../../utils/logger';

interface ConversationActivityProps {
  visible: boolean;
  theme?: 'light' | 'dark';
  friendUsername?: string;
}

export const ConversationActivity: React.FC<ConversationActivityProps> = ({
  visible,
  theme = 'light',
  friendUsername,
}) => {
  const themeColors = getThemeColors(theme);
  const [activityLevel, setActivityLevel] = useState(0); // 0-4 scale
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && friendUsername) {
      loadActivityLevel();
    }
  }, [visible, friendUsername]);

  const loadActivityLevel = async () => {
    if (!friendUsername) return;
    
    setIsLoading(true);
    try {
      const response = await FriendsAPI.getMessagingHeatMap(friendUsername);
      if (response.success && response.data?.heatMap) {
        // Calculate activity from last 7 days
        const recent = response.data.heatMap
          .slice(-7)
          .reduce((sum: number, day: any) => sum + (day.level || 0), 0);
        
        // Convert to 0-4 scale
        const level = Math.min(4, Math.floor(recent / 3));
        setActivityLevel(level);
      } else {
        setActivityLevel(0);
      }
    } catch (error) {
      logger.error('Failed to load activity:', error);
      setActivityLevel(0);
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  const getActivityColor = (level: number) => {
    if (isLoading) return themeColors.textMuted;
    
    const colors = [
      themeColors.textMuted, // 0 - no activity
      '#10B981', // 1 - low activity (green)
      '#F59E0B', // 2 - medium activity (yellow)
      '#EF4444', // 3 - high activity (red)
      '#8B5CF6', // 4 - very high activity (purple)
    ];
    return colors[level] || colors[0];
  };

  const getActivityText = (level: number) => {
    if (isLoading) return 'Loading...';
    
    const texts = ['Quiet', 'Light', 'Active', 'Busy', 'Very Active'];
    return texts[level] || texts[0];
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: theme === 'dark' ? '#2A2A2A' : '#F8F8F8' }
    ]}>
      <View style={styles.header}>
        <Text style={[styles.username, { color: themeColors.text }]}>
          {friendUsername}
        </Text>
        <Text style={[styles.activityText, { color: getActivityColor(activityLevel) }]}>
          {getActivityText(activityLevel)}
        </Text>
      </View>
      
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3, 4].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index <= activityLevel 
                  ? getActivityColor(activityLevel)
                  : (theme === 'dark' ? '#3A3A3A' : '#E0E0E0'),
                opacity: isLoading ? 0.3 : 1,
              }
            ]}
          />
        ))}
      </View>
      
      <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
        Recent activity
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: spacing[3],
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  activityText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '400',
    fontFamily: 'Inter-Regular',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ConversationActivity;