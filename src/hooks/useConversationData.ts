/**
 * useConversationData - Data loading and caching for conversations
 * Handles API calls, caching, and real-time updates
 */

import { useState, useCallback } from 'react';
import { log } from '../utils/logger';
import { ConversationAPI, FriendsAPI } from '../services/api';

export interface Conversation {
  _id: string;
  title: string;
  lastActivity: string;
  messageCount: number;
  summary?: string;
  type?: 'aether' | 'friend' | 'custom';
  friendUsername?: string;
  streak?: number;
  lastMessage?: string;
  displayName?: string;
}

interface Friend {
  username: string;
  displayName?: string;
  lastSeen?: string;
  [key: string]: unknown;
}

interface FriendConversationData {
  friendUsername: string;
  friendDisplayName?: string;
  lastMessageTime?: string;
  messageCount?: number;
  lastMessage?: string;
  streak?: number;
}

export const useConversationData = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cache conversations per tab to avoid unnecessary API calls
  const [conversationCache, setConversationCache] = useState<{
    [key: number]: { data: Conversation[], timestamp: number }
  }>({});
  const CACHE_DURATION = 30000; // 30 seconds

  // Load Aether conversations (AI chats)
  const loadAetherConversations = useCallback(async (): Promise<Conversation[]> => {
    try {
      const aetherResponse = await ConversationAPI.getRecentConversations(20);
      
      let conversations: Conversation[] = [];
      
      // Parse the actual response format
      if (aetherResponse.data && aetherResponse.data.data && Array.isArray(aetherResponse.data.data)) {
        conversations = aetherResponse.data.data;
      } else if (aetherResponse.data && Array.isArray(aetherResponse.data)) {
        conversations = aetherResponse.data;
      } else if (Array.isArray(aetherResponse)) {
        conversations = aetherResponse;
      } else if (aetherResponse.conversations) {
        conversations = aetherResponse.conversations;
      } else {
        log.debug('Could not find conversations in response');
        conversations = [];
      }
      
      // If no conversations, try to create a test one
      if (conversations.length === 0) {
        try {
          const testConversationResponse = await ConversationAPI.createConversation('New Chat');
          if (testConversationResponse && testConversationResponse.conversations) {
            conversations = testConversationResponse.conversations;
          }
        } catch (testError) {
          log.debug('Test conversation creation failed:', testError);
        }
      }
      
      return conversations;
    } catch (error: unknown) {
      const errorWithStatus = error as { status?: number };
      if (errorWithStatus.status === 404) {
        log.debug('No conversations found (404), showing empty state');
        return [];
      }
      throw error;
    }
  }, []);

  // Load Friends conversations
  const loadFriendsConversations = useCallback(async (): Promise<Conversation[]> => {
    try {
      // Try to load messaging conversations first
      try {
        const conversationsResponse = await FriendsAPI.getDirectMessageConversations();
        if (conversationsResponse.success && conversationsResponse.conversations) {
          return conversationsResponse.conversations.map((conversation: FriendConversationData) => ({
            _id: `friend-${conversation.friendUsername}`,
            title: conversation.friendDisplayName || conversation.friendUsername,
            lastActivity: conversation.lastMessageTime ? 
              new Date(conversation.lastMessageTime).toLocaleDateString() : 'No messages yet',
            messageCount: conversation.messageCount || 0,
            summary: conversation.lastMessage || `Start chatting with ${conversation.friendDisplayName || conversation.friendUsername}`,
            type: 'friend' as const,
            friendUsername: conversation.friendUsername,
            streak: conversation.streak || 0,
            lastMessage: conversation.lastMessage
          }));
        } else {
          throw new Error('No conversations data in response');
        }
      } catch {
        log.debug('Friend messaging endpoints not available, falling back to friends list');
        
        // Fallback to basic friends list
        const friendsResponse = await FriendsAPI.getFriendsList();
        let friendsList: Friend[] = [];
        
        if (friendsResponse.success && friendsResponse.friends && Array.isArray(friendsResponse.friends)) {
          friendsList = friendsResponse.friends;
        } else if (friendsResponse.success && friendsResponse.data && friendsResponse.data.friends && Array.isArray(friendsResponse.data.friends)) {
          friendsList = friendsResponse.data.friends;
        } else if (Array.isArray(friendsResponse)) {
          friendsList = friendsResponse;
        }
        
        return friendsList.map((friend: Friend) => ({
          _id: `friend-${friend.username}`,
          title: friend.displayName || friend.username,
          lastActivity: friend.lastSeen || 'Recently active',
          messageCount: 0,
          summary: `Start chatting with ${friend.displayName || friend.username}`,
          type: 'friend' as const,
          friendUsername: friend.username,
          streak: 0
        }));
      }
    } catch (error) {
      log.debug('All friend APIs failed:', error);
      return [];
    }
  }, []);

  // Load Orbit conversations (heatmaps)
  const loadOrbitConversations = useCallback(async (): Promise<Conversation[]> => {
    try {
      const friendsResponse = await FriendsAPI.getFriendsList();
      let friendsList: Friend[] = [];
      
      if (friendsResponse.success && friendsResponse.friends && Array.isArray(friendsResponse.friends)) {
        friendsList = friendsResponse.friends;
      } else if (friendsResponse.success && friendsResponse.data && friendsResponse.data.friends && Array.isArray(friendsResponse.data.friends)) {
        friendsList = friendsResponse.data.friends;
      } else if (Array.isArray(friendsResponse)) {
        friendsList = friendsResponse;
      }
      
      return friendsList.map((friend: Friend) => ({
        _id: `orbit-${friend.username}`,
        title: friend.displayName || friend.username,
        lastActivity: 'Tap to view heatmap',
        messageCount: 0,
        summary: `View messaging heatmap with ${friend.displayName || friend.username}`,
        type: 'custom' as const,
        friendUsername: friend.username,
        displayName: friend.displayName
      }));
    } catch (error) {
      log.debug('Orbit friends API failed:', error);
      return [];
    }
  }, []);

  // Main load function
  const loadConversations = useCallback(async (currentTab: number, forceRefresh: boolean = false) => {
    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cached = conversationCache[currentTab];
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
          setConversations(cached.data);
          log.debug(`Using cached data for tab ${currentTab}:`, cached.data.length);
          return;
        }
      }
      
      setIsLoading(true);
      let newConversations: Conversation[] = [];
      
      switch (currentTab) {
        case 0: // Aether - AI conversations
          newConversations = await loadAetherConversations();
          break;
        case 1: // Friends - People conversations
          newConversations = await loadFriendsConversations();
          break;
        case 2: // Orbit - Heatmap functionality
          newConversations = await loadOrbitConversations();
          break;
        default:
          newConversations = [];
      }
      
      // Update cache and state
      setConversationCache(prev => ({
        ...prev,
        [currentTab]: { data: newConversations, timestamp: Date.now() }
      }));
      setConversations(newConversations);
      
    } catch (error) {
      log.error('Failed to load conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationCache, CACHE_DURATION, loadAetherConversations, loadFriendsConversations, loadOrbitConversations]);

  // Delete conversation function
  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      await ConversationAPI.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      log.debug('Deleted conversation:', conversationId);
      return true;
    } catch (error) {
      log.error('Failed to delete conversation:', error);
      return false;
    }
  }, []);

  // Delete all conversations function
  const handleDeleteAllConversations = useCallback(async () => {
    try {
      await ConversationAPI.deleteAllConversations();
      setConversations([]);
      // Clear cache after deleting all
      setConversationCache({});
      log.debug('Deleted all conversations');
      return true;
    } catch (error) {
      log.error('Failed to delete all conversations:', error);
      return false;
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    setConversationCache({});
    setConversations([]);
  }, []);

  // Clear cache for specific tab
  const clearTabCache = useCallback((tabIndex: number) => {
    setConversationCache(prev => {
      const newCache = { ...prev };
      delete newCache[tabIndex];
      return newCache;
    });
  }, []);

  return {
    conversations,
    isLoading,
    loadConversations,
    handleDeleteConversation,
    handleDeleteAllConversations,
    clearCache,
    clearTabCache,
    setConversations, // For real-time updates
  };
};