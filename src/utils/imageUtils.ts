/**
 * Image Utilities for iOS/TestFlight Compatibility
 * Handles memory management and platform-specific image processing
 */

import { Platform, Dimensions } from 'react-native';
import { logger } from './logger';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class ImageUtils {
  
  /**
   * Get optimal image processing settings for the current platform
   */
  static getOptimalSettings(type: 'profile' | 'banner'): ImageProcessingOptions {
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    
    if (type === 'profile') {
      return {
        maxWidth: Math.min(512, screenWidth),
        maxHeight: Math.min(512, screenHeight),
        quality: Platform.OS === 'ios' ? 0.6 : 0.8,
        format: 'jpeg'
      };
    } else {
      // Banner image
      return {
        maxWidth: Math.min(1024, screenWidth * 2),
        maxHeight: Math.min(512, screenHeight * 0.5),
        quality: Platform.OS === 'ios' ? 0.5 : 0.7,
        format: 'jpeg'
      };
    }
  }
  
  /**
   * Check if device has sufficient memory for image processing
   */
  static async checkMemoryAvailability(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      // On iOS, we can't directly check memory, but we can use heuristics
      const screenSize = Dimensions.get('window').width * Dimensions.get('window').height;
      const isLargeScreen = screenSize > 500000; // Rough estimate for iPad
      
      // Assume sufficient memory for basic operations
      // In a real app, you might use a native module to check actual memory
      return true;
    }
    return true;
  }
  
  /**
   * Validate image URI format
   */
  static validateImageUri(uri: string): { valid: boolean; error?: string } {
    if (!uri) {
      return { valid: false, error: 'Image URI is required' };
    }
    
    // Check URI format
    const validPrefixes = ['file://', 'content://', 'ph://', 'assets-library://'];
    const hasValidPrefix = validPrefixes.some(prefix => uri.startsWith(prefix));
    
    if (!hasValidPrefix && !uri.startsWith('http')) {
      return { valid: false, error: 'Invalid image URI format' };
    }
    
    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const hasValidExtension = validExtensions.some(ext => 
      uri.toLowerCase().includes(ext)
    );
    
    if (!hasValidExtension && !uri.includes('base64')) {
      logger.warn('Image URI has no recognizable extension:', uri);
      // Don't fail validation, just warn
    }
    
    return { valid: true };
  }
  
  /**
   * Get recommended compression settings based on image size estimation
   */
  static getCompressionSettings(estimatedSize: number): ImageProcessingOptions {
    // Estimate based on common image sizes
    if (estimatedSize > 5 * 1024 * 1024) { // > 5MB
      return {
        quality: 0.4,
        maxWidth: 800,
        maxHeight: 800
      };
    } else if (estimatedSize > 2 * 1024 * 1024) { // > 2MB
      return {
        quality: 0.6,
        maxWidth: 1024,
        maxHeight: 1024
      };
    } else {
      return {
        quality: 0.8,
        maxWidth: 2048,
        maxHeight: 2048
      };
    }
  }
  
  /**
   * Platform-specific image picker options
   */
  static getImagePickerOptions(type: 'profile' | 'banner') {
    const baseOptions = {
      quality: Platform.OS === 'ios' ? 0.7 : 0.8,
    };
    
    if (type === 'profile') {
      return {
        ...baseOptions,
        aspect: [1, 1] as [number, number],
      };
    } else {
      return {
        ...baseOptions,
        aspect: [16, 9] as [number, number],
      };
    }
  }
  
  /**
   * Log image processing information for debugging
   */
  static logImageInfo(uri: string, context: string) {
    logger.info(`Image processing - ${context}:`, {
      uri: uri.substring(0, 50) + '...', // Truncate for privacy
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Check if upload should proceed based on app state and platform
   */
  static shouldProceedWithUpload(appState: string): { proceed: boolean; reason?: string } {
    if (Platform.OS === 'ios') {
      if (appState !== 'active') {
        return {
          proceed: false,
          reason: 'iOS requires app to be in foreground for reliable image uploads'
        };
      }
    }
    
    return { proceed: true };
  }
  
  /**
   * Get platform-specific FormData configuration
   */
  static getFormDataConfig(uri: string, type: 'profile' | 'banner') {
    // Determine file type
    let mimeType = 'image/jpeg';
    let fileName = `${type}-image.jpg`;
    
    if (uri.toLowerCase().includes('.png')) {
      mimeType = 'image/png';
      fileName = `${type}-image.png`;
    } else if (uri.toLowerCase().includes('.webp')) {
      mimeType = 'image/webp';
      fileName = `${type}-image.webp`;
    }
    
    const fileObject: any = {
      uri: uri,
      type: mimeType,
      name: fileName,
    };
    
    // iOS-specific adjustments
    if (Platform.OS === 'ios') {
      // Some iOS versions require URI without file:// prefix in certain contexts
      // but expo-image-picker usually provides the correct format
      logger.info('iOS FormData config:', { originalUri: uri, mimeType, fileName });
    }
    
    return { fileObject, mimeType, fileName };
  }
}