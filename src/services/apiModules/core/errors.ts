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
  if (response.hasOwnProperty('success') && response.hasOwnProperty('status')) {
    return response;
  }
  
  // Transform legacy formats to standard format
  // Don't double-wrap the data - if response already has data, use it directly
  return {
    success: true,
    status: 'success' as const,
    data: response,
    message: response.message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Error transformer to ensure consistent error format
 */
export const transformError = (error: unknown): APIError => {
  const statusCode = error.response?.status || error.status || 500;
  const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
  const code = error.response?.data?.code || error.code || 'UNKNOWN_ERROR';
  
  return {
    success: false,
    status: 'error' as const,
    error: {
      code,
      message,
      statusCode,
      details: error.response?.data || error.details
    },
    timestamp: new Date().toISOString(),
    requestId: error.response?.headers?.['x-request-id']
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
    response: error.response
  });
};

/**
 * Helper function for better error messages
 */
export function getErrorMessage(error: unknown): string {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return 'Request timed out. Please check your internet connection and try again.';
  }
  
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    return 'Network error. Please check your internet connection.';
  }
  
  switch (error.response?.status) {
    case 400:
      return 'Invalid request. Please try again.';
    case 401:
      return 'Authentication failed. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'Resource not found.';
    case 429:
      const retryAfter = error.response?.headers?.['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) : 60;
      return `Rate limit reached. Please wait ${waitTime} seconds before trying again.`;
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}