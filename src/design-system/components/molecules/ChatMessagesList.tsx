/**
 * ChatMessagesList - Molecular Chat Messages Component
 * Responsibility: Handle FlatList, scroll management, and message rendering
 * Extracted from ChatScreen for better maintainability
 */

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  RefreshControl,
  ListRenderItem,
  Animated,
} from 'react-native';
import { spacing } from '../../tokens/spacing';
import { useTheme } from '../../../contexts/ThemeContext';
import ChatMessage from '../atoms/ChatMessage';
import TypingIndicator from '../atoms/TypingIndicator';
import { ShimmerText } from '../atoms/ShimmerText';
import type { Message } from '../../../types/chat';

interface ChatMessagesListProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  typingUsers: string[];
  currentFriendUsername?: string;
  onMessagePress?: (message: Message) => void;
  onMessageLongPress?: (message: Message) => void;
  onScroll?: (isNearBottom: boolean) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  showGreeting: boolean;
  greetingText: string;
  greetingOpacity: Animated.Value;
  greetingAnimY: Animated.Value;
}

export interface ChatMessagesListRef {
  scrollToBottom: (instant?: boolean) => void;
  scrollToOffset: (offset: number, animated?: boolean) => void;
}

export const ChatMessagesList = forwardRef<ChatMessagesListRef, ChatMessagesListProps>(
  ({
    messages,
    isLoading,
    isStreaming,
    typingUsers,
    currentFriendUsername,
    onMessagePress,
    onMessageLongPress,
    onScroll,
    onRefresh,
    refreshing = false,
    showGreeting,
    greetingText,
    greetingOpacity,
    greetingAnimY,
  }, ref) => {
    const { theme, colors } = useTheme();
    const flatListRef = useRef<FlatList>(null);
    const isNearBottomRef = useRef(true);

    // Expose scroll methods to parent
    useImperativeHandle(ref, () => ({
      scrollToBottom: (instant = false) => {
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
      },
      scrollToOffset: (offset: number, animated = true) => {
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToOffset({ offset, animated });
          } catch {
            // Silently handle errors
          }
        }
      },
    }), []);

    // Auto-scroll to bottom when new messages arrive or streaming
    useEffect(() => {
      if ((messages.length > 0 && isNearBottomRef.current) || isStreaming) {
        setTimeout(() => {
          if (flatListRef.current) {
            try {
              flatListRef.current.scrollToOffset({ 
                offset: 99999,
                animated: true
              });
            } catch (error) {
              // Silently handle errors
            }
          }
        }, 100);
      }
    }, [messages.length, isStreaming]);

    const handleScroll = (event: any) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
      const isNearBottom = distanceFromBottom < 100;
      
      isNearBottomRef.current = isNearBottom;
      onScroll?.(isNearBottom);
    };

    const renderMessage: ListRenderItem<Message> = ({ item }) => {
      const isFromCurrentUser = item.sender === 'user' && item.fromMe !== false;
      
      return (
        <ChatMessage
          message={item}
          isFromCurrentUser={isFromCurrentUser}
          onPress={onMessagePress}
          onLongPress={onMessageLongPress}
          isStreaming={isStreaming && item.id === messages[messages.length - 1]?.id}
        />
      );
    };

    const renderGreeting = () => {
      if (!showGreeting) return null;

      return (
        <View style={styles.greetingContainer}>
          <Animated.View
            style={{
              opacity: greetingOpacity,
              transform: [{ translateY: greetingAnimY }],
            }}
          >
            <ShimmerText
              style={{
                ...styles.greetingText,
                color: colors.textSecondary,
              }}
            >
              {greetingText}
            </ShimmerText>
          </Animated.View>
        </View>
      );
    };

    const renderTypingIndicator = () => {
      if (!currentFriendUsername || typingUsers.length === 0) return null;

      const isTyping = typingUsers.includes(currentFriendUsername);
      if (!isTyping) return null;

      return (
        <View style={styles.typingContainer}>
          <TypingIndicator
            visible={true}
            theme={theme}
            username={currentFriendUsername}
          />
        </View>
      );
    };

    const renderFooter = () => (
      <View style={styles.footerContainer}>
        {renderTypingIndicator()}
        <View style={styles.footerSpacer} />
      </View>
    );

    const renderHeader = () => renderGreeting();

    const keyExtractor = (item: Message) => item.id;

    return (
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderMessage}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: spacing.xl * 2 },
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
        maintainVisibleContentPosition={{
          minIndexForVisible: Math.max(0, messages.length - 5),
        }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
        getItemLayout={undefined} // Dynamic heights due to message content
      />
    );
  }
);

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingTop: spacing.lg,
  },
  greetingContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  greetingText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  typingContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footerContainer: {
    minHeight: 60,
  },
  footerSpacer: {
    height: spacing.lg,
  },
});

ChatMessagesList.displayName = 'ChatMessagesList';

export default ChatMessagesList;