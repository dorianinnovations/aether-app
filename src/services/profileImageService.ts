/**
 * Profile Image Service
 * Handles profile and banner image operations with proper error handling
 */

import { Alert, Platform, AppState } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { UserAPI } from './apiModules/endpoints/user';
import { logger } from '../utils/logger';
import { ImageUtils } from '../utils/imageUtils';

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
      // On iOS, we need to be more explicit about permissions
      const [mediaLibraryResult, cameraResult] = await Promise.all([
        ImagePicker.requestMediaLibraryPermissionsAsync(),
        ImagePicker.requestCameraPermissionsAsync()
      ]);

      const permissions = {
        mediaLibrary: mediaLibraryResult.status === 'granted',
        camera: cameraResult.status === 'granted'
      };

      // Log permission status for debugging TestFlight issues
      if (Platform.OS === 'ios') {
        logger.info('iOS Permissions Status:', {
          mediaLibrary: mediaLibraryResult.status,
          camera: cameraResult.status,
          canAskAgain: mediaLibraryResult.canAskAgain,
          cameraCanAskAgain: cameraResult.canAskAgain
        });
      }

      return permissions;
    } catch (error) {
      logger.error('Error requesting permissions:', error);
      // On iOS, permission errors can be more critical
      if (Platform.OS === 'ios') {
        Alert.alert(
          'Permission Error',
          'Unable to request photo permissions. Please check your device settings.',
          [{ text: 'OK' }]
        );
      }
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

      // Use platform-optimized options
      const imageType = aspectRatio[0] === aspectRatio[1] ? 'profile' : 'banner';
      const platformOptions = ImageUtils.getImagePickerOptions(imageType);
      
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality: platformOptions.quality,
        ...(Platform.OS === 'ios' && {
          // iOS-specific options for better TestFlight compatibility
          allowsMultipleSelection: false,
        }),
      };

      logger.info(`Launching ${useCamera ? 'camera' : 'image library'} with options:`, options);

      if (useCamera) {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      logger.info('Image picker result:', {
        cancelled: result.canceled,
        hasAssets: result.assets ? result.assets.length > 0 : false,
        firstAssetUri: result.assets?.[0]?.uri
      });

      return result;
    } catch (error: any) {
      logger.error('Error picking image:', error);
      
      // More specific error handling for iOS TestFlight
      let errorMessage = 'Failed to open image picker. Please try again.';
      
      if (Platform.OS === 'ios') {
        if (error.message?.includes('permission')) {
          errorMessage = 'Photo permissions are required. Please enable them in Settings.';
        } else if (error.message?.includes('memory')) {
          errorMessage = 'Not enough memory to process the image. Please try a smaller photo.';
        } else if (error.message?.includes('cancelled')) {
          // User cancelled - don't show error
          return null;
        }
      }
      
      Alert.alert('Error', errorMessage);
      return null;
    }
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(imageUri: string): Promise<ImageUploadResult> {
    try {
      logger.info('Starting profile picture upload:', { imageUri });
      
      // Validate image URI using utility
      const uriValidation = ImageUtils.validateImageUri(imageUri);
      if (!uriValidation.valid) {
        throw new Error(uriValidation.error || 'Invalid image URI');
      }
      
      // Check app state for iOS
      const uploadCheck = ImageUtils.shouldProceedWithUpload(AppState.currentState);
      if (!uploadCheck.proceed) {
        throw new Error(uploadCheck.reason || 'Cannot upload at this time');
      }
      
      // Log image info for debugging
      ImageUtils.logImageInfo(imageUri, 'Profile picture upload');

      const response = await UserAPI.uploadProfilePicture(imageUri);
      
      logger.info('Profile upload response:', response);
      
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
      
      // More specific error messages for common TestFlight issues
      let errorMessage = error.message || 'Failed to upload profile picture';
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again with a smaller image.';
      } else if (error.message?.includes('413') || error.message?.includes('too large')) {
        errorMessage = 'Image is too large. Please select a smaller photo.';
      } else if (error.message?.includes('unsupported') || error.message?.includes('format')) {
        errorMessage = 'Unsupported image format. Please use JPG or PNG.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Upload banner image
   */
  static async uploadBannerImage(imageUri: string): Promise<ImageUploadResult> {
    try {
      logger.info('Starting banner image upload:', { imageUri });
      
      // Validate image URI using utility
      const uriValidation = ImageUtils.validateImageUri(imageUri);
      if (!uriValidation.valid) {
        throw new Error(uriValidation.error || 'Invalid image URI');
      }
      
      // Check app state for iOS
      const uploadCheck = ImageUtils.shouldProceedWithUpload(AppState.currentState);
      if (!uploadCheck.proceed) {
        throw new Error(uploadCheck.reason || 'Cannot upload at this time');
      }
      
      // Log image info for debugging
      ImageUtils.logImageInfo(imageUri, 'Banner image upload');

      const response = await UserAPI.uploadBannerImage(imageUri);
      
      logger.info('Banner upload response:', response);
      
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
      
      // More specific error messages for common TestFlight issues
      let errorMessage = error.message || 'Failed to upload banner image';
      
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Upload timed out. Please try again with a smaller image.';
      } else if (error.message?.includes('413') || error.message?.includes('too large')) {
        errorMessage = 'Image is too large. Please select a smaller photo.';
      } else if (error.message?.includes('unsupported') || error.message?.includes('format')) {
        errorMessage = 'Unsupported image format. Please use JPG or PNG.';
      }
      
      return {
        success: false,
        error: errorMessage
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