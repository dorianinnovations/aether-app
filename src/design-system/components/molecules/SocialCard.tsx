/**
 * Social Card Component (Molecule)
 * Living portfolio card showing friend/family member's current life status
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Types
import type { SocialCard as SocialCardType } from '../../../types/social';

// Hooks
import { useTheme } from '../../../hooks/useTheme';

// Tokens
import { getThemeColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { typography } from '../../tokens/typography';

interface SocialCardProps {
  card: SocialCardType;
  onPress: (card: SocialCardType) => void;
  onHangoutRequest?: (card: SocialCardType) => void;
}

export const SocialCard: React.FC<SocialCardProps> = memo(({
  card,
  onPress,
  onHangoutRequest,
}) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(card);
  };

  const handleHangoutPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onHangoutRequest?.(card);
  };

  const getAvailabilityColor = () => {
    switch (card.availability?.status) {
      case 'available': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'do-not-disturb': return '#ef4444';
      case 'away': return '#6b7280';
      default: return themeColors.textMuted;
    }
  };

  const getRelationshipEmoji = () => {
    switch (card.relationship) {
      case 'family': return '👨‍👩‍👧‍👦';
      case 'friend': return '👥';
      case 'colleague': return '💼';
      case 'acquaintance': return '🤝';
      default: return '👤';
    }
  };

  const formatLastUpdated = (timestamp: string) => {
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60));
    
    if (diffMinutes < 5) return 'Just updated';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return updated.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: themeColors.surface,
          borderColor: card.isOnline ? getAvailabilityColor() : themeColors.borders.subtle,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {card.avatar ? (
            <Image source={{ uri: card.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.borders.default }]}>
              <Text style={styles.avatarText}>{card.name.charAt(0)}</Text>
            </View>
          )}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: card.isOnline ? getAvailabilityColor() : themeColors.textMuted },
            ]}
          />
        </View>
        
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: themeColors.text }]}>
              {card.name}
            </Text>
            <Text style={styles.relationshipEmoji}>
              {getRelationshipEmoji()}
            </Text>
          </View>
          <Text style={[styles.lastUpdated, { color: themeColors.textMuted }]}>
            {formatLastUpdated(card.lastUpdated)}
          </Text>
        </View>
        
        {card.availability?.status === 'available' && onHangoutRequest && (
          <TouchableOpacity
            style={[styles.hangoutButton, { backgroundColor: getAvailabilityColor() }]}
            onPress={handleHangoutPress}
          >
            <Feather name="coffee" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Current Status */}
      {card.currentStatus ? (
        <Text style={[styles.status, { color: themeColors.text }]}>
          {card.currentStatus}
        </Text>
      ) : (
        <Text style={[styles.status, { color: themeColors.textMuted, fontStyle: 'italic' }]}>
          No recent updates
        </Text>
      )}

      {/* Availability */}
      {card.availability && (
        <View style={styles.availabilityContainer}>
          <View style={[styles.availabilityBadge, { backgroundColor: getAvailabilityColor() + '20' }]}>
            <Text style={[styles.availabilityText, { color: getAvailabilityColor() }]}>
              {card.availability.status.replace('-', ' ')}
            </Text>
          </View>
          {card.availability.message && (
            <Text style={[styles.availabilityMessage, { color: themeColors.textSecondary }]}>
              {card.availability.message}
            </Text>
          )}
        </View>
      )}

      {/* Recent Activity */}
      {card.recentActivities.length > 0 && (
        <View style={styles.activityContainer}>
          <Text style={[styles.activityLabel, { color: themeColors.textMuted }]}>
            Recent:
          </Text>
          <Text style={[styles.activityText, { color: themeColors.textSecondary }]}>
            {card.recentActivities[0].emoji} {card.recentActivities[0].description}
          </Text>
        </View>
      )}

      {/* Spotify Integration */}
      {card.spotify?.currentlyPlaying && (
        <View style={styles.spotifyContainer}>
          <Feather name="music" size={12} color="#1db954" />
          <Text style={[styles.spotifyText, { color: '#1db954' }]}>
            {card.spotify.currentlyPlaying.name} - {card.spotify.currentlyPlaying.artist}
          </Text>
        </View>
      )}

      {/* Upcoming Plans */}
      {card.upcomingPlans.length > 0 && (
        <View style={styles.plansContainer}>
          <Text style={[styles.plansLabel, { color: themeColors.textMuted }]}>
            Up next:
          </Text>
          <Text style={[styles.plansText, { color: themeColors.textSecondary }]}>
            {card.upcomingPlans[0].title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing[4],
    marginVertical: spacing[2],
    marginHorizontal: spacing[4],
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing[3],
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.bodyBold,
    color: 'white',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  headerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    ...typography.bodyBold,
    marginRight: spacing[2],
  },
  relationshipEmoji: {
    fontSize: 14,
  },
  lastUpdated: {
    ...typography.caption,
    marginTop: 2,
  },
  hangoutButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  status: {
    ...typography.body,
    marginBottom: spacing[3],
    fontStyle: 'italic',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    flexWrap: 'wrap',
  },
  availabilityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 12,
    marginRight: spacing[2],
  },
  availabilityText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  availabilityMessage: {
    ...typography.caption,
    flex: 1,
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  activityLabel: {
    ...typography.caption,
    marginRight: spacing[2],
    fontWeight: '600',
  },
  activityText: {
    ...typography.caption,
    flex: 1,
  },
  spotifyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  spotifyText: {
    ...typography.caption,
    marginLeft: spacing[1],
    flex: 1,
  },
  plansContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plansLabel: {
    ...typography.caption,
    marginRight: spacing[2],
    fontWeight: '600',
  },
  plansText: {
    ...typography.caption,
    flex: 1,
  },
});
