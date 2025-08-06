import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  RefreshControl,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Header, HeaderMenu } from '../design-system/components/organisms';
import { PageBackground } from '../design-system/components/atoms/PageBackground';
import { LottieLoader } from '../design-system/components/atoms/LottieLoader';
import { logger } from '../utils/logger';
// import { getGlassmorphicStyle } from '../design-system/tokens/glassmorphism';
import { getHeaderMenuShadow } from '../design-system/tokens/shadows';
import { designTokens, getThemeColors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { useTheme } from '../hooks/useTheme';
import { useGhostTyping } from '../hooks/useGhostTyping';
import { useHeaderMenu } from '../design-system/hooks';
import SettingsModal from './chat/SettingsModal';
import * as Haptics from 'expo-haptics';
import { FriendsAPI } from '../services/api';

// Removed unused screenWidth

interface Friend {
  username: string;
  friendId?: string; // For backward compatibility
  name?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
  addedAt?: string;
  topInterests?: string[];
}


interface FriendCardProps {
  friend: Friend;
  theme: 'light' | 'dark';
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, theme }) => {
  const themeColors = getThemeColors(theme);

  return (
    <View style={[
      styles.friendCard,
      {
        backgroundColor: theme === 'dark' 
          ? designTokens.surfaces.dark.elevated 
          : designTokens.surfaces.light.elevated,
        borderColor: theme === 'dark' 
          ? designTokens.borders.dark.subtle 
          : designTokens.borders.light.subtle,
      }
    ]}>
      <View style={[
        styles.avatar,
        {
          backgroundColor: theme === 'dark' 
            ? designTokens.borders.dark.default 
            : designTokens.borders.light.default,
        }
      ]} />
      
      <View style={styles.friendInfo}>
        <Text style={[
          styles.friendName,
          { color: themeColors.text }
        ]}>
          {friend.username}
        </Text>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            {
              backgroundColor: friend.status === 'online' 
                ? designTokens.semantic.success 
                : friend.status === 'away' 
                ? designTokens.semantic.warning 
                : designTokens.text.muted
            }
          ]} />
          <Text style={[
            styles.statusText,
            { color: themeColors.textSecondary }
          ]}>
            {friend.status === 'online' ? 'Online' : 
             friend.status === 'away' ? 'Away' : 
             friend.lastSeen || 'Offline'}
          </Text>
        </View>
      </View>
    </View>
  );
};

// RequestCard component and interface removed (unused)

interface FriendsScreenProps {
  navigation: any;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  // Removed unused activeTab
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  // Removed unused requests
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const { ghostText } = useGhostTyping({
    isInputFocused,
    inputText: friendUsername,
  });

