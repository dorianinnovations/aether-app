/**
 * PublicUserProfileModal
 * Bottom sheet modal for viewing other users' public profiles
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75; // Reduced from 0.9 to 0.75 for lower positioning

export interface PublicUserProfileModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Username to fetch profile for */
  username?: string;
  /** Close modal callback */
  onClose: () => void;
  /** Function to fetch user profile data */
  onFetchProfile: (username: string) => Promise<{
    profile: UserProfile;
    socialProfile?: SocialProfile;
  }>;
}

export const PublicUserProfileModal: React.FC<PublicUserProfileModalProps> = ({
  visible,
  username,
  onClose,
  onFetchProfile,
}) => {
  const { theme, colors } = useTheme();
  
  // Animation state
  const [slideAnim] = useState(new Animated.Value(MODAL_HEIGHT));
  const [backdropAnim] = useState(new Animated.Value(0));
  
  // Profile data state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [socialProfile, setSocialProfile] = useState<SocialProfile | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scroll ref for scroll-to-dismiss functionality
  const scrollViewRef = React.useRef<any>(null);
  const [isAtTop, setIsAtTop] = useState(true);

  // Pan responder for swipe-to-dismiss
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // More sensitive threshold - 10px instead of 20px
      // Allow dismissal if scrolled to top or dragging down
      return (gestureState.dy > 10 || isAtTop) && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
    },
    onMoveShouldSetPanResponderCapture: (_, gestureState) => {
      // Capture gesture if at top and dragging down
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
      // Lower thresholds for easier dismissal - 80px instead of 100px, 0.3 instead of 0.5
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

  // Fetch profile data when modal opens
  useEffect(() => {
    if (visible && username) {
      fetchProfileData(username);
    }
  }, [visible, username]);

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
    } else {
      // Reset state when closed
      setProfile(null);
      setSocialProfile(undefined);
      setError(null);
    }
  }, [visible]);

  const fetchProfileData = async (targetUsername: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await onFetchProfile(targetUsername);
      setProfile(data.profile);
      setSocialProfile(data.socialProfile);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: MODAL_HEIGHT,
        duration: 200, // Faster close animation
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200, // Faster backdrop fade
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleBackdropPress = () => {
    handleClose();
  };

  // Handle scroll position changes for scroll-to-dismiss
  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const newIsAtTop = contentOffset.y <= 10; // Allow 10px buffer
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
                  {error.includes('not found') 
                    ? `@${username} profile not available`
                    : 'Unable to load profile'
                  }
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  onPress={() => username && fetchProfileData(username)}
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
                onlineStatus="online" // Could be dynamic based on real online status
                showGripBar={true}
                scrollRef={scrollViewRef}
                onScroll={handleScroll}
              />
            ) : null}
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
    zIndex: 1, // Ensure backdrop is behind modal but above everything else
  },
  modal: {
    height: MODAL_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 2, // Ensure modal is above backdrop
  },
  content: {
    flex: 1,
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
});

export default PublicUserProfileModal;