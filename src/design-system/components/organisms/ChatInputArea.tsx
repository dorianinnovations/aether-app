/**
 * ChatInputArea - Simple wrapper for ChatInputContainer
 * ONLY responsibility: Pass through props to ChatInputContainer
 * NO additional functionality to preserve original behavior
 */

import React from 'react';
import ChatInputContainer from '../molecules/ChatInputContainer';

interface ChatInputAreaProps {
  inputText: string;
  onInputChange: (text: string) => void;
  onSend: () => void;
  onFocus: () => void;
  onBlur: () => void;
  attachments: any[];
  onAttachmentsChange: (attachments: any[]) => void;
  isVoiceRecording: boolean;
  onVoiceRecordingChange: (recording: boolean) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  currentFriendUsername?: string;
  keyboardHeight?: number;
  isChatInputFocused?: boolean;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
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
  // Ignore unused props to maintain interface compatibility
}) => {
// No handler needed - direct passthrough

  // Simple passthrough to ChatInputContainer - NO additional logic
  return (
    <ChatInputContainer
      inputText={inputText}
      onInputChange={onInputChange}
      onSend={onSend}
      onFocus={onFocus}
      onBlur={onBlur}
      attachments={attachments}
      onAttachmentsChange={onAttachmentsChange}
      isLoading={isLoading}
      placeholder={placeholder}
      currentFriendUsername={currentFriendUsername}
    />
  );
};

export default ChatInputArea;