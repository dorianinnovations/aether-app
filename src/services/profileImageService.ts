/**
 * Profile Image Service
 * Handles profile and banner image operations with proper error handling
 */

import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserAPI } from './apiModules/endpoints/user';
import { logger } from '../utils/logger';

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class ProfileImageService {
  /**
   * Request necessary permissions for image operations
   */
  static async requestPermissions(): Promise<{ mediaLibrary: boolean; camera: boolean }> {
    try {
      const [mediaLibraryResult, cameraResult] = await Promise.all([
        ImagePicker.requestMediaLibraryPermissionsAsync(),
        ImagePicker.requestCameraPermissionsAsync()
      ]);

      return {
        mediaLibrary: mediaLibraryResult.status === 'granted',
        camera: cameraResult.status === 'granted'
      };
    } catch (error) {
      logger.error('Error requesting permissions:', error);
      return { mediaLibrary: false, camera: false };
    }
  }

  /**
   * Show image source selection alert
   */
  static showImageSourceAlert(
    onCameraPress: () => void,
    onLibraryPress: () => void
  ): void {
    Alert.alert(
      'Select Image Source',
      'Choose how you want to select your image',
      [
        {
          text: 'Photo Library',
          onPress: onLibraryPress
        },
        {
          text: 'Camera',
          onPress: onCameraPress
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  /**
   * Launch image picker
   */
  static async pickImage(
    useCamera: boolean = false,
    aspectRatio: [number, number] = [1, 1]
  ): Promise<ImagePicker.ImagePickerResult | null> {
    try {
      let result: ImagePicker.ImagePickerResult;

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      };

      if (useCamera) {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      return result;
    } catch (error) {
      logger.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
      return null;
    }
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(imageUri: string): Promise<ImageUploadResult> {
    try {
      const response = await UserAPI.uploadProfilePicture(imageUri);
      
      // Server returns: {data: {profilePhoto: {url: ..., filename: ..., etc}}}
      if (response?.data?.profilePhoto) {
        return {
          success: true,
          imageUrl: response.data.profilePhoto.url || response.data.profilePhoto
        };
      }
      
      logger.error('Invalid upload response format:', response);
      return {
        success: false,
        error: 'Invalid server response format'
      };
    } catch (error: any) {
      logger.error('Profile picture upload failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload profile picture'
      };
    }
  }

  /**
   * Upload banner image
   */
  static async uploadBannerImage(imageUri: string): Promise<ImageUploadResult> {
    try {
      const response = await UserAPI.uploadBannerImage(imageUri);
      
      // Server returns: {data: {bannerImage: {url: ..., filename: ..., etc}}}
      if (response?.data?.bannerImage) {
        return {
          success: true,
          imageUrl: response.data.bannerImage.url || response.data.bannerImage
        };
      }
      
      logger.error('Invalid banner upload response format:', response);
      return {
        success: false,
        error: 'Invalid server response format'
      };
    } catch (error: any) {
      logger.error('Banner image upload failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload banner image'
      };
    }
  }

  /**
   * Delete profile picture
   */
  static async deleteProfilePicture(): Promise<ImageUploadResult> {
    try {
      await UserAPI.deleteProfilePicture();
      return { success: true };
    } catch (error: any) {
      logger.error('Profile picture deletion failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete profile picture'
      };
    }
  }

  /**
   * Delete banner image
   */
  static async deleteBannerImage(): Promise<ImageUploadResult> {
    try {
      await UserAPI.deleteBannerImage();
      return { success: true };
    } catch (error: any) {
      logger.error('Banner image deletion failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete banner image'
      };
    }
  }

  /**
   * Handle complete profile image flow with permissions and selection
   */
  static async handleProfileImageUpload(): Promise<ImageUploadResult> {
    // Check permissions
    const permissions = await this.requestPermissions();
    
    if (!permissions.mediaLibrary) {
      Alert.alert(
        'Permission needed', 
        'Please grant photo library permissions to upload images.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
        ]
      );
      return { success: false, error: 'Permission denied' };
    }

    return new Promise((resolve) => {
      this.showImageSourceAlert(
        // Camera callback
        async () => {
          const result = await this.pickImage(true, [1, 1]);
          if (result && !result.canceled && result.assets[0]) {
            const uploadResult = await this.uploadProfilePicture(result.assets[0].uri);
            resolve(uploadResult);
          } else {
            resolve({ success: false, error: 'Image selection cancelled' });
          }
        },
        // Library callback
        async () => {
          const result = await this.pickImage(false, [1, 1]);
          if (result && !result.canceled && result.assets[0]) {
            const uploadResult = await this.uploadProfilePicture(result.assets[0].uri);
            resolve(uploadResult);
          } else {
            resolve({ success: false, error: 'Image selection cancelled' });
          }
        }
      );
    });
  }

  /**
   * Handle complete banner image flow
   */
  static async handleBannerImageUpload(): Promise<ImageUploadResult> {
    // Check permissions
    const permissions = await this.requestPermissions();
    
    if (!permissions.mediaLibrary) {
      Alert.alert('Permission needed', 'Please grant photo library permissions.');
      return { success: false, error: 'Permission denied' };
    }

    const result = await this.pickImage(false, [16, 9]);
    if (result && !result.canceled && result.assets[0]) {
      return await this.uploadBannerImage(result.assets[0].uri);
    }

    return { success: false, error: 'Image selection cancelled' };
  }

  /**
   * Handle profile image deletion with confirmation
   */
  static async handleProfileImageDeletion(): Promise<ImageUploadResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Delete Profile Picture',
        'Are you sure you want to remove your profile picture?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve({ success: false, error: 'Cancelled' }) },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const result = await this.deleteProfilePicture();
              resolve(result);
            }
          }
        ]
      );
    });
  }

  /**
   * Handle banner image deletion with confirmation
   */
  static async handleBannerImageDeletion(): Promise<ImageUploadResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Delete Banner Image',
        'Are you sure you want to remove your banner image?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve({ success: false, error: 'Cancelled' }) },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const result = await this.deleteBannerImage();
              resolve(result);
            }
          }
        ]
      );
    });
  }
}