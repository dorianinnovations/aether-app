/**
 * Shared Test Utilities
 * Common patterns and utilities for E2E tests to reduce code duplication
 */
/* eslint-disable no-console */

import { testApiClient } from './apiClient';
import { generateTestData, testState } from './testSetup';

// ========================================
// TEST USER MANAGEMENT
// ========================================

export interface TestUser {
  email: string;
  username: string;
  password: string;
  name: string;
}

export interface AuthenticatedTestUser extends TestUser {
  token: string;
  userId: string;
}

/**
 * Create a fresh test user with unique credentials
 */
export const createTestUser = (): TestUser => ({
  email: generateTestData.email(),
  username: generateTestData.username(),
  password: 'TestPassword123!',
  name: generateTestData.name()
});

/**
 * Register and authenticate a test user
 * Handles both signup and fallback login patterns
 */
export const setupAuthenticatedUser = async (
  user?: TestUser,
  testName?: string
): Promise<AuthenticatedTestUser> => {
  const testUser = user || createTestUser();
  const context = testName ? ` for ${testName}` : '';

  try {
    // Try to register new user
    const signupResponse = await testApiClient.publicRequest(
      'POST',
      '/auth/signup',
      testUser,
      201
    );
    
    const authenticatedUser: AuthenticatedTestUser = {
      ...testUser,
      token: (signupResponse as any).token,
      userId: (signupResponse as any).data?.user?.id || (signupResponse as any).user?.id
    };

    // Update global test state
    testState.authToken = (signupResponse as any).token;
    testState.currentUser = (signupResponse as any).data?.user || (signupResponse as any).user;
    
    console.log(`✅ Created test user: ${testUser.email}${context}`);
    return authenticatedUser;
    
  } catch (error) {
    // If signup fails, try to login with existing credentials
    try {
      const loginResponse = await testApiClient.publicRequest(
        'POST',
        '/auth/login',
        {
          email: testUser.email,
          password: testUser.password,
        }
      );
      
      const authenticatedUser: AuthenticatedTestUser = {
        ...testUser,
        token: (loginResponse as any).token,
        userId: (loginResponse as any).data?.user?.id || (loginResponse as any).user?.id
      };

      // Update global test state
      testState.authToken = (loginResponse as any).token;
      testState.currentUser = (loginResponse as any).data?.user || (loginResponse as any).user;
      
      console.log(`✅ Logged in test user: ${testUser.email}${context}`);
      return authenticatedUser;
      
    } catch (loginError) {
      console.error(`❌ Failed to create or login test user${context}:`, loginError);
      throw new Error(`Failed to create or login test user${context}`);
    }
  }
};

/**
 * Clean up a test user account
 */
export const cleanupTestUser = async (userId?: string): Promise<void> => {
  if (!userId && !testState.currentUser?.id) {
    return;
  }

  const targetUserId = userId || testState.currentUser?.id;
  
  try {
    await testApiClient.authenticatedRequest(
      'DELETE',
      '/user/delete',
      undefined,
      200
    );
    console.log(`🗑️  Cleaned up test user: ${targetUserId}`);
  } catch (error) {
    console.warn(`⚠️  Failed to cleanup test user ${targetUserId}:`, error);
  }
};

// ========================================
// RESOURCE MANAGEMENT
// ========================================

export interface TestResource {
  id: string;
  type: 'conversation' | 'friend' | 'post' | 'message';
  endpoint: string;
}

/**
 * Resource manager for tracking and cleaning up test resources
 */
export class TestResourceManager {
  private resources: TestResource[] = [];

  /**
   * Track a resource for cleanup
   */
  track(resource: TestResource): void {
    this.resources.push(resource);
  }

  /**
   * Track a conversation for cleanup
   */
  trackConversation(conversationId: string): void {
    this.track({
      id: conversationId,
      type: 'conversation',
      endpoint: `/conversation/conversations/${conversationId}`
    });
  }

  /**
   * Track a friend relationship for cleanup
   */
  trackFriend(friendshipId: string): void {
    this.track({
      id: friendshipId,
      type: 'friend',
      endpoint: `/social/friends/${friendshipId}`
    });
  }

  /**
   * Clean up all tracked resources
   */
  async cleanupAll(): Promise<void> {
    const cleanupPromises = this.resources.map(async (resource) => {
      try {
        await testApiClient.authenticatedRequest(
          'DELETE',
          resource.endpoint,
          undefined,
          200
        );
        console.log(`🗑️  Cleaned up ${resource.type}: ${resource.id}`);
      } catch (error) {
        console.warn(`⚠️  Failed to cleanup ${resource.type} ${resource.id}:`, error);
      }
    });

    await Promise.allSettled(cleanupPromises);
    this.resources = [];
  }

  /**
   * Get tracked resources
   */
  getTrackedResources(): TestResource[] {
    return [...this.resources];
  }

