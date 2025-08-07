/**
 * Optimized Heatmap Tooltip Component
 * High-performance messaging heatmap with efficient rendering
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { logger } from '../../../utils/logger';
import { getThemeColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { FriendsAPI } from '../../../services/api';
import { LottieLoader } from '../atoms';

interface HeatmapData {
  date: string;
  intensity: number;
}

interface HeatmapTooltipProps {
  visible: boolean;
  theme?: 'light' | 'dark';
  friendUsername?: string;
}

export const HeatmapTooltip: React.FC<HeatmapTooltipProps> = ({
  visible,
  theme = 'light',
  friendUsername,
}) => {
  const themeColors = getThemeColors(theme);
  const [isLoading, setIsLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);

  // Memoize color palette to avoid recalculation
  const colorPalette = useMemo(() => {
    const emptyColor = theme === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(237, 242, 247, 1)';
    return [
      emptyColor,
      theme === 'dark' ? 'rgba(167, 139, 250, 0.3)' : 'rgba(196, 181, 253, 0.4)',
      theme === 'dark' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(167, 139, 250, 0.6)',
      theme === 'dark' ? 'rgba(244, 114, 182, 0.7)' : 'rgba(236, 72, 153, 0.8)',
      theme === 'dark' ? 'rgba(251, 146, 60, 0.9)' : 'rgba(249, 115, 22, 1.0)',
    ];
  }, [theme]);

  useEffect(() => {
    if (visible && friendUsername) {
      loadHeatmapData();
    }
  }, [visible, friendUsername]);

  const loadHeatmapData = async () => {
    if (!friendUsername) return;
    
    setIsLoading(true);
    try {
      const heatmapResponse = await FriendsAPI.getMessagingHeatMap(friendUsername);
      if (heatmapResponse.success && heatmapResponse.data?.heatMap) {
        const transformedData = heatmapResponse.data.heatMap.map((item: any) => ({
          date: item.date,
          intensity: item.level || 0,
        }));
        setHeatmapData(transformedData);
      } else {
        setHeatmapData([]);
      }
    } catch (error) {
      logger.error('Failed to load heatmap data:', error);
      setHeatmapData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize calendar grid generation for performance
  const calendarWeeks = useMemo(() => {
    const today = new Date();
    const safeHeatmapData = Array.isArray(heatmapData) ? heatmapData : [];
    
    const firstDay = new Date(today);
    firstDay.setDate(firstDay.getDate() - 364);
    
    // Create lookup map for O(1) data access instead of O(n) find operations
    const dataMap = new Map();
    safeHeatmapData.forEach(item => {
      if (item?.date) {
        dataMap.set(item.date, item.intensity);
      }
    });

    const weeks = [];
    let currentWeek = [];
    
    // Add padding for the first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ 
        date: `padding-${i}`, 
        intensity: -1, 
        color: 'transparent' 
      });
    }

    // Generate 365 days with pre-calculated colors
    for (let i = 0; i < 365; i++) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const intensity = dataMap.get(dateString) || 0;
      
      currentWeek.push({
        date: dateString,
        intensity,
        color: colorPalette[intensity] || colorPalette[0]
      });

      // Complete week, start new one
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add remaining days to final week
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [heatmapData, colorPalette]);

  // Optimized legend squares (pre-calculated)
  const legendSquares = useMemo(() => {
    return [0, 1, 2, 3, 4].map(intensity => ({
      key: intensity,
      color: colorPalette[intensity]
    }));
  }, [colorPalette]);

  const renderCalendarGrid = () => (
    <View style={styles.calendarContainer}>
      <View style={styles.calendar}>
        {calendarWeeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((day, dayIndex) => (
              <View
                key={`${weekIndex}-${dayIndex}`}
                style={[styles.day, { backgroundColor: day.color }]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: themeColors.textSecondary }]}>Less</Text>
        {legendSquares.map(square => (
          <View
            key={square.key}
            style={[styles.legendSquare, { backgroundColor: square.color }]}
          />
        ))}
        <Text style={[styles.legendText, { color: themeColors.textSecondary }]}>More</Text>
      </View>
    </View>
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.tooltip, getGlassmorphicStyle('card', theme)]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <LottieLoader size={40} />
        </View>
      ) : (
        renderCalendarGrid()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    borderRadius: 16,
    padding: spacing[3],
    width: 280,
    zIndex: 1000,
  },
  loadingContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarContainer: {
    alignItems: 'center',
  },
  calendar: {
    flexDirection: 'row',
    gap: 3,
  },
  week: {
    gap: 3,
  },
  day: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing[3],
  },
  legendText: {
    fontSize: 8,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  legendSquare: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default HeatmapTooltip;
