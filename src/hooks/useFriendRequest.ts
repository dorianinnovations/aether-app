/**
 * Friend Request Management Hook
 * Handles friend request state, validation, and submission logic
 */

import { useState, useRef } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { validateUsername } from '../utils/chatUtils';
import { FriendsAPI } from '../services/api';
import { logger } from '../utils/logger';

export const useFriendRequest = () => {
  // State
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [shouldRenderAddFriendModal, setShouldRenderAddFriendModal] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'warning' | 'loading' | null>(null);
  const [isSubmittingFriendRequest, setIsSubmittingFriendRequest] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Refs
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shakeAnim = useRef<Animated.Value>(new Animated.Value(0)).current;
  const addFriendModalOpacity = useRef<Animated.Value>(new Animated.Value(1)).current;

  // Helper functions
  const clearStatus = () => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
    setStatusMessage('');
    setStatusType(null);
    setValidationError('');
  };

  const showStatus = (message: string, type: 'success' | 'error' | 'warning' | 'loading', duration: number = 3000) => {
    clearStatus();
    setStatusMessage(message);
    setStatusType(type);
    
    if (type !== 'loading' && duration > 0) {
      statusTimeoutRef.current = setTimeout(() => {
        clearStatus();
      }, duration);
    }
  };

  const performShakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 75, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 75, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 75, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 75, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 75, useNativeDriver: true }),
    ]).start();
  };

  // Handlers
  const handleAddFriendPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddFriendModal(true);
  };

  const handleAddFriendSubmit = async () => {
    const username = friendUsername.trim();
    
    // Client-side validation
    const validationError = validateUsername(username);
    if (validationError) {
      setValidationError(validationError);
      performShakeAnimation();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSubmittingFriendRequest(true);
    setValidationError('');
    showStatus('Sending friend request...', 'loading', 0);

    try {
      const response = await FriendsAPI.addFriend(username);
      
      if (response.success) {
        showStatus(`Friend request sent to ${username}!`, 'success');
        setFriendUsername('');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Enhanced close animation
        Animated.timing(addFriendModalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }).start(() => {
          setShowAddFriendModal(false);
          setShouldRenderAddFriendModal(false);
          
          // Reset modal opacity for next time
          setTimeout(() => {
            addFriendModalOpacity.setValue(1);
          }, 100);
        });
      } else {
        const errorMessage = response.message || 'Failed to send friend request. Please try again.';
        showStatus(errorMessage, 'error');
        performShakeAnimation();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        logger.error('Friend request failed:', response.message);
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection and try again.';
      showStatus(errorMessage, 'error');
      performShakeAnimation();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      logger.error('Friend request error:', error);
    } finally {
      setIsSubmittingFriendRequest(false);
    }
  };

  return {
    // State
    showAddFriendModal,
    setShowAddFriendModal,
    shouldRenderAddFriendModal,
    setShouldRenderAddFriendModal,
    friendUsername,
    setFriendUsername,
    isInputFocused,
    setIsInputFocused,
    statusMessage,
    statusType,
    isSubmittingFriendRequest,
    validationError,
    setValidationError,

    // Animation refs
    shakeAnim,
    addFriendModalOpacity,

    // Handlers
    handleAddFriendPress,
    handleAddFriendSubmit,
    clearStatus,
    showStatus,
  };
};