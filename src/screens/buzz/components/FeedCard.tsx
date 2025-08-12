/**
 * FeedCard Component
 * Card component for displaying feed items in the buzz screen
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import TypeBadge from './TypeBadge';
import PriorityIndicator from './PriorityIndicator';

// Design System
import { typography } from '../../../design-system/tokens/typography';
import { spacing } from '../../../design-system/tokens/spacing';
import { getGlassmorphicStyle } from '../../../design-system/tokens/glassmorphism';

// Types
import type { FeedItem } from '../../../services/apiModules/endpoints/feed';
import type { ThemeColors } from '../types';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - spacing.lg * 2;

interface FeedCardProps {
  item: FeedItem;
  onPress: () => void;
  onInteraction: (type: 'like' | 'share' | 'save') => void;
  colors: ThemeColors;
  isDarkMode: boolean;
}

const FeedCard: React.FC<FeedCardProps> = ({
  item,
  onPress,
  onInteraction,
  colors,
  isDarkMode,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(item.viewed ? 0.9 : 1)).current;

  useEffect(() => {
    if (item.viewed) {
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [item.viewed, opacityAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const cardStyle = {
    ...getGlassmorphicStyle('card', isDarkMode ? 'dark' : 'light'),
    backgroundColor: isDarkMode 
      ? 'rgba(30, 30, 30, 0.6)' // Match the header area's lighter black
      : 'rgba(255, 255, 255, 0.92)',
    borderWidth: isDarkMode ? 1 : 0,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.card, cardStyle]}>
          {/* Priority Indicator */}
          <PriorityIndicator priority={item.priority} colors={colors} />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {item.artist.image && (
                <Image
                  source={{ uri: item.artist.image }}
                  style={styles.artistImage}
                />
              )}
              <View style={styles.artistInfo}>
                <Text style={[styles.artistName, { color: colors.text }]}>
                  {item.artist.name}
                </Text>
                <View style={styles.metaRow}>
                  <TypeBadge type={item.type} colors={colors} isDarkMode={isDarkMode} />
                  <Text style={[styles.source, { color: colors.textSecondary }]}>
                    {item.source}
                  </Text>
                  <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                    {formatDate(item.publishedAt)}
                  </Text>
                </View>
              </View>
            </View>
            {!item.viewed && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.contentText, { color: colors.textSecondary }]} numberOfLines={3}>
              {truncateContent(item.content, 150)}
            </Text>
          </View>

          {/* Featured Image */}
          {item.imageUrl && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.featuredImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={[
                  'transparent',
                  isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                ]}
                style={styles.imageGradient}
              />
            </View>
          )}

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onInteraction('like')}
              >
                <Ionicons name="heart-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onInteraction('share')}
              >
                <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onInteraction('save')}
              >
                <Ionicons name="bookmark-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {item.engagementScore !== undefined && (
              <View style={styles.engagementContainer}>
                <View style={[styles.engagementBar, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.engagementFill,
                      {
                        width: `${item.engagementScore * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  card: {
    borderRadius: 12,
    padding: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  artistImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  source: {
    ...typography.caption,
  },
  timestamp: {
    ...typography.caption,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  content: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.textStyles.headlineMedium,
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  contentText: {
    ...typography.body,
    lineHeight: 20,
  },
  imageContainer: {
    marginHorizontal: -spacing.md,
    marginBottom: spacing.md,
    height: 180,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    padding: spacing.xs,
  },
  engagementContainer: {
    flex: 1,
    maxWidth: 80,
    marginLeft: spacing.md,
  },
  engagementBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  engagementFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default FeedCard;