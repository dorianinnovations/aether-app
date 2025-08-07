/**
 * Heatmap Modal Component
 * Displays messaging heatmap visualization for friend conversations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  BackHandler,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { logger } from '../../../utils/logger';
import { getThemeColors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { getGlassmorphicStyle } from '../../tokens/glassmorphism';
import { FriendsAPI } from '../../../services/api';
import { LottieLoader } from '../atoms';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


interface HeatmapData {
  date: string;
  messageCount: number;
  intensity: number; // 0-4 scale
}

interface HeatmapModalProps {
  visible: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  friendUsername?: string;
  friendDisplayName?: string;
}

export const HeatmapModal: React.FC<HeatmapModalProps> = ({
  visible,
  onClose,
  theme = 'light',
  friendUsername,
  friendDisplayName,
}) => {
  const themeColors = getThemeColors(theme);
  const [isLoading, setIsLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [stats, setStats] = useState<{
    totalMessages: number;
    averageDaily: number;
    streakDays: number;
  } | null>(null);

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  // Load heatmap data when modal opens
  useEffect(() => {
    if (visible && friendUsername) {
      loadHeatmapData();
    }
  }, [visible, friendUsername]);

  const loadHeatmapData = async () => {
    if (!friendUsername) return;
    
    setIsLoading(true);
    try {
      // Load both heatmap and stats data
      const [heatmapResponse, statsResponse] = await Promise.all([
        FriendsAPI.getMessagingHeatMap(friendUsername),
        FriendsAPI.getMessagingStats(friendUsername)
      ]);

      logger.debug('Heatmap API response:', heatmapResponse);
      logger.debug('Stats API response:', statsResponse);

      if (heatmapResponse.success && heatmapResponse.data?.heatMap) {
        // Transform backend data to frontend format
        const transformedData = heatmapResponse.data.heatMap.map((item: any) => ({
          date: item.date,
          messageCount: item.count || 0,
          intensity: item.level || 0,
        }));
        logger.debug('Transformed heatmap data:', transformedData.slice(0, 5));
        setHeatmapData(transformedData);
      } else {
        logger.warn('No heatmap data received or invalid response');
        setHeatmapData([]);
      }

      if (statsResponse.success && statsResponse.data?.stats) {
        const statsData = {
          totalMessages: statsResponse.data.stats.totalMessages || 0,
          averageDaily: statsResponse.data.stats.averageDaily || 0,
          streakDays: statsResponse.data.streak?.streakDays || 0,
        };
        logger.debug('Processed stats:', statsData);
        setStats(statsData);
      } else {
        logger.warn('No stats data received or invalid response');
        setStats({ totalMessages: 0, averageDaily: 0, streakDays: 0 });
      }
    } catch (error) {
      logger.error('Failed to load heatmap data:', error);
      // Set empty data to show the UI even if API fails
      setHeatmapData([]);
      setStats({ totalMessages: 0, averageDaily: 0, streakDays: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate calendar grid for the last 365 days
  const generateCalendarGrid = () => {
    const days = [];
    const today = new Date();
    const safeHeatmapData = Array.isArray(heatmapData) ? heatmapData : [];
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateString = date.toISOString().split('T')[0];
      const dataPoint = safeHeatmapData.find(d => d && d.date === dateString);
      
      days.push({
        date: dateString,
        intensity: dataPoint?.intensity || 0,
        messageCount: dataPoint?.messageCount || 0,
        day: date.getDay(),
        month: date.getMonth(),
        dateObj: date,
      });
    }
    
    return days;
  };

  const getIntensityColor = (intensity: number) => {
    const baseColor = theme === 'dark' ? '66, 153, 225' : '49, 130, 206'; // Blue
    
    switch (intensity) {
      case 0: return theme === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(237, 242, 247, 1)';
      case 1: return `rgba(${baseColor}, 0.2)`;
      case 2: return `rgba(${baseColor}, 0.4)`;
      case 3: return `rgba(${baseColor}, 0.6)`;
      case 4: return `rgba(${baseColor}, 0.8)`;
      default: return theme === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'rgba(237, 242, 247, 1)';
    }
  };

  const renderCalendarGrid = () => {
    const days = generateCalendarGrid();
    
    // Group days into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.calendarContainer}>
          {/* Month labels */}
          <View style={styles.monthLabels}>
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
              <Text key={month} style={[styles.monthLabel, { color: themeColors.textSecondary }]}>
                {month}
              </Text>
            ))}
          </View>
          
          {/* Calendar grid */}
          <View style={styles.calendar}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((day, dayIndex) => (
                  <View
                    key={`${weekIndex}-${dayIndex}`}
                    style={[
                      styles.day,
                      {
                        backgroundColor: getIntensityColor(day.intensity),
                        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      }
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
          
          {/* Legend */}
          <View style={styles.legend}>
            <Text style={[styles.legendText, { color: themeColors.textSecondary }]}>Less</Text>
            {[0, 1, 2, 3, 4].map(intensity => (
              <View
                key={intensity}
                style={[
                  styles.legendSquare,
                  {
                    backgroundColor: getIntensityColor(intensity),
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }
                ]}
              />
            ))}
            <Text style={[styles.legendText, { color: themeColors.textSecondary }]}>More</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
          <Text style={[styles.statValue, { color: themeColors.text }]}>{stats.totalMessages}</Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Total Messages</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
          <Text style={[styles.statValue, { color: themeColors.text }]}>{stats.averageDaily.toFixed(1)}</Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Daily Average</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
          <Text style={[styles.statValue, { color: themeColors.text }]}>{stats.streakDays}</Text>
          <Text style={[styles.statLabel, { color: themeColors.textSecondary }]}>Current Streak</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      statusBarTranslucent
      animationType="fade"
    >
      <View style={styles.overlay}>
        {/* Background */}
        <View
          style={[
            styles.background,
            {
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
            }
          ]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleClose}
            disabled={isLoading}
          />
        </View>

        {/* Modal Content */}
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modal,
              getGlassmorphicStyle('overlay', theme),
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.titleContainer}>
                  <View style={[
                    styles.iconContainer,
                    { 
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    }
                  ]}>
                    <Feather 
                      name="activity" 
                      size={18} 
                      color={themeColors.text} 
                    />
                  </View>
                  <View>
                    <Text style={[
                      styles.title,
                      typography.textStyles.headlineSmall,
                      { color: themeColors.text }
                    ]}>
                      Messaging Heatmap
                    </Text>
                    {friendDisplayName && (
                      <Text style={[
                        styles.subtitle,
                        typography.textStyles.bodySmall,
                        { color: themeColors.textSecondary }
                      ]}>
                        with {friendDisplayName}
                      </Text>
                    )}
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    }
                  ]}
                  onPress={handleClose}
                  disabled={isLoading}
                >
                  <Feather 
                    name="x" 
                    size={18} 
                    color={themeColors.text} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <LottieLoader
                    size={60}
                    style={styles.loadingAnimation}
                  />
                  <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                    Loading heatmap data...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Stats Cards */}
                  {renderStats()}
                  
                  {/* Heatmap */}
                  <View style={styles.heatmapSection}>
                    <Text style={[
                      styles.sectionTitle,
                      typography.textStyles.bodyLarge,
                      { color: themeColors.text }
                    ]}>
                      Activity Over Time
                    </Text>
                    <Text style={[
                      styles.sectionDescription,
                      typography.textStyles.bodySmall,
                      { color: themeColors.textSecondary }
                    ]}>
                      Each square represents a day. Darker squares indicate more messages.
                    </Text>
                    
                    {renderCalendarGrid()}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[6],
  },
  modal: {
    width: Math.min(screenWidth - spacing[8], 420),
    maxHeight: screenHeight * 0.8,
    borderRadius: 16,
    padding: spacing[4],
  },
  header: {
    marginBottom: spacing[4],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },
  loadingAnimation: {
    width: 60,
    height: 60,
  },
  loadingText: {
    marginTop: spacing[3],
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    padding: spacing[3],
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  heatmapSection: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  sectionDescription: {
    marginBottom: spacing[4],
    lineHeight: 16,
  },
  calendarContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  monthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
    marginBottom: spacing[2],
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  calendar: {
    flexDirection: 'row',
    gap: 2,
  },
  week: {
    gap: 2,
  },
  day: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 0.5,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing[3],
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 0.5,
  },
});

export default HeatmapModal;