/**
 * Unified Error Handling System
 * Standardized error handling, logging, and user-friendly error messages
 */

import { APIError, StandardAPIResponse } from '../types/api';

// ========================================
// ERROR TYPES AND CLASSIFICATIONS
// ========================================

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  CLIENT = 'client',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface StandardizedError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  userMessage: string;
  statusCode: number;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
  retryable: boolean;
  retryAfter?: number;
}

// ========================================
// ERROR CODE MAPPINGS
// ========================================

const ERROR_CODE_MAPPINGS: Record<string, {
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  retryable: boolean;
}> = {
  // Network Errors
  'NETWORK_ERROR': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Unable to connect to the server. Please check your internet connection.',
    retryable: true
  },
  'TIMEOUT_ERROR': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Request timed out. Please try again.',
    retryable: true
  },
  'CONNECTION_REFUSED': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Cannot connect to server. Please try again later.',
    retryable: true
  },

  // Authentication Errors
  'UNAUTHORIZED': {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Your session has expired. Please sign in again.',
    retryable: false
  },
  'INVALID_CREDENTIALS': {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Invalid email or password. Please try again.',
    retryable: false
  },
  'TOKEN_EXPIRED': {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Your session has expired. Please sign in again.',
    retryable: false
  },
  'REFRESH_TOKEN_INVALID': {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Please sign in again to continue.',
    retryable: false
  },

  // Validation Errors
  'VALIDATION_ERROR': {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Please check your input and try again.',
    retryable: false
  },
  'MISSING_REQUIRED_FIELD': {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Please fill in all required fields.',
    retryable: false
  },
  'INVALID_EMAIL_FORMAT': {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'Please enter a valid email address.',
    retryable: false
  },
  'USERNAME_TAKEN': {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'This username is already taken. Please choose another.',
    retryable: false
  },
  'EMAIL_ALREADY_EXISTS': {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    userMessage: 'An account with this email already exists.',
    retryable: false
  },

  // Permission Errors
  'FORBIDDEN': {
    category: ErrorCategory.PERMISSION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'You do not have permission to perform this action.',
    retryable: false
  },
  'ACCESS_DENIED': {
    category: ErrorCategory.PERMISSION,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Access denied. Please contact support if you believe this is an error.',
    retryable: false
  },

  // Rate Limiting
  'RATE_LIMIT_EXCEEDED': {
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Too many requests. Please wait before trying again.',
    retryable: true
  },

  // Server Errors
  'INTERNAL_SERVER_ERROR': {
    category: ErrorCategory.SERVER,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Something went wrong on our end. Please try again later.',
    retryable: true
  },
  'SERVICE_UNAVAILABLE': {
    category: ErrorCategory.SERVER,
    severity: ErrorSeverity.HIGH,
    userMessage: 'Service is temporarily unavailable. Please try again later.',
    retryable: true
  },
  'DATABASE_ERROR': {
    category: ErrorCategory.SERVER,
    severity: ErrorSeverity.CRITICAL,
    userMessage: 'Database connection issue. Please try again later.',
    retryable: true
  },

  // Client Errors
  'NOT_FOUND': {
    category: ErrorCategory.CLIENT,
    severity: ErrorSeverity.LOW,
    userMessage: 'The requested resource was not found.',
    retryable: false
  },
  'BAD_REQUEST': {
    category: ErrorCategory.CLIENT,
    severity: ErrorSeverity.LOW,
    userMessage: 'Invalid request. Please check your input.',
    retryable: false
  },
  'METHOD_NOT_ALLOWED': {
    category: ErrorCategory.CLIENT,
    severity: ErrorSeverity.LOW,
    userMessage: 'This action is not allowed.',
    retryable: false
  }
};

// ========================================
// STATUS CODE MAPPINGS
// ========================================

const STATUS_CODE_MAPPINGS: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'USERNAME_TAKEN', // or EMAIL_ALREADY_EXISTS
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMIT_EXCEEDED',
  500: 'INTERNAL_SERVER_ERROR',
  502: 'SERVICE_UNAVAILABLE',
  503: 'SERVICE_UNAVAILABLE',
  504: 'TIMEOUT_ERROR'
};