  // Header menu hook
  const { showHeaderMenu, setShowHeaderMenu, handleMenuAction, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'friends',
    onSettingsPress: () => setShowSettingsModal(true),
  });

  // Navigation handlers
  const handleBackPress = () => {
    navigation.goBack();
  };

  // Fetch friends list on component mount
  useEffect(() => {
    const initializeFriends = async () => {
      // Check if authenticated before making API calls
      const { TokenManager } = await import('../services/api');
      const token = await TokenManager.getToken();
      if (token) {
        fetchFriends();
      }
    };
    
    initializeFriends();
    
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  const fetchFriends = async (isRefresh = false) => {
    // Check authentication first
    const { TokenManager } = await import('../services/api');
    const token = await TokenManager.getToken();
    if (!token) {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setLoading(true);
      }
      
      const [friendsResponse, _requestsResponse] = await Promise.all([
        FriendsAPI.getFriendsList(),
        FriendsAPI.getFriendRequests().catch(() => ({ success: false, requests: [] }))
      ]);
      
      if (friendsResponse.success && friendsResponse.friends) {
        setFriends(friendsResponse.friends);
      }
      
      // Friend requests functionality removed for now
      // if (requestsResponse.success && requestsResponse.requests) {
      //   setRequests(requestsResponse.requests);
      // }
    } catch (error: any) {
      logger.error('Error fetching friends:', error);
      // Don't show error for auth failures
      if (error.status !== 401) {
        // Handle other errors if needed
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    await fetchFriends(true);
  };

  const clearStatus = () => {
    setStatusMessage('');
    setStatusType(null);
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleAddFriend = async () => {
    if (!friendUsername.trim()) return;
    
    // Clear any existing status
    setStatusMessage('');
    setStatusType(null);
    
    // Beautiful haptic sequence for adding a friend!
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await FriendsAPI.addFriend(friendUsername.trim());
      
      if (result && result.success) {
        // Success haptic and show success message
        setTimeout(async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 150);
        
        setStatusMessage('Request sent!');
        setStatusType('success');
        setFriendUsername('');
        
        // Refresh friends list
        await fetchFriends();
        
        // Close modal after showing success
        setTimeout(() => {
          setShowAddFriendModal(false);
          setStatusMessage('');
          setStatusType(null);
        }, 1500);
        
      } else {
        // Error haptic and show error message
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // Handle specific error messages
        let errorMsg = 'User not found';
        const errorText = result.message || result.error || '';
        if (errorText.includes('already')) {
          errorMsg = 'Already friends';
        } else if (errorText.includes('yourself')) {
          errorMsg = 'Cannot add yourself';
        } else if (errorText.includes('not found')) {
          errorMsg = 'User not found';
        }
        
        setStatusMessage(errorMsg);
        setStatusType('error');
        setFriendUsername('');
        triggerShake();
        
        // Clear error message after 1 second to allow ghost typing to resume
        statusTimeoutRef.current = setTimeout(() => {
          clearStatus();
        }, 1000);
      }
    } catch (error: any) {
      // Error haptic and show error message
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Handle network/server errors with user-friendly messages
      let errorMsg = 'Something went wrong';
      
      // Check if this is actually an API error response
      if (error.response?.data) {
        const errorData = error.response.data;
        const errorText = errorData.error || errorData.message || '';
        
        if (errorText.toLowerCase().includes('already friends') || errorText.toLowerCase().includes('already')) {
          errorMsg = 'Already friends';
        } else if (errorText.toLowerCase().includes('not found') || error.response.status === 404) {
          errorMsg = 'User not found';
        } else if (errorText.toLowerCase().includes('yourself')) {
          errorMsg = 'Cannot add yourself';
        } else if (error.response.status === 400) {
          // Handle other 400 errors with a more specific message
          errorMsg = errorText || 'Invalid request';
        }
      } else if (error.response?.status >= 500) {
        errorMsg = 'Server busy, try again';
      } else if (!error.response) {
        errorMsg = 'Network error, try again in a few minutes';
      }
      
      setStatusMessage(errorMsg);
      setStatusType('error');
      setFriendUsername('');
      triggerShake();
      
      // Clear error message after 1 second to allow ghost typing to resume
      statusTimeoutRef.current = setTimeout(() => {
        clearStatus();
      }, 1000);
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <FriendCard friend={item} theme={theme} />
  );

  const keyExtractor = (item: Friend) => item.username;

  // Empty state component
  const renderEmptyState = () => {
    const themeColors = getThemeColors(theme);
    
    return (
      <View style={styles.emptyContainer}>
        <View style={[
          styles.emptyIconContainer,
          {
            backgroundColor: theme === 'dark' 
              ? designTokens.surfaces.dark.elevated 
              : designTokens.surfaces.light.elevated,
            borderColor: theme === 'dark' 
              ? designTokens.borders.dark.subtle 
              : designTokens.borders.light.subtle,
          }
        ]}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={48}
            color={theme === 'dark' ? designTokens.text.mutedDark : designTokens.text.muted}
          />
        </View>
        
        <Text style={[
          styles.emptyTitle,
          { color: themeColors.text }
        ]}>
          No friends yet
        </Text>
        
        <Text style={[
          styles.emptySubtitle,
          { color: themeColors.textSecondary }
        ]}>
          Add friends to start connecting and chatting
        </Text>
        
        <TouchableOpacity
          style={[
            styles.emptyActionButton,
            {
              backgroundColor: theme === 'dark' ? designTokens.brand.surfaceDark : designTokens.brand.primary,
              borderColor: theme === 'dark' ? designTokens.borders.dark.default : 'transparent',
              borderWidth: theme === 'dark' ? 1 : 0,
            }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddFriendModal(true);
            // Focus input after modal opens
            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
          }}
        >
          <Feather
            name="user-plus"
            size={16}
            color={theme === 'dark' ? '#ffffff' : '#1a1a1a'}
            style={{ marginRight: spacing[2] }}
          />
          <Text style={[
            styles.emptyActionText,
            { color: theme === 'dark' ? '#ffffff' : '#1a1a1a' }
          ]}>
            Add your first friend
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Custom refresh control with Lottie spinner
  const renderRefreshControl = () => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="transparent" // Hide default spinner
      colors={['transparent']} // Hide default spinner on Android
      style={{ backgroundColor: 'transparent' }}
      progressViewOffset={60} // Adjust offset for custom spinner
    />
  );

  return (
    <PageBackground theme={theme} variant="friends">
      <SafeAreaView style={styles.container}>
        <Header
          title="Aether"
          theme={theme}
          showBackButton={true}
          showMenuButton={true}
          onBackPress={handleBackPress}
          onMenuPress={toggleHeaderMenu}
          isMenuOpen={showHeaderMenu}
          rightIcon={
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddFriendModal(true);
              }}
              style={{ padding: 8 }}
            >
              <Feather
                name="user-plus"
                size={20}
                color={theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.secondary}
              />
            </TouchableOpacity>
          }
        />
        
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <LottieLoader size="large" />
            </View>
          ) : (
            <>
              {/* Custom Lottie refresh spinner */}
              {refreshing && (
                <View style={[
                  styles.refreshSpinner,
                  {
                    top: 133, // Position below header
                  }
                ]}>
                  <LottieLoader
                    size={40}
                  />
                </View>
              )}
              
              <FlatList
                data={friends}
                renderItem={renderFriend}
                keyExtractor={keyExtractor}
                style={styles.friendsList}
                contentContainerStyle={[
                  styles.friendsListContent,
                  friends.length === 0 && { flex: 1, justifyContent: 'center' }
                ]}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={renderEmptyState}
                refreshControl={renderRefreshControl()}
              />
            </>
          )}
        </View>
      </SafeAreaView>

      {/* Add Friend Dropdown */}
      <Modal
        visible={showAddFriendModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowAddFriendModal(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowAddFriendModal(false)}
          />
          
          <View style={[
            styles.dropdown,
            {
              alignSelf: 'center',
              top: '20%',
              marginTop: 40, // Position below the "Add your first friend" button
              backgroundColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
              borderWidth: 1,
              borderColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
              ...getHeaderMenuShadow(theme),
            }
          ]}>
            {/* Arrow pointing down from the bottom */}
            <View style={{ position: 'absolute', bottom: -9, alignSelf: 'center' }}>
              {/* Border triangle (slightly larger) */}
              <View style={[
                styles.arrow,
                {
                  borderTopColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
                  borderLeftWidth: 9,
                  borderRightWidth: 9,
                  borderTopWidth: 9,
                  borderBottomWidth: 0,
                }
              ]} />
              {/* Fill triangle (smaller, on top) */}
              <View style={[
                styles.arrow,
                {
                  borderTopColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
                  position: 'absolute',
                  top: -1,
                  left: -0.5,
                  borderLeftWidth: 8,
                  borderRightWidth: 8,
                  borderTopWidth: 8,
                  borderBottomWidth: 0,
                }
              ]} />
            </View>
            
            <View style={styles.dropdownContent}>
              <Text style={[
                styles.dropdownTitle,
                { 
                  color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary,
                  fontFamily: 'Nunito-SemiBold',
                  letterSpacing: -0.5,
                }
              ]}>
                Add a friend
              </Text>
              
              <Animated.View
                style={{
                  transform: [{ translateX: shakeAnim }]
                }}
              >
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.friendInput,
                    {
                      color: statusType === 'error' ? '#FF4444' : statusType === 'success' ? '#00AA44' : (theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary),
                      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8f8f8',
                      borderColor: statusType === 'error' ? '#FF4444' : statusType === 'success' ? '#00AA44' : (theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default),
                    }
                  ]}
                  placeholder={statusMessage || ghostText}
                  placeholderTextColor={statusType === 'error' ? '#FF4444' : statusType === 'success' ? '#00AA44' : (theme === 'dark' ? designTokens.text.mutedDark : designTokens.text.muted)}
                  value={friendUsername}
                  onChangeText={(text) => {
                    setFriendUsername(text);
                    // Clear status when user starts typing
                    if (statusMessage) {
                      clearStatus();
                    }
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                  selectionColor={theme === 'dark' ? '#ffffff' : '#007AFF'}
                  cursorColor={theme === 'dark' ? '#ffffff' : '#007AFF'}
                  textAlign="center"
                  editable={!statusMessage} // Disable input while showing status
                />
              </Animated.View>
              
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    backgroundColor: theme === 'dark' ? '#0d0d0d' : designTokens.brand.primary,
                    borderColor: theme === 'dark' ? '#262626' : 'transparent',
                    borderWidth: theme === 'dark' ? 1 : 0,
                    // Strong tight glow for dark mode, shadow for light mode
                    shadowColor: theme === 'dark' ? '#ffffff' : '#000000',
                    shadowOffset: { width: 0, height: theme === 'dark' ? 0 : 2 },
                    shadowOpacity: theme === 'dark' ? 0.4 : 0.15,
                    shadowRadius: theme === 'dark' ? 2 : 4,
                    elevation: theme === 'dark' ? 8 : 3,
                  }
                ]}
                onPress={handleAddFriend}
                activeOpacity={0.8}
              >
                <Feather
                  name="link"
                  size={18}
                  color={theme === 'dark' ? '#ffffff' : '#1a1a1a'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header Menu */}
      <HeaderMenu
        visible={showHeaderMenu}
        onClose={() => setShowHeaderMenu(false)}
        onAction={handleMenuAction}
        showAuthOptions={false}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        navigation={navigation}
      />
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 113, // Account for header height
    paddingHorizontal: spacing[4],
  },
  friendsList: {
    flex: 1,
  },
  friendsListContent: {
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48, // Increased from 36 to 48px for more height
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 8,
    borderWidth: 1,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing[3],
  },
  friendInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '400',
  },
  separator: {
    height: spacing[2],
  },
  refreshSpinner: {
    position: 'absolute',
    left: '50%',
    marginLeft: -20, // Half the spinner size to center it
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    width: 280,
    borderRadius: 16,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    overflow: 'visible',
  },
  arrow: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  dropdownContent: {
    paddingTop: spacing[2],
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  friendInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  addButton: {
    width: '100%',
    height: 37,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[6],
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[8],
    maxWidth: 280,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    height: 37,
    borderRadius: 8,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyActionText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FriendsScreen;