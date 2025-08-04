/**
 * Aether - Connections Screen
 * Displays matching users based on AI profile analysis
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Design System
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import { Header } from '../../design-system/components/organisms/Header';
import { LottieLoader } from '../../design-system/components/atoms/LottieLoader';
import ConnectionCard from '../../design-system/components/molecules/ConnectionCard';
import CompatibilityScore from '../../design-system/components/molecules/CompatibilityScore';

// Hooks & Services
import { useTheme } from '../../hooks/useTheme';
import { useMatching } from '../../hooks/useMatching';
import { FriendsAPI } from '../../services/api';

// Tokens
import { designTokens, getThemeColors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import { typography } from '../../design-system/tokens/typography';

interface ConnectionsScreenProps {
  navigation: any;
}

const ConnectionsScreen: React.FC<ConnectionsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const {
    matches,
    userProfile,
    loading,
    error,
    hasProfile,
    fetchMatches,
    fetchUserProfile,
    refreshMatches,
    refreshProfile,
    forceAnalysis,
    getMatchesForUI,
    getProfileForUI,
  } = useMatching();

  const [refreshing, setRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const initializeConnections = async () => {
      // Check if authenticated before making API calls
      const { TokenManager } = await import('../../services/api');
      const token = await TokenManager.getToken();
      if (token) {
        fetchUserProfile();
        fetchMatches();
      }
    };
    
    initializeConnections();
  }, [fetchUserProfile, fetchMatches]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await Promise.all([refreshProfile(), refreshMatches()]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnectUser = async (username: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await FriendsAPI.addFriend(username);
      
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Friend request sent!');
        // Refresh matches to update UI
        await refreshMatches();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', result.message || 'Failed to send friend request');
      }
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to connect');
    }
  };

  const handleForceAnalysis = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await forceAnalysis();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile analysis updated!');
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to update analysis');
    }
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Chat');
    }
  };

  const matchesForUI = getMatchesForUI();
  const profileForUI = getProfileForUI();

  const renderMatch = ({ item }: { item: any }) => (
    <ConnectionCard
      id={item.id}
      name={item.name}
      avatar={item.avatar}
      bannerImage={item.bannerImage}
      bannerColor={item.bannerColor}
      connectionType={item.connectionType}
      connectionQualia={item.connectionQualia}
      sharedInterests={item.sharedInterests}
      distance={item.distance}
      lastSeen={item.lastSeen}
      bio={item.bio}
      theme={theme}
      onConnect={() => handleConnectUser(item.name)}
      onPress={() => {
        // TODO: Navigate to user profile details
        Alert.alert('User Profile', `View ${item.name}'s full profile`);
      }}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather
        name="users"
        size={64}
        color={themeColors.textMuted}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
        {!hasProfile ? 'Building Your Profile' : 'No Matches Yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
        {!hasProfile
          ? 'Chat with Aether to build your profile and find compatible connections'
          : 'Keep chatting to improve your profile and find better matches'
        }
      </Text>
      {!hasProfile && (
        <TouchableOpacity
          style={[styles.buildProfileButton, { backgroundColor: designTokens.brand.primary }]}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={styles.buildProfileButtonText}>Start Chatting</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {profileForUI && (
        <TouchableOpacity
          style={styles.profileToggle}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowProfile(!showProfile);
          }}
        >
          <Text style={[styles.profileToggleText, { color: themeColors.text }]}>
            {showProfile ? 'Hide' : 'Show'} Profile Analysis
          </Text>
          <Feather
            name={showProfile ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={themeColors.text}
          />
        </TouchableOpacity>
      )}
      
      {showProfile && profileForUI && (
        <CompatibilityScore
          overallScore={profileForUI.overallScore}
          breakdown={profileForUI.breakdown}
          variant="compact"
          theme={theme}
          animated={true}
        />
      )}
    </View>
  );

  return (
    <PageBackground theme={theme}>
      <SafeAreaView style={styles.container}>
        <Header
          title="Connections"
          theme={theme}
          showBackButton={true}
          showMenuButton={false}
          onBackPress={handleBackPress}
          rightIcon={
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleForceAnalysis();
              }}
              style={{ padding: 8 }}
            >
              <Feather
                name="refresh-cw"
                size={20}
                color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary}
              />
            </TouchableOpacity>
          }
        />

        <View style={styles.content}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <LottieLoader size="large" />
              <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
                Finding your perfect matches...
              </Text>
            </View>
          ) : (
            <FlatList
              data={matchesForUI}
              renderItem={renderMatch}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={themeColors.text}
                  colors={[designTokens.brand.primary]}
                />
              }
            />
          )}
        </View>
      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 100, // Account for header
  },
  headerContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  profileToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[2],
    marginBottom: spacing[3],
  },
  profileToggleText: {
    ...typography.textStyles.body,
    fontWeight: '500',
    marginRight: spacing[2],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  loadingText: {
    ...typography.textStyles.body,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[12],
  },
  emptyIcon: {
    marginBottom: spacing[4],
  },
  emptyTitle: {
    ...typography.textStyles.headlineMedium,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    ...typography.textStyles.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[6],
  },
  buildProfileButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 16,
  },
  buildProfileButtonText: {
    ...typography.textStyles.body,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ConnectionsScreen;