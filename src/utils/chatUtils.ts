/**
 * Chat Utility Functions
 * Pure utility functions extracted from ChatScreen for reusability
 */

/**
 * Validates a username input
 * @param username - The username to validate
 * @returns Error message if invalid, null if valid
 */
export const validateUsername = (username: string): string | null => {
  if (!username.trim()) {
    return 'Username is required';
  }
  
  if (username.trim().length < 3) {
    return 'Username must be at least 3 characters';
  }
  
  if (username.trim().length > 20) {
    return 'Username cannot exceed 20 characters';
  }
  
  // Check for valid characters (alphanumeric, underscore, hyphen)
  const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validUsernameRegex.test(username.trim())) {
    return 'Username can only contain letters, numbers, underscores, and hyphens';
  }
  
  return null;
};

/**
 * Checks if message input is valid for sending
 * @param text - Input text
 * @param attachments - Array of attachments
 * @returns True if valid to send, false otherwise
 */
export const isValidMessageInput = (text: string, attachments: any[] = []): boolean => {
  return text.trim().length > 0 || attachments.length > 0;
};

/**
 * Formats message text by trimming whitespace
 * @param text - Raw message text
 * @returns Formatted message text
 */
export const formatMessageText = (text: string): string => {
  return text.trim();
};

/**
 * Finds the index of the last bot message in the messages array
 * @param messages - Array of messages
 * @returns Index of last bot message, or -1 if not found
 */
export const findLastBotMessageIndex = (messages: any[]): number => {
  const lastBotMessage = messages
    .map((msg, index) => ({ msg, index }))
    .reverse()
    .find(({ msg }) => msg.sender === 'aether');
  
  return lastBotMessage ? lastBotMessage.index : -1;
};

/**
 * Determines if typing indicator should be shown
 * @param text - Current input text
 * @param isConnected - Whether real-time connection is active
 * @param hasFriend - Whether chatting with a friend
 * @returns True if should start typing indicator
 */
export const shouldStartTyping = (text: string, isConnected: boolean, hasFriend: boolean): boolean => {
  return hasFriend && text.trim().length > 0 && isConnected;
};

/**
 * Determines if typing indicator should be stopped
 * @param text - Current input text
 * @param hasFriend - Whether chatting with a friend
 * @returns True if should stop typing indicator
 */
export const shouldStopTyping = (text: string, hasFriend: boolean): boolean => {
  return hasFriend && text.trim().length === 0;
};