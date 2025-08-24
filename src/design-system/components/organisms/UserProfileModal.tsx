/**
 * UserProfileModal
 * Bottom sheet modal for viewing your own profile (like PublicUserProfileModal but for current user)
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PublicUserProfile, UserProfile, SocialProfile } from './PublicUserProfile';
import { LottieLoader } from '../atoms';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing } from '../../tokens/spacing';
import { useProfileData } from '../../../hooks/useProfileData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

export interface UserProfileModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Close modal callback */
  onClose: () => void;
  /** Navigation callback to go to full profile screen for editing */
  onNavigateToProfile?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
  onNavigateToProfile,
}) => {
  const { theme, colors } = useTheme();
  
  // Animation state
  const [slideAnim] = useState(new Animated.Value(MODAL_HEIGHT));
  const [backdropAnim] = useState(new Animated.Value(0));
  
  // Use the same profile data hook as ProfileScreen
  const { 
    profile, 
    socialProfile, 
    loading, 
    error,
    refreshAllData 
  } = useProfileData();

  // Scroll ref for scroll-to-dismiss functionality
  const scrollViewRef = React.useRef<any>(null);
  const [isAtTop, setIsAtTop] = useState(true);

  // Pan responder for swipe-to-dismiss
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return (gestureState.dy > 10 || isAtTop) && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
    },
    onMoveShouldSetPanResponderCapture: (_, gestureState) => {
      return isAtTop && gestureState.dy > 5;
    },
    onPanResponderGrant: () => {
      slideAnim.stopAnimation();
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy >= 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 80 || gestureState.vy > 0.3) {
        handleClose();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // Refresh profile data when modal opens
  useEffect(() => {
    if (visible && profile) {
      // Data is already loaded by useProfileData hook
      // Optionally refresh if needed
      refreshAllData();
    }
  }, [visible]);

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Reset position and show modal
      slideAnim.setValue(MODAL_HEIGHT);
      
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);


  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleBackdropPress = () => {
    handleClose();
  };

  const handleEditProfile = () => {
    handleClose();
    // Small delay to ensure modal closes before navigation
    setTimeout(() => {
      onNavigateToProfile?.();
    }, 250);
  };

  // Handle scroll position changes for scroll-to-dismiss
  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const newIsAtTop = contentOffset.y <= 10;
    if (newIsAtTop !== isAtTop) {
      setIsAtTop(newIsAtTop);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: colors.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Edit Button - Top Right */}
          {profile && !loading && (
            <TouchableOpacity
              style={[
                styles.editButton, 
                { 
                  backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderWidth: 1,
                  borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : colors.textSecondary,
                }
              ]}
              onPress={handleEditProfile}
            >
              <Feather name="edit-3" size={12} color={theme === 'dark' ? colors.text : colors.textSecondary} />
              <Text style={[styles.editButtonText, { color: theme === 'dark' ? colors.text : colors.textSecondary }]}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          {/* Content */}
          <SafeAreaView style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <LottieLoader size="large" />
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Feather name="user-x" size={48} color={colors.textSecondary} />
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={refreshAllData}
                >
                  <Feather name="refresh-cw" size={18} color="white" />
                </TouchableOpacity>
              </View>
            ) : profile ? (
              <PublicUserProfile
                profile={profile}
                socialProfile={socialProfile}
                loading={false}
                viewMode="basic"
                onlineStatus="online"
                showGripBar={true}
                scrollRef={scrollViewRef}
                onScroll={handleScroll}
              />
            ) : null}

            {/* Edit Tip at Bottom */}
            {profile && !loading && (
              <View style={[styles.editTip, { backgroundColor: colors.surface }]}>
                <Feather name="info" size={14} color={colors.textSecondary} />
                <Text style={[styles.editTipText, { color: colors.textSecondary }]}>
                  Tap "Edit Profile" or go to Profile section to make changes
                </Text>
              </View>
            )}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  modal: {
    height: MODAL_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 2,
  },
  content: {
    flex: 1,
  },
  editButton: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  editButtonText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: spacing[1],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[6],
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 8,
  },
  editTip: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing[4],
    padding: spacing[3],
    borderRadius: 8,
    gap: spacing[2],
  },
  editTipText: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
});

export default UserProfileModal;