// ========================================
// ERROR HANDLER CLASS
// ========================================

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: StandardizedError[] = [];

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Standardize any error into our unified format
   */
  public standardizeError(error: unknown, context?: Record<string, unknown>): StandardizedError {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    // Determine error code and status
    let code = 'UNKNOWN_ERROR';
    let statusCode = 500;
    let message = 'An unexpected error occurred';
    let retryAfter: number | undefined;

    // Handle different error types
    if (error && typeof error === 'object' && 'response' in error) {
      // Axios error with response
      statusCode = (error as any).response.status;
      code = STATUS_CODE_MAPPINGS[statusCode] || 'UNKNOWN_ERROR';
      message = (error as any).response.data?.message || (error as any).message || message;
      
      // Check for rate limiting
      if (statusCode === 429) {
        retryAfter = parseInt((error as any).response.headers?.['retry-after'] || '60');
      }
    } else if (error && typeof error === 'object' && 'request' in error) {
      // Network error
      code = 'NETWORK_ERROR';
      statusCode = 0;
      message = 'Network connection failed';
    } else if (error && typeof error === 'object' && 'code' in error) {
      // Handle specific error codes
      if ((error as any).code === 'ECONNABORTED') {
        code = 'TIMEOUT_ERROR';
        statusCode = 408;
      } else if ((error as any).code === 'ECONNREFUSED') {
        code = 'CONNECTION_REFUSED';
        statusCode = 503;
      } else {
        code = (error as any).code;
      }
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = (error as any).message;
    }

    // Get error mapping or use defaults
    const mapping = ERROR_CODE_MAPPINGS[code] || {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'Something went wrong. Please try again.',
      retryable: false
    };

    const standardizedError: StandardizedError = {
      id: errorId,
      category: mapping.category,
      severity: mapping.severity,
      code,
      message,
      userMessage: mapping.userMessage,
      statusCode,
      timestamp,
      context,
      stack: error && typeof error === 'object' && 'stack' in error ? (error as any).stack : undefined,
      retryable: mapping.retryable,
      retryAfter
    };

    // Log the error
    this.logError(standardizedError);

    return standardizedError;
  }

  /**
   * Convert standardized error to API error response
   */
  public toAPIError(error: StandardizedError): APIError {
    return {
      success: false,
      status: 'error',
      error: {
        code: error.code,
        message: error.userMessage,
        statusCode: error.statusCode,
        details: {
          id: error.id,
          category: error.category,
          severity: error.severity,
          retryable: error.retryable,
          retryAfter: error.retryAfter,
          context: error.context
        }
      },
      timestamp: error.timestamp,
      requestId: error.id
    };
  }

  /**
   * Handle error and return standardized API response
   */
  public handleError<T = unknown>(error: unknown, context?: Record<string, unknown>): StandardAPIResponse<T> {
    const standardizedError = this.standardizeError(error, context);
    return this.toAPIError(standardizedError);
  }

  /**
   * Log error to internal log and external services
   */
  private logError(error: StandardizedError): void {
    // Add to internal log (keep last 100 errors)
    this.errorLog.push(error);
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Console logging based on severity
    const logLevel = this.getLogLevel(error.severity);
    console[logLevel](`[${error.category.toUpperCase()}] ${error.code}:`, {
      id: error.id,
      message: error.message,
      userMessage: error.userMessage,
      statusCode: error.statusCode,
      context: error.context,
      timestamp: error.timestamp
    });

    // In production, send to external logging service
    if (__DEV__ === false && error.severity === ErrorSeverity.CRITICAL) {
      this.sendToExternalLogging(error);
    }
  }

  /**
   * Get appropriate console log level for error severity
   */
  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }

  /**
   * Send critical errors to external logging service
   */
  private sendToExternalLogging(error: StandardizedError): void {
    // Implementation for external logging service (e.g., Sentry, LogRocket, etc.)
    // This would be configured based on the specific service being used
    try {
      // Example: Sentry.captureException(error);
      console.error('CRITICAL ERROR - Should be sent to external logging:', error);
    } catch (loggingError) {
      console.error('Failed to send error to external logging:', loggingError);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent errors from log
   */
  public getRecentErrors(limit: number = 10): StandardizedError[] {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>
    };

    // Initialize counts
    Object.values(ErrorCategory).forEach(category => {
      stats.errorsByCategory[category] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.errorsBySeverity[severity] = 0;
    });

    // Count errors
    this.errorLog.forEach(error => {
      stats.errorsByCategory[error.category]++;
      stats.errorsBySeverity[error.severity]++;
    });

    return stats;
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

/**
 * Quick function to standardize and handle any error
 */
export const handleError = (error: unknown, context?: Record<string, unknown>): StandardAPIResponse => {
  return errorHandler.handleError(error, context);
};

/**
 * Check if an error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  const standardized = errorHandler.standardizeError(error);
  return standardized.retryable;
};

/**
 * Get user-friendly message from any error
 */
export const getUserMessage = (error: unknown): string => {
  const standardized = errorHandler.standardizeError(error);
  return standardized.userMessage;
};

/**
 * Check if error is network related
 */
export const isNetworkError = (error: unknown): boolean => {
  const standardized = errorHandler.standardizeError(error);
  return standardized.category === ErrorCategory.NETWORK;
};

/**
 * Check if error is authentication related
 */
export const isAuthError = (error: unknown): boolean => {
  const standardized = errorHandler.standardizeError(error);
  return standardized.category === ErrorCategory.AUTHENTICATION;
};

/**
 * Create a standardized error response
 */
export const createErrorResponse = <T = any>(
  code: string,
  message: string,
  statusCode: number = 400,
  context?: Record<string, any>
): StandardAPIResponse<T> => {
  const error = new Error(message);
  (error as any).code = code;
  (error as any).statusCode = statusCode;
  
  return errorHandler.handleError(error, context);
};

// Export the ErrorHandler class for advanced usage
export { ErrorHandler };