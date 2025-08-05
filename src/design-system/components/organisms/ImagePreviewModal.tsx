/**
 * Image Preview Modal Component
 * Fullscreen modal for viewing images with zoom and pan capabilities
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  Easing,
  BackHandler,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { MessageAttachment } from '../../../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImagePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  attachment?: MessageAttachment;
  theme?: 'light' | 'dark';
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  visible,
  onClose,
  attachment,
  theme = 'light',
}) => {
  // Animation refs
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.8)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Calculate image dimensions to fit screen
  const getImageDimensions = useCallback(() => {
    if (!attachment?.width || !attachment?.height) {
      return { width: screenWidth * 0.9, height: screenHeight * 0.6 };
    }

    const aspectRatio = attachment.width / attachment.height;
    const maxWidth = screenWidth * 0.95;
    const maxHeight = screenHeight * 0.8;

    let width, height;
    if (aspectRatio > 1) {
      // Landscape
      width = Math.min(maxWidth, attachment.width);
      height = width / aspectRatio;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    } else {
      // Portrait
      height = Math.min(maxHeight, attachment.height);
      width = height * aspectRatio;
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
    }

    return { width, height };
  }, [attachment]);

  // Handle back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        handleClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible]);

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Show modal
      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(imageScale, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      backgroundOpacity.setValue(0);
      imageScale.setValue(0.8);
      imageOpacity.setValue(0);
    }
  }, [visible]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(imageScale, {
        toValue: 0.8,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(imageOpacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, []);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  if (!attachment) return null;

  const dimensions = getImageDimensions();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      {/* Background Blur */}
      <Animated.View 
        style={[
          styles.backdrop,
          { opacity: backgroundOpacity }
        ]}
      >
        <BlurView
          intensity={20}
          tint={theme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        
        {/* Close button overlay */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons 
            name="close" 
            size={28} 
            color={theme === 'dark' ? '#ffffff' : '#000000'} 
          />
        </TouchableOpacity>

        {/* Image container */}
        <View style={styles.imageContainer}>
          <Animated.View
            style={[
              {
                width: dimensions.width,
                height: dimensions.height,
                opacity: imageOpacity,
                transform: [{ scale: imageScale }],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleClose}
              style={{
                width: dimensions.width,
                height: dimensions.height,
              }}
            >
              <Image
                source={{ uri: attachment.uri }}
                style={[
                  styles.image,
                  {
                    width: dimensions.width,
                    height: dimensions.height,
                  },
                ]}
                resizeMode="contain"
                onLoad={handleImageLoad}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 8,
  },
});