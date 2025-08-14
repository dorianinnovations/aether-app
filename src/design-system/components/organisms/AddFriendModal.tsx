import React from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ThemeMode } from '../../../contexts/ThemeContext';
import { designTokens } from '../../tokens/colors';
import { getHeaderMenuShadow } from '../../tokens/shadows';
import { spacing } from '../../tokens/spacing';
import { validateUsername } from '../../../utils/chatUtils';

interface FriendRequestState {
  shouldRenderAddFriendModal: boolean;
  addFriendModalOpacity: Animated.Value;
  shakeAnim: Animated.Value;
  friendUsername: string;
  validationError: string;
  statusType: 'success' | 'error' | 'warning' | 'loading' | null;
  statusMessage: string;
  isSubmittingFriendRequest: boolean;
  isInputFocused: boolean;
  setShowAddFriendModal: (show: boolean) => void;
  setFriendUsername: (username: string) => void;
  setValidationError: (error: string) => void;
  clearStatus: () => void;
  setIsInputFocused: (focused: boolean) => void;
  handleAddFriendSubmit: () => void;
}

interface AddFriendModalProps {
  theme: ThemeMode;
  visible: boolean;
  friendRequest: FriendRequestState;
  ghostText: string;
  onClose: () => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  theme,
  visible,
  friendRequest,
  ghostText,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={friendRequest.shouldRenderAddFriendModal}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: friendRequest.addFriendModalOpacity }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View style={[
          styles.addFriendOverlay,
          {
            backgroundColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
            borderWidth: 1,
            borderColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
            ...getHeaderMenuShadow(theme),
          }
        ]}>
          
          <View style={styles.dropdownContent}>
            <Text style={[
              styles.dropdownTitle,
              { 
                color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary,
                fontFamily: 'Nunito-SemiBold',
                letterSpacing: -0.7,
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
                onChangeText={(text) => {
                  friendRequest.setFriendUsername(text);
                  // Clear status and validation errors when user starts typing
                  if (friendRequest.statusMessage || friendRequest.validationError) {
                    friendRequest.clearStatus();
                  }
                  
                  // Real-time validation (only show after user stops typing)
                  if (text.trim().length > 0) {
                    const validation = validateUsername(text);
                    if (validation && text.trim().length >= 3) {
                      // Only show validation error for longer inputs to avoid annoying users
                      friendRequest.setValidationError(validation);
                    } else {
                      friendRequest.setValidationError('');
                    }
                  } else {
                    friendRequest.setValidationError('');
                  }
                }}
                onFocus={() => friendRequest.setIsInputFocused(true)}
                onBlur={() => friendRequest.setIsInputFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
                keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                selectionColor={theme === 'dark' ? '#ffffff' : '#007AFF'}
                cursorColor={theme === 'dark' ? '#ffffff' : '#007AFF'}
                textAlign="center"
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
                  borderWidth: theme === 'dark' ? 1 : 0,
                  opacity: friendRequest.isSubmittingFriendRequest ? 0.7 : 1,
                  shadowColor: theme === 'dark' ? '#ffffff' : '#000000',
                  shadowOffset: { width: 0, height: theme === 'dark' ? 0 : 2 },
                  shadowOpacity: theme === 'dark' ? 0.4 : 0.3,
                  shadowRadius: theme === 'dark' ? 4 : 8,
                  elevation: theme === 'dark' ? 0 : 4,
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
                  fontFamily: 'Nunito-SemiBold',
                  letterSpacing: -0.3,
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
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFriendOverlay: {
    width: 320,
    borderRadius: 16,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownContent: {
    paddingTop: spacing[2],
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  friendInput: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing[3],
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  addButton: {
    width: '100%',
    height: 37,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});