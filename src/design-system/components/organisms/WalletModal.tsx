import React, { useEffect } from 'react';
import { 
  View, 
  Modal, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { WalletCard } from '../molecules/WalletCard';
import { useSubscription } from '../../../hooks/useSubscription';
import { useWalletModalAnimation } from '../../../hooks/useWalletModalAnimation';

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
  // Use real subscription data
  const { 
    currentTier: realCurrentTier, 
    walletUsage, 
    refreshUsage,
    hasRealData,
    loading,
    error,
    activityMetrics
  } = useSubscription();

  // Use real data if available, otherwise fallback to props
  const displayTier = hasRealData ? realCurrentTier : currentTier;
  const displayUsage = hasRealData ? walletUsage : usage;
  
  // Perfect animation system (same as ConversationDrawer)
  const {
    slideAnim,
    overlayOpacity,
    modalVisible,
    showModal,
    hideModal,
    resetAnimations,
  } = useWalletModalAnimation();

  // Handle visibility changes with perfect timing
  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      hideModal();
    }
  }, [visible, showModal, hideModal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAnimations();
    };
  }, [resetAnimations]);

  const handleTierSelect = (tier: 'pro' | 'elite') => {
    onTierSelect(tier);
    // Refresh usage data after tier selection
    setTimeout(refreshUsage, 2000); // Allow time for webhook processing
    onClose();
  };

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.backgroundOverlay, 
            { opacity: overlayOpacity }
          ]}
        >
          <TouchableOpacity 
            style={styles.backgroundTouchable}
            activeOpacity={1} 
            onPress={onClose}
          />
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.modalContainer, 
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <WalletCard 
            currentTier={displayTier}
            usage={displayUsage || undefined}
            userBadges={userBadges}
            onUpgrade={handleTierSelect}
            isLoadingRealData={loading}
            hasRealData={hasRealData}
            dataError={error}
            activityMetrics={activityMetrics}
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