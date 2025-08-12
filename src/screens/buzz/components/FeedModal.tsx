/**
 * FeedModal Component
 * Bottom sheet modal for displaying full feed item content
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

// Components
import TypeBadge from './TypeBadge';

// Design System
import { typography } from '../../../design-system/tokens/typography';
import { spacing } from '../../../design-system/tokens/spacing';
import { getGlassmorphicStyle } from '../../../design-system/tokens/glassmorphism';

// Types
import type { FeedItem } from '../hooks/useFeedData';
import type { ThemeColors } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MODAL_HEIGHT = screenHeight * 0.85; // Modal takes 85% of screen
const IMAGE_HEIGHT = screenHeight * 0.35; // Image takes 35% of screen

interface FeedModalProps {
  item: FeedItem;
  visible: boolean;
  onClose: () => void;
  onInteraction: (item: FeedItem, type: 'like' | 'share' | 'save') => void;
  colors: ThemeColors;
  isDarkMode: boolean;
}

const FeedModal: React.FC<FeedModalProps> = ({
  item,
  visible,
  onClose,
  onInteraction,
  colors,
  isDarkMode,
}) => {
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(1.1)).current;

  useEffect(() => {
    if (visible) {
      // Animate modal in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 25,
          stiffness: 120,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.spring(imageScale, {
          toValue: 1,
          damping: 15,
          stiffness: 100,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate modal out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(imageScale, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity, contentOpacity, imageScale]);

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: item.title,
        message: `Check out: ${item.title}\n\n${item.content.substring(0, 200)}...`,
        url: item.url,
      });
      onInteraction(item, 'share');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleOpenLink = () => {
    if (item.url) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(item.url);
    }
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const cardStyle = {
    ...getGlassmorphicStyle('card', isDarkMode ? 'dark' : 'light'),
    backgroundColor: isDarkMode 
      ? 'rgba(26, 26, 26, 0.92)' // Match PageBackground's #1A1A1A
      : 'rgba(255, 255, 255, 0.98)',
    borderWidth: isDarkMode ? 1 : 0,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          activeOpacity={1}
        >
          <BlurView
            intensity={20}
            tint={isDarkMode ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Background Image */}
      {item.imageUrl && (
        <Animated.View
          style={[
            styles.backgroundImageContainer,
            {
              opacity: backdropOpacity,
              transform: [{ scale: imageScale }],
            },
          ]}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.backgroundImage}
            resizeMode="cover"
            blurRadius={Platform.OS === 'ios' ? 20 : 10}
          />
          <View style={[styles.imageOverlay, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }]} />
        </Animated.View>
      )}

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.modalContent, cardStyle]}>
          {/* Handle Bar */}
          <TouchableOpacity onPress={onClose} style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.textTertiary }]} />
          </TouchableOpacity>

          {/* Header */}
          <Animated.View style={[styles.header, { opacity: contentOpacity }]}>
            <View style={styles.headerLeft}>
              {item.imageUrl && (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.artistImage}
                />
              )}
              <View style={styles.artistInfo}>
                <Text style={[styles.artistName, { color: colors.text }]}>
                  {item.artist || 'Unknown Artist'}
                </Text>
                <View style={styles.metaRow}>
                  <TypeBadge type={item.type} colors={colors} isDarkMode={isDarkMode} />
                  <Text style={[styles.source, { color: colors.textSecondary }]}>
                    {item.source}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ opacity: contentOpacity }}>
              {/* Title */}
              <Text style={[styles.title, { color: colors.text }]}>
                {item.title}
              </Text>

              {/* Timestamp */}
              <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                {formatFullDate(item.publishedAt)}
              </Text>

              {/* Featured Image */}
              {item.imageUrl && (
                <View style={styles.featuredImageContainer}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.featuredImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Content */}
              <Text style={[styles.content, { color: colors.textSecondary }]}>
                {item.content}
              </Text>


              {/* Spacer for action bar */}
              <View style={{ height: 100 }} />
            </Animated.View>
          </ScrollView>

          {/* Fixed Action Bar */}
          <Animated.View
            style={[
              styles.actionBar,
              cardStyle,
              { opacity: contentOpacity },
            ]}
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onInteraction(item, 'like');
              }}
            >
              <Ionicons name="heart-outline" size={24} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>Like</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onInteraction(item, 'save');
              }}
            >
              <Ionicons name="bookmark-outline" size={24} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>Save</Text>
            </TouchableOpacity>

            {item.url && (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={handleOpenLink}
              >
                <Ionicons name="open-outline" size={24} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Open</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: IMAGE_HEIGHT,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  artistImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: spacing.md,
  },
  artistInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  artistName: {
    fontFamily: 'MozillaHeadline_600SemiBold',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  source: {
    fontFamily: 'MozillaText_400Regular',
    fontSize: 12,
  },
  closeButton: {
    padding: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontFamily: 'MozillaHeadline_700Bold',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
    lineHeight: 32,
  },
  timestamp: {
    fontFamily: 'MozillaText_400Regular',
    fontSize: 12,
    marginBottom: spacing.lg,
  },
  featuredImageContainer: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.lg,
    height: 200,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    fontFamily: 'MozillaText_400Regular',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  engagementSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  engagementLabel: {
    ...typography.caption,
    marginRight: spacing.md,
  },
  engagementBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  engagementFill: {
    height: '100%',
    borderRadius: 3,
  },
  engagementValue: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.md,
    minWidth: 40,
    textAlign: 'right',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  primaryAction: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    fontFamily: 'MozillaText_400Regular',
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

export default FeedModal;