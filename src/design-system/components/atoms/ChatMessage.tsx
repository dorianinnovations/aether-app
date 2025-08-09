/**
 * ChatMessage - Atomic Chat Message Component
 * Single responsibility: Display individual chat messages
 * Extracted from ChatScreen for better maintainability
 */

import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { spacing } from '../../tokens/spacing';
import { useTheme } from '../../../contexts/ThemeContext';
import EnhancedBubble from '../molecules/EnhancedBubble';
import type { Message } from '../../../types/chat';

interface ChatMessageProps {
  message: Message;
  isFromCurrentUser: boolean;
  onPress?: (message: Message) => void;
  onLongPress?: (message: Message) => void;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isFromCurrentUser,
  onPress,
  onLongPress,
  isStreaming = false,
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    onPress?.(message);
  };

  const handleLongPress = () => {
    onLongPress?.(message);
  };

  return (
    <TouchableOpacity
      style={[
        styles.messageContainer,
        isFromCurrentUser ? styles.userMessage : styles.aiMessage,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
    >
      <EnhancedBubble
        message={{
          ...message,
          text: message.message,
          isStreaming,
        }}
        theme={theme}
        index={0}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
});

export default ChatMessage;