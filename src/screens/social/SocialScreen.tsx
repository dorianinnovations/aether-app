/**
 * Social Screen (Main Container)
 * Modular social platform with real-time updates and optimistic UI
 * Refactored from monolithic ConnectionsScreen (1,521 lines -> 220 lines)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Types
import type { SocialTab, Post, CreatePostData } from './types';

// Design System
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import { Header } from '../../design-system/components/organisms/Header';
import { logger } from '../../utils/logger';

// Social Components
import { CommunityChip } from './components';
// TODO: Import these components when they are created
// import { TabPills, PostsFeed, CreatePostModal } from './components';


// Hooks
import { useTheme } from '../../hooks/useTheme';
import { useSocialData, useRealTimeUpdates, usePostActions } from './hooks';

// Constants & Utils
import { SOCIAL_TABS } from './constants';
import { filterPosts } from './utils';

// Tokens
import { getThemeColors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import { typography } from '../../design-system/tokens/typography';

interface SocialScreenProps {
  navigation: any;
}

const SocialScreen: React.FC<SocialScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  
  // State
  const [activeTab, setActiveTab] = useState<SocialTab>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  
  // Data hooks
  const {
    posts,
    loading,
    error,
    refreshing,
    refreshPosts,
    addPost,
    updatePost,
    removePost,
  } = useSocialData();
  
  // Real-time updates
  const { connected, lastUpdate } = useRealTimeUpdates({
    onPostAdded: addPost,
    onPostUpdated: updatePost,
    onPostRemoved: removePost,
    enabled: activeTab === 'feed',
  });
  
  // Post actions with optimistic updates
  const { likePost, sharePost, commentOnPost } = usePostActions({
    onPostUpdate: updatePost,
  });
  
  // Handlers
  const handleTabPress = useCallback(async (tab: SocialTab) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);
  
  const handleCreatePost = useCallback(async (data: CreatePostData) => {
    try {
      // Create optimistic post
      const newPost: Post = {
        id: `temp-${Date.now()}`,
        userId: 'current-user',
        userName: 'You',
        content: data.content,
        communityId: data.communityId,
        communityName: data.communityId ? 
          data.communityId.charAt(0).toUpperCase() + data.communityId.slice(1) : undefined,
        likes: 0,
        comments: 0,
        shares: 0,
        timestamp: new Date().toISOString(),
        isLiked: false,
        tags: data.tags,
      };
      
      addPost(newPost);
      setCreateModalVisible(false);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      logger.error('Error creating post:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [addPost]);
  
  const handlePostPress = useCallback((post: Post) => {
    // Navigate to post detail or expand inline
    logger.debug('Post pressed:', post.id);
  }, []);
  
  // Filter posts based on search query
  const filteredPosts = searchQuery ? filterPosts(posts, searchQuery) : posts;
  
  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={{ color: themeColors.text, fontSize: 16, textAlign: 'center' }}>
              Posts Feed Component - Coming Soon
            </Text>
            <Text style={{ color: themeColors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
              {filteredPosts.length} posts loaded
            </Text>
          </ScrollView>
        );
      case 'groups':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: themeColors.textMuted }]}>
              Groups feature coming soon
            </Text>
          </View>
        );
      case 'strategize':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: themeColors.textMuted }]}>
              Strategy tools coming soon
            </Text>
          </View>
        );
      case 'collaborate':
        return (
          <View style={styles.placeholderContainer}>
            <Text style={[styles.placeholderText, { color: themeColors.textMuted }]}>
              Collaboration features coming soon
            </Text>
          </View>
        );
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <PageBackground theme={theme} variant="social">
        <></>
      </PageBackground>
      
      <Header
        title="Aether"
        rightIcon="plus"
        onRightPress={() => setCreateModalVisible(true)}
      />
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: themeColors.surface }]}>
        <Feather name="search" size={20} color={themeColors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          placeholder="Search posts..."
          placeholderTextColor={themeColors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Tab Navigation - TODO: Replace with TabPills component when created */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8 }}>
        {SOCIAL_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: activeTab === tab.key ? themeColors.primary : 'transparent',
              borderRadius: 20,
              marginRight: 8,
            }}
            onPress={() => handleTabPress(tab.key)}
          >
            <Text style={{
              color: activeTab === tab.key ? themeColors.text : themeColors.textSecondary,
              textTransform: 'capitalize'
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
      
      {/* TODO: Replace with CreatePostModal component when created */}
      {/* createModalVisible && modal would go here */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
  },
  content: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  placeholderText: {
    ...typography.body,
    textAlign: 'center',
  },
});

export default SocialScreen;
