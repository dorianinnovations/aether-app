/**
 * AddFriendModal - Molecular Add Friend Component
 * Responsibility: Handle friend request modal with validation and animations
 * Extracted from ChatScreen for better maintainability
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { designTokens } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing, borderRadius } from '../../tokens/spacing';
import { getHeaderMenuShadow } from '../../tokens/shadows';
import { useTheme } from '../../../contexts/ThemeContext';

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (username: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
  position?: { top: number; left: number };
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
  error,
  position = { top: 123, left: 24 },
}) => {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'warning' | 'loading' | null>(null);
  
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const ghostText = 'Enter username';

  // Modal animation
  useEffect(() => {
    if (visible) {
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Clear fields when modal opens
  useEffect(() => {
    if (visible) {
      setUsername('');
      setValidationError('');
      setStatusMessage('');
      setStatusType(null);
      clearStatus();
    }
  }, [visible]);

  // Handle error prop changes
  useEffect(() => {
    if (error) {
      setStatusMessage(error);
      setStatusType('error');
      triggerShake();
      
      // Auto-clear error after delay
      statusTimeoutRef.current = setTimeout(() => {
        clearStatus();
      }, 3000);
    }
  }, [error]);

  const validateUsername = (username: string): string | null => {
    if (!username.trim()) {
      return 'Username is required';
    }
    
    if (username.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    
    if (username.trim().length > 20) {
      return 'Username cannot exceed 20 characters';
    }
    
    // Check for valid username pattern (alphanumeric, underscores, hyphens)
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    
    return null; // Valid
  };

  const clearStatus = () => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
    setStatusMessage('');
    setStatusType(null);
    setValidationError('');
  };

  const triggerShake = () => {
    const shakeSequence = [
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ];
    
    Animated.sequence(shakeSequence).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    
    // Clear status and validation errors when user starts typing
    if (statusMessage || validationError) {
      clearStatus();
    }
    
    // Real-time validation (only show after user stops typing)
    if (text.trim().length > 0) {
      const validation = validateUsername(text);
      if (validation && text.trim().length >= 3) {
        // Only show validation error for longer inputs
        setValidationError(validation);
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  };

  const handleSubmit = async () => {
    const trimmedUsername = username.trim();
    const validation = validateUsername(trimmedUsername);
    
    if (validation) {
      setValidationError(validation);
      triggerShake();
      return;
    }

    try {
      setStatusType('loading');
      setStatusMessage('Sending friend request...');
      
      await onSubmit(trimmedUsername);
      
      setStatusType('success');
      setStatusMessage('Friend request sent!');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch {
      setStatusType('error');
      setStatusMessage('Failed to send friend request');
      triggerShake();
    }
  };

  const getInputColor = () => {
    if (validationError) return '#FF6B6B';
    if (statusType === 'error') return '#FF4444';
    if (statusType === 'success') return '#00DD44';
    if (statusType === 'warning') return '#FFB366';
    return theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary;
  };

  const getBorderColor = () => {
    if (validationError) return '#FF6B6B';
    if (statusType === 'error') return '#FF4444';
    if (statusType === 'success') return '#00DD44';
    if (statusType === 'warning') return '#FFB366';
    if (statusType === 'loading') return '#4A90E2';
    return theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default;
  };

  const getButtonColor = () => {
    if (isLoading) return theme === 'dark' ? '#333333' : '#cccccc';
    if (statusType === 'success') return '#00AA44';
    if (statusType === 'error' || validationError) return '#FF4444';
    if (statusType === 'warning') return '#FF9933';
    return theme === 'dark' ? '#0d0d0d' : designTokens.brand.primary;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: modalOpacity }]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View style={[
          styles.dropdown,
          {
            left: position.left,
            top: position.top,
            backgroundColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
            borderColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
            ...getHeaderMenuShadow(theme),
          }
        ]}>
          {/* Arrow pointing upward */}
          <View style={styles.arrowContainer}>
            {/* Border triangle */}
            <View style={[
              styles.arrow,
              {
                borderBottomColor: theme === 'dark' ? designTokens.borders.dark.default : designTokens.borders.light.default,
              }
            ]} />
            {/* Fill triangle */}
            <View style={[
              styles.arrowFill,
              {
                borderBottomColor: theme === 'light' ? '#ffffff' : designTokens.brand.surfaceDark,
              }
            ]} />
          </View>
          
          <View style={styles.content}>
            <Text style={[
              styles.title,
              { 
                color: theme === 'dark' ? designTokens.text.primaryDark : designTokens.text.primary,
              }
            ]}>
              Add a friend by username
            </Text>
            
            <Animated.View
              style={{
                transform: [{ translateX: shakeAnim }]
              }}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    color: getInputColor(),
                    backgroundColor: isLoading 
                      ? (theme === 'dark' ? '#2a2a2a' : '#f0f0f0')
                      : (theme === 'dark' ? '#1a1a1a' : '#f8f8f8'),
                    borderColor: getBorderColor(),
                    borderWidth: (validationError || statusType) ? 2 : 1,
                  }
                ]}
                placeholder={validationError || statusMessage || ghostText}
                placeholderTextColor={getInputColor()}
                value={username}
                onChangeText={handleUsernameChange}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardAppearance={theme === 'dark' ? 'dark' : 'light'}
                selectionColor={theme === 'dark' ? '#ffffff' : '#007AFF'}
                textAlign="center"
                editable={!isLoading && !statusMessage}
              />
            </Animated.View>
            
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: getButtonColor(),
                  borderColor: isLoading
                    ? (theme === 'dark' ? '#555555' : '#aaaaaa')
                    : (theme === 'dark' ? '#262626' : 'transparent'),
                  borderWidth: theme === 'dark' ? 1 : 0,
                  opacity: isLoading ? 0.7 : 1,
                }
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isLoading || !!validationError}
            >
              <Text style={styles.buttonText}>
                {isLoading 
                  ? 'Sending...' 
                  : statusType === 'success'
                    ? 'Sent!'
                    : statusType === 'error' || validationError
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    position: 'absolute',
    width: 280,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  arrowContainer: {
    position: 'absolute',
    top: -9,
    left: 60,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowFill: {
    position: 'absolute',
    top: 1,
    left: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontFamily: typography.fonts.uiSemiBold,
    letterSpacing: -0.7,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  input: {
    height: 44,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: typography.fonts.ui,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  button: {
    height: 44,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: typography.fonts.uiSemiBold,
    letterSpacing: -0.3,
  },
});

export default AddFriendModal;