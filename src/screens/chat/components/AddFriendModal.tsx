/**
 * Add Friend Modal Component
 * Modal for adding friends by username with validation and status feedback
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { designTokens } from '../../../design-system/tokens/colors';
import { getHeaderMenuShadow } from '../../../design-system/tokens/shadows';
import { typography } from '../../../design-system/tokens/typography';

interface AddFriendModalProps {
  friendRequest: {
    shouldRenderAddFriendModal: boolean;
    showAddFriendModal: boolean;
    setShowAddFriendModal: (show: boolean) => void;
    friendUsername: string;
    setFriendUsername: (username: string) => void;
    isInputFocused: boolean;
    setIsInputFocused: (focused: boolean) => void;
    statusMessage: string;
    statusType: 'success' | 'error' | 'warning' | 'loading' | null;
    isSubmittingFriendRequest: boolean;
    validationError: string;
    shakeAnim: Animated.Value;
    addFriendModalOpacity: Animated.Value;
    handleAddFriendSubmit: () => Promise<void>;
    clearStatus: () => void;
  };
  theme: 'light' | 'dark';
  ghostText?: string;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  friendRequest,
  theme,
  ghostText = 'Enter username...',
}) => {
  if (!friendRequest.shouldRenderAddFriendModal) {
    return null;
  }

  const handleChangeText = (text: string) => {
    friendRequest.setFriendUsername(text);
    if (friendRequest.statusMessage || friendRequest.validationError) {
      friendRequest.clearStatus();
    }
  };

  const handleFocus = () => {
    friendRequest.setIsInputFocused(true);
    if (friendRequest.statusMessage || friendRequest.validationError) {
      friendRequest.clearStatus();
    }
  };

  const handleBlur = () => {
    friendRequest.setIsInputFocused(false);
  };

  return (
    <Modal
      visible={friendRequest.shouldRenderAddFriendModal}
      transparent={true}
      animationType="none"
      onRequestClose={() => friendRequest.setShowAddFriendModal(false)}
    >
      <Animated.View style={[styles.overlay, { opacity: friendRequest.addFriendModalOpacity }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={() => friendRequest.setShowAddFriendModal(false)}
        />
        
        <Animated.View style={[
          styles.dropdown,
          {
            left: 24,
            top: 123,
            backgroundColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
            borderWidth: 1,
            borderColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
            ...getHeaderMenuShadow(theme),
          }
        ]}>
          {/* Arrow pointing to header button */}
          <View style={{ position: 'absolute', top: -9, left: 60 }}>
            <View style={[
              styles.arrow,
              {
                borderBottomColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
                borderLeftWidth: 9,
                borderRightWidth: 9,
                borderBottomWidth: 9,
              }
            ]} />
            <View style={[
              styles.arrow,
              {
                borderBottomColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
                position: 'absolute',
                top: 1,
                left: -0.5,
                borderLeftWidth: 8,
                borderRightWidth: 8,
                borderBottomWidth: 8,
              }
            ]} />
          </View>

          <Text style={[
            styles.dropdownTitle,
            {
              color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary,
              ...typography.h3,
            }
          ]}>
            Add a friend by username
          </Text>
          
          <Animated.View
            style={{
              transform: [{ translateX: friendRequest.shakeAnim }]
            }}
          >
            <TextInput
              style={[
                styles.friendInput,
                {
                  color: friendRequest.validationError 
                    ? '#FF6B6B' 
                    : friendRequest.statusType === 'error' 
                      ? '#FF4444' 
                      : friendRequest.statusType === 'success' 
                        ? '#00DD44' 
                        : friendRequest.statusType === 'warning'
                          ? '#FFB366'
                          : (theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary),
                  backgroundColor: friendRequest.isSubmittingFriendRequest 
                    ? (theme === 'dark' ? '#2a2a2a' : '#f0f0f0')
                    : (theme === 'dark' ? '#1a1a1a' : '#f8f8f8'),
                  borderColor: friendRequest.validationError
                    ? '#FF6B6B'
                    : friendRequest.statusType === 'error' 
                      ? '#FF4444' 
                      : friendRequest.statusType === 'success' 
                        ? '#00DD44'
                        : friendRequest.statusType === 'warning'
                          ? '#FFB366'
                          : friendRequest.statusType === 'loading'
                            ? '#4A90E2'
                            : (theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default),
                  borderWidth: (friendRequest.validationError || friendRequest.statusType) ? 2 : 1,
                }
              ]}
              placeholder={friendRequest.validationError || friendRequest.statusMessage || ghostText}
              placeholderTextColor={
                friendRequest.validationError 
                  ? '#FF6B6B' 
                  : friendRequest.statusType === 'error' 
                    ? '#FF4444' 
                    : friendRequest.statusType === 'success' 
                      ? '#00BB44' 
                      : friendRequest.statusType === 'warning'
                        ? '#FF9933'
                        : friendRequest.statusType === 'loading'
                          ? '#4A90E2'
                          : (theme === 'dark' ? designTokens.text.mutedDark : designTokens.text.muted)
              }
              value={friendRequest.friendUsername}
              onChangeText={handleChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              returnKeyType="done"
              onSubmitEditing={friendRequest.handleAddFriendSubmit}
              autoCapitalize="none"
              autoCorrect={false}
              multiline={false}
              numberOfLines={1}
              textContentType="username"
              keyboardType="default"
              selectionColor={theme === 'dark' ? designTokens.brand.primary : designTokens.brand.primary}
              editable={!friendRequest.isSubmittingFriendRequest && !friendRequest.statusMessage}
            />
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: friendRequest.isSubmittingFriendRequest 
                  ? (theme === 'dark' ? '#333333' : '#cccccc')
                  : friendRequest.statusType === 'success'
                    ? '#00AA44'
                    : friendRequest.statusType === 'error' || friendRequest.validationError
                      ? '#FF4444'
                      : friendRequest.statusType === 'warning'
                        ? '#FF9933'
                        : (theme === 'dark' ? '#0d0d0d' : designTokens.brand.primary),
                borderColor: friendRequest.isSubmittingFriendRequest
                  ? (theme === 'dark' ? '#555555' : '#aaaaaa')
                  : (theme === 'dark' ? '#262626' : 'transparent'),
                borderWidth: 1,
                opacity: friendRequest.isSubmittingFriendRequest ? 0.7 : 1,
                shadowColor: theme === 'dark' ? '#ffffff' : '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: theme === 'dark' ? 0.15 : 0.1,
                shadowRadius: 4,
                elevation: 3,
              }
            ]}
            onPress={friendRequest.handleAddFriendSubmit}
            activeOpacity={0.8}
            disabled={friendRequest.isSubmittingFriendRequest || !!friendRequest.validationError}
          >
            <Text style={[
              styles.addButtonText,
              {
                color: '#ffffff',
                fontWeight: '600',
                fontSize: 15,
              }
            ]}>
              {friendRequest.isSubmittingFriendRequest 
                ? 'Sending...' 
                : friendRequest.statusType === 'success'
                  ? 'Sent!'
                  : friendRequest.statusType === 'error' || friendRequest.validationError
                    ? 'Try Again'
                    : 'Add Friend'
              }
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdown: {
    position: 'absolute',
    minWidth: 280,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
  },
  dropdownTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  friendInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    fontFamily: 'System',
  },
  addButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: 'System',
  },
});