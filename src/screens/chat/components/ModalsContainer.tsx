/**
 * Modals Container Component
 * Manages all modal components for the chat screen
 */

import React from 'react';
import { View } from 'react-native';
import SettingsModal from '../SettingsModal';
import { SignOutModal, ArtistListeningModal, WalletModal } from '../../../design-system/components/organisms';
import ConversationDrawer from '../../../components/ConversationDrawer';
import { AddFriendModal } from './AddFriendModal';
import { AuthAPI } from '../../../services/api';
import { logger } from '../../../utils/logger';
import type { Message } from '../../../types/chat';

interface ModalsContainerProps {
  // Settings Modal
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  
  // SignOut Modal
  showSignOutModal: boolean;
  setShowSignOutModal: (show: boolean) => void;
  
  // Wallet Modal
  showWalletModal: boolean;
  setShowWalletModal: (show: boolean) => void;
  
  // Artist Modal
  showArtistModal: boolean;
  setShowArtistModal: (show: boolean) => void;
  artistData?: { id: string; name: string };
  
  // Conversation Drawer
  showConversationDrawer: boolean;
  setShowConversationDrawer: (show: boolean) => void;
  
  // Friend Request Modal
  friendRequest: any; // Using any since we have the hook structure
  
  // Theme
  theme: 'light' | 'dark';
  
  // Navigation
  navigation: any;
  
  // Chat state management
  setMessages: (messages: Message[]) => void;
  setCurrentConversationId: (id: string | undefined) => void;
  setCurrentFriendUsername: (username: string | undefined) => void;
  setArtistData: (data: { id: string; name: string } | undefined) => void;
  currentFriendUsername?: string;
  
  // Callbacks
  onStartNewChat: () => Promise<void>;
}

export const ModalsContainer: React.FC<ModalsContainerProps> = ({
  showSettings,
  setShowSettings,
  showSignOutModal,
  setShowSignOutModal,
  showWalletModal,
  setShowWalletModal,
  showArtistModal,
  setShowArtistModal,
  artistData,
  showConversationDrawer,
  setShowConversationDrawer,
  friendRequest,
  theme,
  navigation,
  setMessages,
  setCurrentConversationId,
  setCurrentFriendUsername,
  setArtistData,
  currentFriendUsername,
  onStartNewChat,
}) => {
  const handleSignOut = async () => {
    try {
      await AuthAPI.logout();
      // Auth check in App.tsx will handle navigation automatically
      setTimeout(() => {
        setShowSignOutModal(false);
      }, 1000);
    } catch (error) {
      logger.error('Sign out error:', error);
      setShowSignOutModal(false);
    }
  };

  const handleFriendMessagePress = (friendUsername: string) => {
    setMessages([]);
    setCurrentConversationId(undefined);
    setCurrentFriendUsername(friendUsername);
    setShowConversationDrawer(false);
  };

  const handleConversationSelect = (conversation: any) => {
    if (conversation.type === 'friend' && conversation.friendUsername) {
      logger.debug('Selecting friend conversation:', conversation.friendUsername);
      setCurrentConversationId(undefined);
      setCurrentFriendUsername(conversation.friendUsername);
      setShowConversationDrawer(false);
    } else if (conversation.type === 'custom' && conversation._id.startsWith('orbit-')) {
      logger.debug('Orbit conversation selected, showing artist listening for:', conversation.friendUsername);
      setArtistData({ id: `spotify_${conversation.friendUsername}`, name: `${conversation.friendUsername}'s Music` });
      setShowArtistModal(true);
      setShowConversationDrawer(false);
    } else {
      logger.debug('Selecting regular conversation:', conversation._id);
      setMessages([]);
      setCurrentConversationId(conversation._id);
      setCurrentFriendUsername(undefined);
      setShowConversationDrawer(false);
    }
  };

  return (
    <View>
      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onSignOut={() => setShowSignOutModal(true)}
        navigation={navigation}
      />
      
      {/* SignOut Confirmation Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
        theme={theme}
      />

      {/* Wallet Modal */}
      <WalletModal
        visible={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onTierSelect={(tier) => {
          console.log(`Selected tier: ${tier}`);
        }}
      />
      
      {/* Artist Listening Modal */}
      {artistData && (
        <ArtistListeningModal
          visible={showArtistModal}
          onClose={() => {
            setShowArtistModal(false);
            setArtistData(undefined);
          }}
          artistId={artistData.id}
          artistName={artistData.name}
        />
      )}
      
      {/* Conversation Drawer */}
      <ConversationDrawer
        isVisible={showConversationDrawer}
        onClose={() => setShowConversationDrawer(false)}
        onFriendMessagePress={handleFriendMessagePress}
        onConversationSelect={handleConversationSelect}
        onStartNewChat={onStartNewChat}
        theme={theme}
      />
      
      {/* Add Friend Modal */}
      <AddFriendModal
        friendRequest={friendRequest}
        theme={theme}
      />
    </View>
  );
};