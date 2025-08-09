/**
 * Aether - Adaptive Chat Screen (PROPERLY REFACTORED)
 * Maintaining original functionality while using atomic components where appropriate
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Animated,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Keyboard,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

// Enhanced Components
import { EnhancedChatInput } from '../../design-system/components/molecules';
import EnhancedBubble from '../../design-system/components/molecules/EnhancedBubble';
import { Header, HeaderMenu, SignOutModal, HeatmapModal, WalletModal } from '../../design-system/components/organisms';
import { PageBackground } from '../../design-system/components/atoms/PageBackground';
import SettingsModal from './SettingsModal';
import ConversationDrawer from '../../components/ConversationDrawer';
import { ShimmerText } from '../../design-system/components/atoms/ShimmerText';
import { WebSearchIndicator } from '../../design-system/components/atoms';
import TypingIndicator from '../../design-system/components/atoms/TypingIndicator';
import ScrollToBottomButton from '../../design-system/components/atoms/ScrollToBottomButton';

// Design System
import { designTokens } from '../../design-system/tokens/colors';

// Contexts
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { spacing } from '../../design-system/tokens/spacing';
import { useHeaderMenu } from '../../design-system/hooks';

// Custom hooks
import { useGreeting } from '../../hooks/useGreeting';
import { useKeyboardAnimation } from '../../hooks/useKeyboardAnimation';
import { useMessages } from '../../hooks/useMessages';
import { useDynamicPrompts } from '../../hooks/useDynamicPrompts';
import { useWebSearch } from '../../hooks/useWebSearch';
import { useRealTimeMessaging } from '../../hooks/useRealTimeMessaging';

// Types
import type { Message } from '../../types/chat';

// Services
import { FriendsAPI } from '../../services/api';

interface ChatScreenProps {
  route?: {
    params?: {
      friendUsername?: string;
    };
  };
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { theme, colors } = useTheme();
  const { settings } = useSettings();

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const inputContainerAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(1)).current;

  // Core hooks
  const { greetingText, showGreeting, setShowGreeting } = useGreeting();
  const { greetingAnimY, greetingOpacity } = useKeyboardAnimation();

  // Web search hook
  const {
    searchResults,
    isSearching,
    searchQuery,
    shouldShowSearchIndicator,
  } = useWebSearch();

  // Core UI State
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showConversationDrawer, setShowConversationDrawer] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showHeatmapModal, setShowHeatmapModal] = useState(false);

  // Friend/Chat States
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  const [currentFriendUsername, setCurrentFriendUsername] = useState<string | undefined>(
    route?.params?.friendUsername
  );
  const [heatmapFriendUsername, setHeatmapFriendUsername] = useState<string | undefined>(undefined);

  // Add Friend States
  const [isSubmittingFriendRequest, setIsSubmittingFriendRequest] = useState(false);
  const [addFriendError, setAddFriendError] = useState<string | undefined>(undefined);

  // Message handling with streaming
  const {
    messages,
    isLoading,
    isStreaming,
    handleSend: handleMessageSend,
    handleConversationSelect,
    handleHaltStreaming,
    setMessages,
  } = useMessages(() => setShowGreeting(false), currentConversationId, currentFriendUsername);

  // Real-time messaging for friend conversations
  const {
    isConnected: isRealTimeConnected,
    typingUsers,
  } = useRealTimeMessaging({
    friendUsername: currentFriendUsername,
    onNewMessage: (data) => {
      if (data.from === currentFriendUsername) {
        const newMessage: Message = {
          id: data.message.messageId,
          sender: 'user',
          message: data.message.content,
          timestamp: data.message.timestamp.toString(),
          messageId: data.message.messageId,
          fromMe: false,
          from: data.from,
          deliveredAt: data.message.timestamp.toString(),
          status: 'delivered'
        };
        
        setMessages(prev => [...prev, newMessage]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onReadReceipt: (receipt) => {
      setMessages(prev => prev.map(msg => 
        msg.messageId === receipt.messageId 
          ? { ...msg, readAt: receipt.readAt.toString(), status: 'read' as const }
          : msg
      ));
    },
    autoConnect: !!currentFriendUsername
  });

  // Header menu hook
  const { showHeaderMenu, toggleHeaderMenu } = useHeaderMenu({
    screenName: 'chat',
    onSettingsPress: () => setShowSettings(true),
    onSignOut: () => setShowSignOutModal(true),
    onWalletPress: () => setShowWalletModal(true)
  });

  // Route parameter changes for friend username
  useEffect(() => {
    if (route?.params?.friendUsername && route.params.friendUsername !== currentFriendUsername) {
      setMessages([]);
      setCurrentFriendUsername(route.params.friendUsername);
      setCurrentConversationId(undefined);
    }
  }, [route?.params?.friendUsername, currentFriendUsername, setMessages]);

  // Keyboard event listeners for proper scroll behavior
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
      
      // Animate to keyboard position using native driver
      Animated.timing(inputContainerAnim, {
        toValue: -(e.endCoordinates.height - 20),
        duration: 200,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      
      // Animate to hidden position using native driver
      Animated.timing(inputContainerAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [isChatInputFocused]);

  // Scroll to bottom when input is focused and keyboard appears
  useEffect(() => {
    if (isChatInputFocused && keyboardHeight > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  }, [isChatInputFocused, keyboardHeight]);

  // Scroll to bottom function
  const scrollToBottom = (instant = false) => {
    if (flatListRef.current) {
      try {
        flatListRef.current.scrollToOffset({ 
          offset: 99999,
          animated: !instant
        });
      } catch {
        // Silently handle errors
      }
    }
  };

  // Event Handlers
  const handleAddFriendPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddFriendModal(true);
  };

  const handleAddFriendSubmit = async (username: string) => {
    setIsSubmittingFriendRequest(true);
    setAddFriendError(undefined);
    
    try {
      const result = await FriendsAPI.addFriend(username);
      
      if (result && result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowAddFriendModal(false);
      } else {
        throw new Error(result?.error || 'Failed to send friend request');
      }
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAddFriendError(error.message || 'Failed to send friend request');
    } finally {
      setIsSubmittingFriendRequest(false);
    }
  };

  const handleInputTextChange = (text: string) => {
    setInputText(text);
  };

  const handleEnhancedSend = () => {
    if (inputText.trim()) {
      handleMessageSend(inputText.trim());
      setInputText('');
      setAttachments([]);
    }
  };

  const handleInputFocus = () => {
    setIsChatInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsChatInputFocused(false);
  };

  const handleSignOut = async () => {
    navigation.navigate('Auth' as never);
  };

  // Render message item
  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <View style={styles.messageItem}>
      <EnhancedBubble
        message={item}
        index={index}
        theme={theme}
        messageIndex={index}
      />
    </View>
  );

  return (
    <PageBackground theme={theme} variant="chat">
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Header */}
        <Header
          title={currentFriendUsername || 'Aether'}
          showBackButton={!!currentFriendUsername}
          showMenuButton={true}
          showConversationsButton={!currentFriendUsername}
          showDynamicOptionsButton={!currentFriendUsername}
          onBackPress={() => navigation.goBack()}
          onMenuPress={toggleHeaderMenu}
          onConversationsPress={() => setShowConversationDrawer(true)}
          onDynamicOptionsPress={handleAddFriendPress}
          theme={theme}
        />

        {/* Header Menu */}
        <HeaderMenu
          visible={showHeaderMenu}
          onClose={() => toggleHeaderMenu()}
          onAction={(action) => {
            toggleHeaderMenu(); // Close menu first
            
            switch (action) {
              case 'chat':
                if (currentFriendUsername) {
                  setCurrentFriendUsername(undefined);
                  setCurrentConversationId(undefined);
                  setMessages([]);
                }
                break;
              case 'feed':
                navigation.navigate('Feed' as never);
                break;
              case 'friends':
                navigation.navigate('Social' as never);
                break;
              case 'profile':
                navigation.navigate('Profile' as never);
                break;
              case 'wallet':
                setShowWalletModal(true);
                break;
              case 'settings':
                setShowSettings(true);
                break;
              case 'sign_out':
                setShowSignOutModal(true);
                break;
              default:
                console.log('Unknown action:', action);
            }
          }}
        />

        {/* Dynamic Greeting Banner */}
        {greetingText && showGreeting && (
          <Animated.View 
            style={[
              styles.greetingBanner,
              {
                transform: [{ translateY: greetingAnimY }],
                opacity: greetingOpacity,
              }
            ]}
          >
            <ShimmerText 
              style={{
                ...styles.greetingText,
                color: theme === 'dark' ? '#4d4d4dff' : '#8a8a8a',
              }}
              intensity="subtle"
              duration={3000}
              waveWidth="wide"
              enabled={true}
              animationMode="greeting-once"
            >
              {greetingText}
            </ShimmerText>
          </Animated.View>
        )}

        <View style={styles.chatArea}>
          {/* Web Search Indicator */}
          {shouldShowSearchIndicator && (
            <WebSearchIndicator
              isSearching={isSearching}
              searchQuery={searchQuery}
              resultCount={searchResults.length}
            />
          )}
          
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={[
              styles.messagesContainer,
              {
                paddingBottom: isChatInputFocused 
                  ? keyboardHeight + 80
                  : 80,
              }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="never"
            onScrollBeginDrag={() => {
              Keyboard.dismiss();
            }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: headerAnim } } }],
              { 
                useNativeDriver: false,
                listener: (event: any) => {
                  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                  const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
                  setIsNearBottom(distanceFromBottom <= 50);
                }
              }
            )}
            ListFooterComponent={() => {
              const isTyping = currentFriendUsername && typingUsers[currentFriendUsername];
              return isTyping ? (
                <TypingIndicator
                  username={currentFriendUsername!}
                  theme={theme}
                  visible={true}
                />
              ) : null;
            }}
          />
        </View>

        {/* Scroll to bottom button */}
        {!isNearBottom && (
          <ScrollToBottomButton
            visible={!isNearBottom}
            onPress={() => scrollToBottom()}
            theme={theme}
          />
        )}

        {/* Enhanced Chat Input */}
        <Animated.View
          style={[
            styles.inputContainer,
            {
              transform: [{ translateY: inputContainerAnim }],
              backgroundColor: colors.surface,
              borderTopColor: theme === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.1)',
            }
          ]}
        >
          <EnhancedChatInput
            value={inputText}
            onChangeText={handleInputTextChange}
            onSend={handleEnhancedSend}
            isLoading={isLoading}
            isStreaming={isStreaming}
            onHaltStreaming={handleHaltStreaming}
            theme={theme}
            placeholder={currentFriendUsername ? `Chatting with ${currentFriendUsername} •` : "What up?"}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </Animated.View>

        {/* All Modals */}
        <SettingsModal
          visible={showSettings}
          onClose={() => setShowSettings(false)}
        />

        <SignOutModal
          visible={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={handleSignOut}
        />

        <WalletModal
          visible={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          onTierSelect={() => {}}
        />

        <ConversationDrawer
          isVisible={showConversationDrawer}
          onClose={() => setShowConversationDrawer(false)}
          onConversationSelect={(conversation) => handleConversationSelect(conversation as any)}
          currentConversationId={currentConversationId}
          theme={theme}
        />

        <HeatmapModal
          visible={showHeatmapModal}
          onClose={() => setShowHeatmapModal(false)}
          friendUsername={heatmapFriendUsername}
        />

      </SafeAreaView>
    </PageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greetingBanner: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greetingText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  chatArea: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    flexGrow: 1,
    paddingTop: spacing.md,
  },
  messageItem: {
    marginVertical: spacing.xs,
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
});

export default ChatScreen;