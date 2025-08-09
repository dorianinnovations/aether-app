/**
 * ChatMessagesArea - Organism Chat Messages Component
 * Responsibility: Complete message display area with scroll control and indicators
 * Extracted from ChatScreen for better maintainability
 */

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../tokens/spacing';
import { useTheme } from '../../../contexts/ThemeContext';
import ChatMessagesList, { ChatMessagesListRef } from '../molecules/ChatMessagesList';
import ScrollToBottomButton from '../atoms/ScrollToBottomButton';
import ConnectionStatusIndicator from '../atoms/ConnectionStatusIndicator';
import { WebSearchIndicator } from '../atoms';
import type { Message } from '../../../types/chat';

interface ChatMessagesAreaProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  typingUsers: string[];
  currentFriendUsername?: string;
  isRealTimeConnected: boolean;
  isReconnecting?: boolean;
  isSearching: boolean;
  searchQuery?: string;
  shouldShowSearchIndicator: boolean;
  showGreeting: boolean;
  greetingText: string;
  greetingOpacity: any; // Animated.Value
  greetingAnimY: any; // Animated.Value
  isNearBottom: boolean;
  onMessagePress?: (message: Message) => void;
  onMessageLongPress?: (message: Message) => void;
  onScroll?: (isNearBottom: boolean) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onScrollToBottom?: () => void;
}

export interface ChatMessagesAreaRef {
  scrollToBottom: (instant?: boolean) => void;
  scrollToOffset: (offset: number, animated?: boolean) => void;
}

export const ChatMessagesArea = forwardRef<ChatMessagesAreaRef, ChatMessagesAreaProps>(
  ({
    messages,
    isLoading,
    isStreaming,
    typingUsers,
    currentFriendUsername,
    isRealTimeConnected,
    isReconnecting = false,
    isSearching,
    searchQuery,
    shouldShowSearchIndicator,
    showGreeting,
    greetingText,
    greetingOpacity,
    greetingAnimY,
    isNearBottom,
    onMessagePress,
    onMessageLongPress,
    onScroll,
    onRefresh,
    refreshing = false,
    onScrollToBottom,
  }, ref) => {
    const { theme, colors } = useTheme();
    const messagesListRef = useRef<ChatMessagesListRef>(null);

    // Expose scroll methods to parent
    useImperativeHandle(ref, () => ({
      scrollToBottom: (instant = false) => {
        messagesListRef.current?.scrollToBottom(instant);
      },
      scrollToOffset: (offset: number, animated = true) => {
        messagesListRef.current?.scrollToOffset(offset, animated);
      },
    }), []);

    const handleScrollToBottom = () => {
      messagesListRef.current?.scrollToBottom(false);
      onScrollToBottom?.();
    };

    const showScrollButton = !isNearBottom && messages.length > 5;
    const showConnectionStatus = currentFriendUsername && (!isRealTimeConnected || isReconnecting);

    return (
      <View style={styles.container}>
        {/* Connection Status Indicator */}
        {showConnectionStatus && (
          <View style={styles.statusContainer}>
            <ConnectionStatusIndicator
              isConnected={isRealTimeConnected}
              isReconnecting={isReconnecting}
              showText={true}
              compact={false}
            />
          </View>
        )}

        {/* Web Search Indicator */}
        {shouldShowSearchIndicator && (
          <View style={styles.searchIndicatorContainer}>
            <WebSearchIndicator
              isSearching={isSearching}
              searchQuery={searchQuery}
            />
          </View>
        )}

        {/* Messages List */}
        <ChatMessagesList
          ref={messagesListRef}
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          typingUsers={typingUsers}
          currentFriendUsername={currentFriendUsername}
          onMessagePress={onMessagePress}
          onMessageLongPress={onMessageLongPress}
          onScroll={onScroll}
          onRefresh={onRefresh}
          refreshing={refreshing}
          showGreeting={showGreeting}
          greetingText={greetingText}
          greetingOpacity={greetingOpacity}
          greetingAnimY={greetingAnimY}
        />

        {/* Scroll to Bottom Button */}
        <ScrollToBottomButton
          visible={showScrollButton}
          onPress={handleScrollToBottom}
          theme={theme}
          style={styles.scrollButton}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  statusContainer: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    zIndex: 10,
  },
  searchIndicatorContainer: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    zIndex: 15,
  },
  scrollButton: {
    position: 'absolute',
    bottom: spacing.xl * 2,
    alignSelf: 'center',
    zIndex: 100,
  },
});

ChatMessagesArea.displayName = 'ChatMessagesArea';

export default ChatMessagesArea;