/**
 * Status Indicators Component
 * Displays typing indicators and web search status
 */

import React from 'react';
import { View } from 'react-native';
import { WebSearchIndicator } from '../../../design-system/components/atoms';
import TypingIndicator from '../../../design-system/components/atoms/TypingIndicator';

interface StatusIndicatorsProps {
  // Web search props
  shouldShowSearchIndicator: boolean;
  isSearching: boolean;
  searchQuery: string;
  searchResults: any[];

  // Typing indicator props
  currentFriendUsername?: string;
  typingUsers: Record<string, boolean>;
  theme: 'light' | 'dark';
}

export const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
  shouldShowSearchIndicator,
  isSearching,
  searchQuery,
  searchResults,
  currentFriendUsername,
  typingUsers,
  theme,
}) => {
  const isTyping = currentFriendUsername && typingUsers[currentFriendUsername];

  return (
    <View>
      {/* Web Search Indicator */}
      {shouldShowSearchIndicator && (
        <WebSearchIndicator
          isSearching={isSearching}
          searchQuery={searchQuery}
          resultCount={searchResults.length}
        />
      )}

      {/* Typing Indicator */}
      {isTyping && currentFriendUsername && (
        <TypingIndicator
          username={currentFriendUsername}
          theme={theme}
          visible={true}
        />
      )}
    </View>
  );
};