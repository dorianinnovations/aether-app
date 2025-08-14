/**
 * Attachments Management Hook
 * Handles file selection, validation, and management for chat messages
 */

import { useState, useCallback, useRef } from 'react';
import { Alert, Animated, Easing } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { MessageAttachment } from '../types';

// Type definitions
type ImagePickerAsset = ImagePicker.ImagePickerAsset;
type DocumentPickerAsset = DocumentPicker.DocumentPickerAsset;
type PickerAsset = ImagePickerAsset | DocumentPickerAsset;

interface UseAttachmentsProps {
  maxAttachments?: number;
  enableFileUpload?: boolean;
  onAttachmentsChange?: (attachments: MessageAttachment[]) => void;
}

export const useAttachments = ({
  maxAttachments = 5,
  enableFileUpload = true,
  onAttachmentsChange,
}: UseAttachmentsProps = {}) => {
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentButtonsVisible, setAttachmentButtonsVisible] = useState(false);

  // Animation refs for attachment buttons
  const attachmentButtonsAnim = useRef(new Animated.Value(0)).current;
  const attachmentButtonScale = useRef(new Animated.Value(1)).current;
  const cameraSlideAnim = useRef(new Animated.Value(-50)).current;
  const gallerySlideAnim = useRef(new Animated.Value(-50)).current;
  const documentSlideAnim = useRef(new Animated.Value(-50)).current;

  const updateAttachments = useCallback((newAttachments: MessageAttachment[]) => {
    setAttachments(newAttachments);
    if (onAttachmentsChange) {
      onAttachmentsChange(newAttachments);
    }
  }, [onAttachmentsChange]);

  const handleNewAttachment = useCallback(async (asset: PickerAsset) => {
    if (attachments.length >= maxAttachments) {
      Alert.alert('Attachment Limit', `You can attach up to ${maxAttachments} files.`);
      return;
    }

    const newAttachment: MessageAttachment = {
      id: Date.now().toString(),
      type: (asset as any).type?.includes('image') || (asset as any).mediaType?.includes('image') ? 'image' : 'document',
      name: (asset as any).name || (asset as any).fileName || `attachment_${Date.now()}`,
      uri: asset.uri,
      size: (asset as any).fileSize || (asset as any).size || 0,
      uploadStatus: 'uploaded',
      mimeType: (asset as any).mimeType || (asset as any).type || 'application/octet-stream',
    };

    const updatedAttachments = [...attachments, newAttachment];
    updateAttachments(updatedAttachments);
    
    // Close attachment buttons after adding
    if (attachmentButtonsVisible) {
      closeAttachmentButtons();
    }
  }, [attachments, maxAttachments, attachmentButtonsVisible, updateAttachments]);

  const handleCameraPress = useCallback(async () => {
    if (!enableFileUpload) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachmentButtonsVisible(false);

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Camera Permission', 'Permission to access camera is required.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleNewAttachment(result.assets[0]);
      }
    } catch {
      Alert.alert('Camera Error', 'Unable to take photo. Please try again.');
    }
  }, [enableFileUpload, handleNewAttachment]);

  const handleGalleryPress = useCallback(async () => {
    if (!enableFileUpload) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachmentButtonsVisible(false);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        aspect: [16, 9],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        await handleNewAttachment(result.assets[0]);
      }
    } catch {
      Alert.alert('Gallery Error', 'Unable to select image. Please try again.');
    }
  }, [enableFileUpload, handleNewAttachment]);

  const handleDocumentPress = useCallback(async () => {
    if (!enableFileUpload) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachmentButtonsVisible(false);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await handleNewAttachment(result.assets[0]);
      }
    } catch {
      Alert.alert('Document Error', 'Unable to select document. Please try again.');
    }
  }, [enableFileUpload, handleNewAttachment]);

  const removeAttachment = useCallback((attachmentId: string) => {
    const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
    updateAttachments(updatedAttachments);
  }, [attachments, updateAttachments]);

  const clearAttachments = useCallback(() => {
    updateAttachments([]);
  }, [updateAttachments]);

  const closeAttachmentButtons = useCallback(() => {
    // Slide out icons quickly
    Animated.parallel([
      Animated.timing(cameraSlideAnim, {
        toValue: 50,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(gallerySlideAnim, {
        toValue: 50,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(documentSlideAnim, {
        toValue: 50,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start();

    // Container closing animation
    Animated.parallel([
      Animated.timing(attachmentButtonScale, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(attachmentButtonsAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start(() => {
      // Reset positions for next open
      cameraSlideAnim.setValue(-50);
      gallerySlideAnim.setValue(-50);
      documentSlideAnim.setValue(-50);
    });
  }, [cameraSlideAnim, gallerySlideAnim, documentSlideAnim, attachmentButtonScale, attachmentButtonsAnim]);

  const toggleAttachmentButtons = useCallback(() => {
    const newVisibility = !attachmentButtonsVisible;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAttachmentButtonsVisible(newVisibility);
    
    if (newVisibility) {
      // Opening animation
      Animated.parallel([
        Animated.timing(attachmentButtonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(attachmentButtonsAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
          easing: Easing.out(Easing.back(1.1)),
        }),
      ]).start(() => {
        // Scale back to normal
        Animated.timing(attachmentButtonScale, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }).start();
      });

      // Staggered slide-in animations
      setTimeout(() => {
        Animated.timing(cameraSlideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
      }, 50);

      setTimeout(() => {
        Animated.timing(gallerySlideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
      }, 100);

      setTimeout(() => {
        Animated.timing(documentSlideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
      }, 150);
    } else {
      closeAttachmentButtons();
    }
  }, [attachmentButtonsVisible, attachmentButtonScale, attachmentButtonsAnim, closeAttachmentButtons]);

  return {
    // State
    attachments,
    isUploading,
    attachmentButtonsVisible,

    // Animation values
    attachmentButtonsAnim,
    attachmentButtonScale,
    cameraSlideAnim,
    gallerySlideAnim,
    documentSlideAnim,

    // Handlers
    handleCameraPress,
    handleGalleryPress,
    handleDocumentPress,
    toggleAttachmentButtons,
    removeAttachment,
    clearAttachments,
    updateAttachments,

    // Utility
    setAttachmentButtonsVisible,
  };
};