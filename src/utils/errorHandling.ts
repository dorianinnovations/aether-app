/**
 * Error Handling Utilities
 * Centralized error processing and user-friendly message generation
 */

import { logger } from './logger';

export interface ErrorResult {
  userMessage: string;
  technicalMessage: string;
  errorCode?: string;
  shouldReport: boolean;
}

export class ErrorHandler {
  /**
   * Process API errors and return user-friendly messages
   */
  static processApiError(error: any, context?: string): ErrorResult {
    const defaultMessage = 'Something went wrong. Please try again.';
    let userMessage = defaultMessage;
    let technicalMessage = error?.message || 'Unknown error';
    let errorCode: string | undefined;
    let shouldReport = true;

    try {
      // Handle different error formats
      if (error?.response) {
        // Axios-style error
        const status = error.response.status;
        const data = error.response.data;
        
        errorCode = `HTTP_${status}`;
        technicalMessage = `HTTP ${status}: ${data?.message || data?.error || error.message}`;

        switch (status) {
          case 400:
            userMessage = this.handleBadRequestError(data);
            break;
          case 401:
            userMessage = 'Your session has expired. Please sign in again.';
            break;
          case 403:
            userMessage = 'You don\'t have permission to perform this action.';
            break;
          case 404:
            userMessage = 'The requested resource was not found.';
            break;
          case 413:
            userMessage = 'The file is too large. Please select a smaller file.';
            break;
          case 415:
            userMessage = 'Unsupported file format. Please use JPG or PNG images.';
            break;
          case 429:
            userMessage = 'Too many requests. Please wait a moment before trying again.';
            break;
          case 500:
            userMessage = 'Server error. Please try again in a few moments.';
            break;
          case 502:
          case 503:
          case 504:
            userMessage = 'Service is temporarily unavailable. Please try again later.';
            break;
          default:
            userMessage = `Request failed (${status}). Please try again.`;
        }
      } else if (error?.code) {
        // Network or other coded errors
        errorCode = error.code;
        userMessage = this.handleCodedError(error.code);
      } else if (error?.message) {
        // Generic errors with messages
        userMessage = this.processErrorMessage(error.message);
      }

      // Handle specific contexts
      if (context) {
        userMessage = this.addContextToMessage(userMessage, context);
      }

    } catch (processingError) {
      logger.error('Error while processing error:', processingError);
      userMessage = defaultMessage;
      shouldReport = true;
    }

    return {
      userMessage,
      technicalMessage,
      errorCode,
      shouldReport,
    };
  }

  /**
   * Handle 400 Bad Request errors
   */
  private static handleBadRequestError(data: any): string {
    if (data?.code === 'LIMIT_FILE_SIZE') {
      return 'File is too large. Please select a smaller image (max 10MB).';
    }
    
    if (data?.code === 'INVALID_FILE_TYPE') {
      return 'Invalid file type. Please select a JPG or PNG image.';
    }

    if (data?.field === 'bannerImage') {
      if (data?.error?.includes('too large') || data?.code === 'LIMIT_FILE_SIZE') {
        return 'Banner image is too large. Please select a smaller image.';
      }
      if (data?.error?.includes('unsupported') || data?.error?.includes('type')) {
        return 'Unsupported banner image format. Please use JPG or PNG.';
      }
      return 'Banner image upload failed. Please try a different image.';
    }

    if (data?.field === 'profileImage' || data?.field === 'profilePhoto') {
      if (data?.error?.includes('too large') || data?.code === 'LIMIT_FILE_SIZE') {
        return 'Profile image is too large. Please select a smaller image.';
      }
      if (data?.error?.includes('unsupported') || data?.error?.includes('type')) {
        return 'Unsupported profile image format. Please use JPG or PNG.';
      }
      return 'Profile image upload failed. Please try a different image.';
    }

    if (data?.validation) {
      return data.validation[0]?.message || 'Please check your input and try again.';
    }

    return data?.message || data?.error || 'Invalid request. Please check your input.';
  }

