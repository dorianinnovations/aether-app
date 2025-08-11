/**
 * ChatModalsManager - Organism Modal Management Component
 * Responsibility: Centralize all modal rendering and state management
 * Extracted from ChatScreen for better maintainability
 */

import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import AddFriendModal from '../molecules/AddFriendModal';
import SettingsModal from '../../../screens/chat/SettingsModal';
import ConversationDrawer from '../../../components/ConversationDrawer';
import { SignOutModal, ArtistListeningModal, WalletModal } from '../organisms';
// Remove unused DynamicPrompt import - using any[] for now

interface ChatModalsManagerProps {
  // Add Friend Modal
  showAddFriendModal: boolean;
  onCloseAddFriendModal: () => void;
  onSubmitAddFriend: (username: string) => Promise<void>;
  addFriendLoading: boolean;
  addFriendError?: string;

  // Settings Modal
  showSettings: boolean;
  onCloseSettings: () => void;

  // Sign Out Modal
  showSignOutModal: boolean;
  onCloseSignOutModal: () => void;
  onConfirmSignOut: () => void;

  // Wallet Modal
  showWalletModal: boolean;
  onCloseWalletModal: () => void;

  // Conversation Drawer
  showConversationDrawer: boolean;
  onCloseConversationDrawer: () => void;
  onSelectConversation: (conversationId: string) => void;
  currentConversationId?: string;

  // Artist Listening Modal
  showArtistModal: boolean;
  onCloseArtistModal: () => void;
  artistData?: { id: string; name: string };

  // Dynamic Options Modal
  showDynamicOptionsModal: boolean;
  onCloseDynamicOptionsModal: () => void;
  dynamicPrompts: any[];
  onExecuteDynamicPrompt: (prompt: string) => void;
  isAnalyzingContext: boolean;

  // Modal positioning
  addFriendModalPosition?: { top: number; left: number };
}

export const ChatModalsManager: React.FC<ChatModalsManagerProps> = ({
  // Add Friend Modal
  showAddFriendModal,
  onCloseAddFriendModal,
  onSubmitAddFriend,
  addFriendLoading,
  addFriendError,

  // Settings Modal
  showSettings,
  onCloseSettings,

  // Sign Out Modal
  showSignOutModal,
  onCloseSignOutModal,
  onConfirmSignOut,

  // Wallet Modal
  showWalletModal,
  onCloseWalletModal,

  // Conversation Drawer
  showConversationDrawer,
  onCloseConversationDrawer,
  onSelectConversation,
  currentConversationId,

  // Artist Listening Modal
  showArtistModal,
  onCloseArtistModal,
  artistData,

  // Dynamic Options Modal (if implemented)
  showDynamicOptionsModal,
  onCloseDynamicOptionsModal,
  dynamicPrompts,
  onExecuteDynamicPrompt,
  isAnalyzingContext,

  // Modal positioning
  addFriendModalPosition,
}) => {
  const { theme } = useTheme();

  return (
    <View>
      {/* Add Friend Modal */}
      <AddFriendModal
        visible={showAddFriendModal}
        onClose={onCloseAddFriendModal}
        onSubmit={onSubmitAddFriend}
        isLoading={addFriendLoading}
        error={addFriendError}
        position={addFriendModalPosition}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={onCloseSettings}
      />

      {/* Sign Out Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onClose={onCloseSignOutModal}
        onConfirm={onConfirmSignOut}
        theme={theme}
      />

      {/* Wallet Modal */}
      <WalletModal
        visible={showWalletModal}
        onClose={onCloseWalletModal}
        onTierSelect={() => {}}
      />

      {/* Conversation Drawer */}
      <ConversationDrawer
        isVisible={showConversationDrawer}
        onClose={onCloseConversationDrawer}
        onConversationSelect={(conversation: any) => onSelectConversation(conversation.id || conversation)}
        currentConversationId={currentConversationId}
        theme={'light'}
      />

      {/* Artist Listening Modal */}
      <ArtistListeningModal
        visible={showArtistModal}
        onClose={onCloseArtistModal}
        artistId={artistData?.id}
        artistName={artistData?.name}
        theme={theme}
      />

      {/* Dynamic Options Modal - Placeholder for future implementation */}
      {showDynamicOptionsModal && (
        <View>
          {/* TODO: Implement DynamicOptionsModal component */}
          {/* This would show AI-generated contextual prompts */}
        </View>
      )}
    </View>
  );
};

ChatModalsManager.displayName = 'ChatModalsManager';

export default ChatModalsManager;