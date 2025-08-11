import React, { useEffect } from 'react';
import { 
  View, 
  Modal, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { WalletCard } from '../molecules/WalletCard';

const { height: screenHeight } = Dimensions.get('window');

interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
  onTierSelect: (tier: 'pro' | 'elite') => void;
  currentTier?: 'standard' | 'pro' | 'elite';
  usage?: {
    gpt4o: number;
    gpt5: number;
    gpt5Limit?: number;
  };
  userBadges?: string[];
}

export const WalletModal: React.FC<WalletModalProps> = ({
  visible,
  onClose,
  onTierSelect,
  currentTier = 'standard',
  usage,
  userBadges,
}) => {
  // Animation values
  const overlayOpacity = useSharedValue(0);
  const modalTranslateY = useSharedValue(screenHeight);

  // Animate in/out based on visibility
  useEffect(() => {
    if (visible) {
      // Fade in overlay immediately
      overlayOpacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      
      // Slide up modal content with slight delay
      modalTranslateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      // Animate out
      modalTranslateY.value = withTiming(screenHeight, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      
      overlayOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [visible]);

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalTranslateY.value }],
  }));

  const handleTierSelect = (tier: 'pro' | 'elite') => {
    onTierSelect(tier);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[styles.backgroundOverlay, overlayStyle]}
        >
          <TouchableOpacity 
            style={styles.backgroundTouchable}
            activeOpacity={1} 
            onPress={onClose}
          />
        </Animated.View>
        
        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <WalletCard 
            currentTier={currentTier}
            usage={usage}
            userBadges={userBadges}
            onUpgrade={handleTierSelect}
          />
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
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backgroundTouchable: {
    flex: 1,
  },
  modalContainer: {
    height: screenHeight * 0.54,
    // Enhanced shadows for depth
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 24,
    // Subtle glow effect
    backgroundColor: 'transparent',
    position: 'relative',
  },
});