/**
 * Chat Input Area Component
 * Wraps the enhanced chat input with proper styling and animations
 */

import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { EnhancedChatInput } from '../../../design-system/components/molecules';
import { designTokens } from '../../../design-system/tokens/colors';
import type { Message } from '../../../types/chat';

interface ChatInputAreaProps {
  // Input state
  inputText: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  
  // Voice handling
  onVoiceStart: () => void;
  onVoiceEnd: () => void;
  
  // Loading states
  isLoading: boolean;
  isStreaming: boolean;
  onHaltStreaming: () => void;
  
  // UI
  theme: 'light' | 'dark';
  placeholder: string;
  
  // Attachments
  attachments: any[];
  onAttachmentsChange: (attachments: any[]) => void;
  
  // Focus handling
  onFocus: () => void;
  onBlur: () => void;
  
  // Messages context
  messages: Message[];
  
  // Animations
  inputContainerAnim: Animated.Value;
  keyboardHeight: number;
  
  // Additional props
  onSwipeUp?: () => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  inputText,
  onChangeText,
  onSend,
  onVoiceStart,
  onVoiceEnd,
  isLoading,
  isStreaming,
  onHaltStreaming,
  theme,
  placeholder,
  attachments,
  onAttachmentsChange,
  onFocus,
  onBlur,
  messages,
  inputContainerAnim,
  keyboardHeight,
  onSwipeUp,
}) => {
  return (
    <Animated.View 
      style={[
        styles.inputContainer,
        {
          transform: [{
            translateY: inputContainerAnim
          }],
          backgroundColor: theme === 'dark' ? designTokens.brand.surfaceDark : '#ffffff',
          borderTopColor: theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(0, 0, 0, 0.08)',
          borderLeftColor: theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(0, 0, 0, 0.08)',
          borderRightColor: theme === 'dark' 
            ? 'rgba(255, 255, 255, 0.08)' 
            : 'rgba(0, 0, 0, 0.08)',
          shadowOpacity: theme === 'dark' ? 0.4 : 0.15,
          marginBottom: keyboardHeight > 0 ? keyboardHeight : 0,
        }
      ]}
    >
      <View style={styles.inputWrapper}>
        <EnhancedChatInput
          value={inputText}
          onChangeText={onChangeText}
          onSend={onSend}
          onVoiceStart={onVoiceStart}
          onVoiceEnd={onVoiceEnd}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onHaltStreaming={onHaltStreaming}
          theme={theme}
          placeholder={placeholder}
          nextMessageIndex={messages.length}
          voiceEnabled={false}
          enableFileUpload={true}
          maxAttachments={5}
          attachments={attachments}
          onAttachmentsChange={onAttachmentsChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onSwipeUp={onSwipeUp}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  inputWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    paddingBottom: 34, // Account for safe area
  },
});