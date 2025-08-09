/**
 * ChatInputContainer - Simple wrapper for EnhancedChatInput
 * ONLY responsibility: Pass through props to EnhancedChatInput
 * NO additional functionality to preserve original behavior
 */

import React from 'react';
import { EnhancedChatInput } from './EnhancedChatInput';
import { useTheme } from '../../../contexts/ThemeContext';

interface ChatInputContainerProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSend: () => void;
  onFocus: () => void;
  onBlur: () => void;
  attachments: any[];
  onAttachmentsChange: (attachments: any[]) => void;
  isLoading: boolean;
  placeholder?: string;
  currentFriendUsername?: string;
}

export const ChatInputContainer: React.FC<ChatInputContainerProps> = ({
  inputText,
  onInputChange,
  onSend,
  onFocus,
  onBlur,
  attachments,
  onAttachmentsChange,
  isLoading,
  placeholder,
  currentFriendUsername,
}) => {
  const { theme } = useTheme();

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (currentFriendUsername) return `Message ${currentFriendUsername}...`;
    return 'Chat with Aether...';
  };

  // Simple passthrough to EnhancedChatInput - NO additional logic
  return (
    <EnhancedChatInput
      value={inputText}
      onChangeText={onInputChange}
      onSend={onSend}
      onFocus={onFocus}
      onBlur={onBlur}
      placeholder={getPlaceholder()}
      attachments={attachments}
      onAttachmentsChange={onAttachmentsChange}
      isLoading={isLoading}
      theme={theme}
    />
  );
};

export default ChatInputContainer;