  /**
   * Handle errors with specific codes
   */
  private static handleCodedError(code: string): string {
    switch (code) {
      case 'NETWORK_ERROR':
      case 'ERR_NETWORK':
        return 'Network error. Please check your internet connection.';
      case 'TIMEOUT':
      case 'ERR_TIMEOUT':
        return 'Request timed out. Please try again.';
      case 'ERR_CANCELED':
        return 'Request was cancelled.';
      case 'ERR_CONNECTION_REFUSED':
        return 'Unable to connect to server. Please try again later.';
      case 'PERMISSION_DENIED':
        return 'Permission denied. Please check your device settings.';
      case 'FILE_NOT_FOUND':
        return 'File not found. Please select a different file.';
      case 'INSUFFICIENT_STORAGE':
        return 'Insufficient storage space on your device.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Process generic error messages to make them user-friendly
   */
  private static processErrorMessage(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (lowerMessage.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    if (lowerMessage.includes('permission') || lowerMessage.includes('unauthorized')) {
      return 'Permission denied. Please check your settings or sign in again.';
    }

    if (lowerMessage.includes('file') && lowerMessage.includes('large')) {
      return 'File is too large. Please select a smaller file.';
    }

    if (lowerMessage.includes('unsupported') || lowerMessage.includes('format')) {
      return 'Unsupported file format. Please try a different file type.';
    }

    if (lowerMessage.includes('memory') || lowerMessage.includes('out of memory')) {
      return 'Not enough memory available. Please close other apps and try again.';
    }

    if (lowerMessage.includes('cancelled') || lowerMessage.includes('canceled')) {
      return ''; // Don't show message for user cancellations
    }

    // Return original message if it seems user-friendly
    if (message.length < 100 && !message.includes('Error:') && !message.includes('exception')) {
      return message;
    }

    return 'Something went wrong. Please try again.';
  }

  /**
   * Add context-specific information to error messages
   */
  private static addContextToMessage(message: string, context: string): string {
    if (message === '') return ''; // Don't add context to empty messages

    switch (context) {
      case 'profile_image_upload':
        if (!message.toLowerCase().includes('profile')) {
          return `Profile image upload failed: ${message}`;
        }
        break;
      case 'banner_image_upload':
        if (!message.toLowerCase().includes('banner')) {
          return `Banner image upload failed: ${message}`;
        }
        break;
      case 'profile_save':
        if (!message.toLowerCase().includes('profile') && !message.toLowerCase().includes('save')) {
          return `Profile save failed: ${message}`;
        }
        break;
      case 'login':
        if (!message.toLowerCase().includes('sign') && !message.toLowerCase().includes('login')) {
          return `Sign in failed: ${message}`;
        }
        break;
      case 'signup':
        if (!message.toLowerCase().includes('sign') && !message.toLowerCase().includes('register')) {
          return `Sign up failed: ${message}`;
        }
        break;
    }

    return message;
  }

  /**
   * Get user-friendly message for file upload errors
   */
  static getFileUploadErrorMessage(error: any, fileType: 'image' | 'document' = 'image'): string {
    const processed = this.processApiError(error, `${fileType}_upload`);
    
    // Additional file-specific handling
    if (processed.userMessage.includes('Something went wrong')) {
      if (fileType === 'image') {
        return 'Image upload failed. Please try a different image or check your connection.';
      } else {
        return 'File upload failed. Please try a different file or check your connection.';
      }
    }

    return processed.userMessage;
  }

  /**
   * Log error for debugging while returning user-friendly message
   */
  static logAndProcess(error: any, context?: string): string {
    const processed = this.processApiError(error, context);
    
    logger.error(`Error in ${context || 'unknown context'}:`, {
      userMessage: processed.userMessage,
      technicalMessage: processed.technicalMessage,
      errorCode: processed.errorCode,
      originalError: error,
    });

    return processed.userMessage;
  }
}