  /**
   * Clear tracking without cleanup
   */
  clear(): void {
    this.resources = [];
  }
}

// ========================================
// COMMON TEST PATTERNS
// ========================================

/**
 * Standard test suite setup pattern
 */
export const createTestSuite = (suiteName: string) => {
  const resourceManager = new TestResourceManager();
  let authenticatedUser: AuthenticatedTestUser | null = null;

  const beforeAll = async () => {
    authenticatedUser = await setupAuthenticatedUser(undefined, suiteName);
  };

  const afterAll = async () => {
    // Cleanup resources first, then user
    await resourceManager.cleanupAll();
    
    if (authenticatedUser?.userId) {
      await cleanupTestUser(authenticatedUser.userId);
    }
  };

  return {
    resourceManager,
    getAuthenticatedUser: () => authenticatedUser,
    beforeAll,
    afterAll
  };
};

/**
 * Create conversation for testing
 */
export const createTestConversation = async (
  title?: string,
  firstMessage?: string
): Promise<string> => {
  const testTitle = title || generateTestData.title();
  
  const response = await testApiClient.authenticatedRequest(
    'POST',
    '/conversation/conversations',
    { 
      title: testTitle,
      ...(firstMessage && { firstMessage })
    },
    201
  );

  // Extract conversation ID from various possible locations
  const conversationId = (response as any).id || 
                         (response as any)._id || 
                         (response as any).conversationId || 
                         (response as any).data?.id || 
                         (response as any).data?._id ||
                         (response as any).data?.conversationId;

  if (!conversationId) {
    throw new Error('Failed to extract conversation ID from response');
  }

  console.log(`📝 Created test conversation: ${conversationId}`);
  return conversationId;
};

/**
 * Send test message to conversation
 */
export const sendTestMessage = async (
  conversationId: string,
  content?: string,
  role: 'user' | 'assistant' = 'user'
): Promise<void> => {
  const message = content || generateTestData.message();
  
  await testApiClient.authenticatedRequest(
    'POST',
    `/conversation/conversations/${conversationId}/messages`,
    {
      role,
      content: message,
      timestamp: new Date().toISOString()
    },
    200
  );

  console.log(`💬 Sent ${role} message to conversation ${conversationId}`);
};

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Validate response format and extract data
 */
export const validateAndExtract = {
  conversationId(response: any): string {
    const id = response.id || 
              response._id || 
              response.conversationId || 
              response.data?.id || 
              response.data?._id ||
              response.data?.conversationId;
    
    if (!id) {
      throw new Error('Response does not contain a valid conversation ID');
    }
    
    return id;
  },

  userId(response: any): string {
    const id = response.id ||
              response._id ||
              response.data?.user?.id ||
              response.data?.user?._id ||
              response.user?.id ||
              response.user?._id;
    
    if (!id) {
      throw new Error('Response does not contain a valid user ID');
    }
    
    return id;
  },

  token(response: any): string {
    const token = response.token ||
                 response.data?.token ||
                 response.accessToken;
    
    if (!token) {
      throw new Error('Response does not contain a valid auth token');
    }
    
    return token;
  },

  array(response: any, arrayField?: string): any[] {
    let array;
    
    if (arrayField) {
      array = response[arrayField] || response.data?.[arrayField];
    } else {
      array = response.conversations || 
              response.friends ||
              response.messages ||
              response.data?.conversations ||
              response.data?.friends ||
              response.data?.messages ||
              response.data ||
              response;
    }
    
    if (!Array.isArray(array)) {
      console.warn('Expected array but got:', typeof array, array);
      return [];
    }
    
    return array;
  }
};

// ========================================
// PERFORMANCE TESTING HELPERS
// ========================================

/**
 * Measure execution time of async operations
 */
export const measureTime = async <T>(
  operation: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> => {
  const startTime = Date.now();
  const result = await operation();
  const duration = Date.now() - startTime;
  
  if (label) {
    console.log(`⏱️  ${label}: ${duration}ms`);
  }
  
  return { result, duration };
};

/**
 * Run operation with timeout
 */
export const withTimeout = <T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> => {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage || `Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
};

/**
 * Retry operation with backoff
 */
export const retry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  backoffMs: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        break;
      }
      
      const delay = backoffMs * Math.pow(backoffMultiplier, attempt - 1);
      console.warn(`⚠️  Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// ========================================
// BATCH OPERATIONS
// ========================================

/**
 * Run operations in parallel with concurrency limit
 */
export const runInBatches = async <T, R>(
  items: T[],
  operation: (item: T, index: number) => Promise<R>,
  batchSize: number = 5
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map((item, batchIndex) => 
      operation(item, i + batchIndex)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Batch operation failed for item ${i + index}:`, result.reason);
        throw result.reason;
      }
    });
  }
  
  return results;
};

// Export singleton resource manager for global use
export const globalResourceManager = new TestResourceManager();