/**
 * API Error Handling and Response Transformation
 * Standardized error processing and response normalization
 */

import { StandardAPIResponse, APIError, EnhancedApiError } from './types';
import { errorHandler } from '../../../utils/errorHandler';

/**
 * Response transformer to ensure consistent API response format
 */
export const transformResponse = <T = unknown>(response: unknown): StandardAPIResponse<T> => {
  // If already in standard format, return as-is
  if (response && typeof response === 'object' && response.hasOwnProperty('success') && response.hasOwnProperty('status')) {
    return response as StandardAPIResponse<T>;
  }
  
  // If response has expected API fields (like conversations, messages, etc.), return as-is
  // This prevents corruption of valid API responses that don't follow the "standard" format
  if (response && typeof response === 'object' && 
      ((response as any).conversations || (response as any).messages || (response as any).data || (response as any).friends)) {
    return response as StandardAPIResponse<T>;
  }
  
  // Only transform simple responses that clearly need wrapping
  return {
    success: true,
    status: 'success' as const,
    data: response as T,
    message: (response as any)?.message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Error transformer to ensure consistent error format
 */
export const transformError = (error: unknown): APIError => {
  const statusCode = (error as any).response?.status || (error as any).status || 500;
  const message = (error as any).response?.data?.message || (error as any).message || 'An unexpected error occurred';
  const code = (error as any).response?.data?.code || (error as any).code || 'UNKNOWN_ERROR';
  
  return {
    success: false,
    status: 'error' as const,
    error: {
      code,
      message,
      statusCode,
      details: (error as any).response?.data || (error as any).details
    },
    timestamp: new Date().toISOString(),
    requestId: (error as any).response?.headers?.['x-request-id']
  };
};

/**
 * Enhanced error creation for better error handling
 */
export const createEnhancedError = (error: unknown, originalRequest: { url: string; method: string; _retry?: boolean }): EnhancedApiError => {
  const standardizedError = errorHandler.standardizeError(error, {
    endpoint: originalRequest.url,
    method: originalRequest.method,
    retryAttempt: originalRequest._retry ? 1 : 0
  });
  
  return Object.assign(new Error(standardizedError.userMessage), {
    status: standardizedError.statusCode,
    statusCode: standardizedError.statusCode,
    code: standardizedError.code,
    isRateLimit: standardizedError.category === 'rate_limit',
    retryAfter: standardizedError.retryAfter,
    response: (error as any).response
  });
};

/**
 * Helper function for better error messages
 */
export function getErrorMessage(error: unknown): string {
  if ((error as any).response?.data?.message) {
    return (error as any).response.data.message;
  }
  
  if ((error as any).code === 'ECONNABORTED' || (error as any).message?.includes('timeout')) {
    return 'Request timed out. Please check your internet connection and try again.';
  }
  
  if ((error as any).code === 'NETWORK_ERROR' || !(error as any).response) {
    return 'Network error. Please check your internet connection.';
  }
  
  switch ((error as any).response?.status) {
    case 400:
      return 'Invalid request. Please try again.';
    case 401:
      return 'Authentication failed. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'Resource not found.';
    case 429:
      const retryAfter = (error as any).response?.headers?.['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) : 60;
      return `Rate limit reached. Please wait ${waitTime} seconds before trying again.`;
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again.';
    default:
      return (error as any).message || 'An unexpected error occurred.';
  }
}