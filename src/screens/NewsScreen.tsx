/**
 * NewsScreen - Simple Event-Driven News Feed
 * Displays server-triggered news posts/events in a basic list
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  RefreshControl,
  SafeAreaView,
} from 'react-native';

// Contexts
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

// Design System Components
import { PageBackground } from '../design-system/components/atoms/PageBackground';
import { Header, HeaderMenu } from '../design-system/components/organisms';

// Design System Tokens
import { spacing } from '../design-system/tokens/spacing';
import { typography } from '../design-system/tokens/typography';
import { getThemeColors } from '../design-system/tokens/colors';

// Hooks
import { useHeaderMenu } from '../design-system/hooks';

// Types
import { NewsPost } from '../types/social';

// Services (for future server integration)
// import { sseService } from '../services/sseService';

interface NewsScreenProps {}

const NewsScreen: React.FC<NewsScreenProps> = () => {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const colors = getThemeColors(theme);
  
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Header menu integration
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'news',
  });

  // Mock data for now - will be replaced with server events
  useEffect(() => {
    const mockPosts: NewsPost[] = [
      {
        id: '1',
        title: 'System Update',
        content: 'Welcome to the new News feed! Server events will appear here.',
        timestamp: new Date().toISOString(),
        priority: 'medium',
        category: 'system',
      },
    ];
    
    setNewsPosts(mockPosts);
    setLoading(false);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // TODO: Implement server event polling or SSE connection
    // For now, just simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderNewsPost = ({ item }: { item: NewsPost }) => (
    <View style={[
      styles.postCard,
      {
        backgroundColor: colors.surface,
        borderColor: colors.borders.default,
      }
    ]}>
      {/* Priority indicator */}
      <View style={[
        styles.priorityIndicator,
        {
          backgroundColor: getPriorityColor(item.priority, theme),
        }
      ]} />
      
      {/* Post content */}
      <View style={styles.postContent}>
        <Text style={[
          styles.postTitle,
          typography.textStyles.headlineSmall,
          { color: colors.text }
        ]}>
          {item.title}
        </Text>
        
        <Text style={[
          styles.postText,
          typography.textStyles.bodyMedium,
          { color: colors.textSecondary }
        ]}>
          {item.content}
        </Text>
        
        <View style={styles.postMeta}>
          {item.category && (
            <Text style={[
              styles.category,
              typography.textStyles.labelSmall,
              { color: colors.textMuted }
            ]}>
              {item.category.toUpperCase()}
            </Text>
          )}
          
          <Text style={[
            styles.timestamp,
            typography.textStyles.labelSmall,
            { color: colors.textMuted }
          ]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[
        styles.emptyTitle,
        typography.textStyles.headlineMedium,
        { color: colors.textMuted }
      ]}>
        No news yet
      </Text>
      <Text style={[
        styles.emptyDescription,
        typography.textStyles.bodyMedium,
        { color: colors.textMuted }
      ]}>
        Server events and notifications will appear here
      </Text>
    </View>
  );

  return (
    <PageBackground theme={theme} variant="news">
      <SafeAreaView style={styles.container}>
        <FlatList
          data={newsPosts}
          renderItem={renderNewsPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={!loading ? renderEmptyState : null}
          showsVerticalScrollIndicator={false}
        />

        {/* Header with menu functionality */}
        <Header
          title="News"
          showMenuButton={true}
          onMenuPress={toggleHeaderMenu}
          theme={theme}
          isMenuOpen={showHeaderMenu}
        />

        {/* Header Menu */}
        <HeaderMenu
          visible={showHeaderMenu}
          onClose={() => setShowHeaderMenu(false)}
          onAction={handleMenuAction}
          showAuthOptions={true}
        />
      </SafeAreaView>
    </PageBackground>
  );
};

// Helper functions
const getPriorityColor = (priority: NewsPost['priority'], theme: 'light' | 'dark'): string => {
  const colors = {
    low: theme === 'dark' ? '#4CAF50' : '#8BC34A',
    medium: theme === 'dark' ? '#FF9800' : '#FFC107',
    high: theme === 'dark' ? '#FF5722' : '#F44336',
    urgent: theme === 'dark' ? '#E91E63' : '#C2185B',
  };
  
  return colors[priority];
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: 120, // Account for header
    paddingBottom: spacing[6],
    flexGrow: 1,
  },
  postCard: {
    flexDirection: 'row',
    marginBottom: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  priorityIndicator: {
    width: 4,
    minHeight: '100%',
  },
  postContent: {
    flex: 1,
    padding: spacing[4],
  },
  postTitle: {
    marginBottom: spacing[2],
  },
  postText: {
    marginBottom: spacing[3],
    lineHeight: 20,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  timestamp: {
    opacity: 0.8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
  emptyTitle: {
    marginBottom: spacing[2],
  },
  emptyDescription: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});

export default NewsScreen;