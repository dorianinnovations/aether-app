/**
 * Conversation Title Generation Hook
 * Automatically generates smart titles for new conversations
 */

import { useCallback, useRef } from 'react';
import { ChatAPI } from '../services/apiModules/endpoints/chat';
import { log } from '../utils/logger';

interface TitleGenerationOptions {
  enabled?: boolean;
  debounceMs?: number;
}

export const useConversationTitleGeneration = (options: TitleGenerationOptions = {}) => {
  const { enabled = true, debounceMs = 1000 } = options;
  const titleGenerationTimeouts = useRef<{ [conversationId: string]: NodeJS.Timeout }>({});
  const generatedTitles = useRef<{ [conversationId: string]: string }>({});

  const generateTitle = useCallback(async (
    conversationId: string,
    firstMessage: string
  ): Promise<string | null> => {
    if (!enabled || !firstMessage.trim()) {
      return null;
    }

    try {
      log.debug('Generating title for conversation:', conversationId);
      
      // Generate the title
      const title = await ChatAPI.generateConversationTitle(firstMessage);
      
      // Cache the generated title
      generatedTitles.current[conversationId] = title;
      
      // Optionally update the backend (you'll need to implement the backend endpoint)
      try {
        await ChatAPI.updateConversationTitle(conversationId, title);
        log.debug('Updated conversation title on backend:', title);
      } catch (error) {
        log.warn('Failed to update title on backend (using local only):', error);
      }
      
      return title;
    } catch (error) {
      log.error('Failed to generate conversation title:', error);
      return null;
    }
  }, [enabled]);

  const generateTitleDebounced = useCallback((
    conversationId: string,
    firstMessage: string,
    onTitleGenerated?: (title: string) => void
  ) => {
    if (!enabled) return;

    // Clear existing timeout for this conversation
    if (titleGenerationTimeouts.current[conversationId]) {
      clearTimeout(titleGenerationTimeouts.current[conversationId]);
    }

    // Set new debounced timeout
    titleGenerationTimeouts.current[conversationId] = setTimeout(async () => {
      const title = await generateTitle(conversationId, firstMessage);
      if (title && onTitleGenerated) {
        onTitleGenerated(title);
      }
      
      // Clean up timeout reference
      delete titleGenerationTimeouts.current[conversationId];
    }, debounceMs);
  }, [enabled, debounceMs, generateTitle]);

  const getCachedTitle = useCallback((conversationId: string): string | null => {
    return generatedTitles.current[conversationId] || null;
  }, []);

  const clearCache = useCallback((conversationId?: string) => {
    if (conversationId) {
      delete generatedTitles.current[conversationId];
      if (titleGenerationTimeouts.current[conversationId]) {
        clearTimeout(titleGenerationTimeouts.current[conversationId]);
        delete titleGenerationTimeouts.current[conversationId];
      }
    } else {
      // Clear all
      generatedTitles.current = {};
      Object.values(titleGenerationTimeouts.current).forEach(clearTimeout);
      titleGenerationTimeouts.current = {};
    }
  }, []);

  return {
    generateTitle,
    generateTitleDebounced,
    getCachedTitle,
    clearCache,
    isEnabled: enabled,
  };
};