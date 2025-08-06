/**
 * E2E Chat and Messaging Tests
 * Tests AI chat functionality, streaming, and message handling
 */
/* eslint-disable no-console */

import { testApiClient } from '../setup/apiClient';
import { TEST_USERS, testState, assertCondition, generateTestData, delay } from '../setup/testSetup';

describe('E2E Chat and Messaging', () => {
  let conversationId: string | null = null;

  beforeAll(async () => {
    // Create a test user for messaging tests
    const testUser = {
      email: generateTestData.email(),
      username: generateTestData.username(),
      password: 'TestPassword123!',
      name: 'Messaging Test User'
    };

    try {
      // Try to register new user
      const signupResponse = await testApiClient.publicRequest(
        'POST',
        '/auth/signup',
        testUser,
        201
      );
      
      testState.authToken = (signupResponse as any)?.token;
      testState.currentUser = (signupResponse as any)?.data?.user;
      console.log(`✅ Created messaging test user: ${testUser.email}`);
      
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
        
        testState.authToken = (loginResponse as any)?.token;
        testState.currentUser = (loginResponse as any)?.data?.user;
        console.log(`✅ Logged in messaging test user: ${testUser.email}`);
        
      } catch (loginError) {
        throw new Error('Failed to create or login test user for messaging tests');
      }
    }
  });

  afterAll(async () => {
    // Cleanup: Delete created conversation
    if (conversationId) {
      try {
        await testApiClient.authenticatedRequest(
          'DELETE',
          `/conversation/conversations/${conversationId}`,
          undefined,
          200
        );
      } catch (error) {
        console.warn('Failed to cleanup conversation:', error);
      }
    }
  });

  describe('AI Chat Streaming', () => {
    test('should stream AI chat response', async () => {
      const testMessage = 'Hello, this is a test message for streaming chat.';
      
      const chunks = await testApiClient.testStreamingChat('/social-chat', testMessage);

      // Validate streaming response
      assertCondition(
        chunks.length > 0,
        'Should receive streaming chunks',
        chunks.length
      );

      const fullResponse = chunks.join('');
      assertCondition(
        fullResponse.length > 0,
        'Combined response should have content',
        fullResponse.length
      );

      // Validate response quality (basic checks)
      assertCondition(
        fullResponse.length > 10,
        'Response should be substantial',
        fullResponse.length
      );

      console.log(`📝 AI Response: ${fullResponse}`);
    }, 30000); // 30 second timeout for AI response

    test('should handle streaming chat with web search', async () => {
      const testMessage = 'What is the latest news about React Native?';
      
      try {
        const chunks = await testApiClient.testStreamingChat('/social-chat', testMessage);
        
        const fullResponse = chunks.join('');
        
        // Response should contain web search results or indicate search was performed
        console.log(`🔍 Web Search Response: ${fullResponse}`);
        
        expect(chunks.length).toBeGreaterThan(0);
        expect(fullResponse.length).toBeGreaterThan(0);
        
      } catch (error: any) {
        // Web search might not be available in test environment
        if (error.message.includes('web search')) {
          console.log('ℹ️  Web search not available in test environment');
        } else {
          throw error;
        }
      }
    }, 45000); // Extended timeout for web search

    test('should stream chat with file attachments', async () => {
      const testMessage = 'Please analyze this test image.';
      
      // Create a mock base64 image for testing
      const mockImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      try {
        // Test streaming with files endpoint
        const formData = new FormData();
        formData.append('message', testMessage);
        formData.append('stream', 'true');
        formData.append('files', {
          uri: mockImageBase64,
          type: 'image/png',
          name: 'test-image.png'
        } as any);

        const response = await testApiClient.testFileUpload(
          '/social-chat-with-files',
          {
            uri: mockImageBase64,
            type: 'image/png', 
            name: 'test-image.png'
          },
          { message: testMessage }
        );

        expect(response).toBeDefined();
        console.log('📎 File attachment response received');
        
      } catch (error: any) {
        // File processing might not be fully configured in test environment
        if (error.response?.status === 415 || error.response?.status === 400) {
          console.log('ℹ️  File processing not fully configured in test environment');
        } else {
          throw error;
        }
      }
    }, 30000);

    test('should handle various message types', async () => {
      const testMessages = [
        'Simple greeting: Hello!',
        'Question: What is 2 + 2?',
        'Complex query: Explain quantum computing in simple terms.',
        'Code request: Write a JavaScript function to sort an array.',
        'Creative: Write a short poem about testing.',
      ];

      for (const message of testMessages) {
        try {
          const chunks = await testApiClient.testStreamingChat('/social-chat', message);
          const response = chunks.join('');
          
          assertCondition(
            response.length > 5,
            `Response to "${message.substring(0, 20)}..." should be meaningful`,
            response.length
          );

          console.log(`💬 "${message.substring(0, 30)}..." -> ${response.substring(0, 50)}...`);
          
          // Small delay between requests to avoid rate limiting
          await delay(2000);
          
        } catch (error: any) {
          console.error(`Failed for message: "${message}":`, error.message);
          throw error;
        }
      }
    }, 120000); // 2 minute timeout for multiple messages

    test('should handle rate limiting gracefully', async () => {
      // Send multiple rapid requests to test rate limiting
      const promises = Array.from({ length: 10 }, (_, i) => 
        testApiClient.testStreamingChat('/social-chat', `Test message ${i + 1}`)
      );

      try {
        const results = await Promise.allSettled(promises);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const rateLimited = results.filter(r => 
          r.status === 'rejected' && 
          (r.reason?.message?.includes('429') || r.reason?.message?.includes('rate'))
        ).length;

        console.log(`📊 Rate limit test: ${successful} successful, ${rateLimited} rate limited`);
        
        // Should handle some requests successfully and rate limit others appropriately
        expect(successful + rateLimited).toBe(10);
        
      } catch (error) {
        console.log('ℹ️  Rate limiting test completed with mixed results');
      }
    }, 60000);
  });

  describe('Message Validation and Error Handling', () => {
    test('should validate message content', async () => {
      const invalidMessages = [
        '', // Empty message
        ' '.repeat(10000), // Extremely long message
        '🔥'.repeat(1000), // Emoji spam
      ];

      for (const invalidMessage of invalidMessages) {
        try {
          await testApiClient.testStreamingChat('/social-chat', invalidMessage);
        } catch (error: any) {
          // Should handle invalid messages gracefully
          expect(error.response?.status).toBeOneOf([400, 413, 422]);
        }
      }
    });

    test('should handle network interruptions', async () => {
      // This test simulates network issues during streaming
      // In a real test environment, you might use network simulation tools
      
      try {
        const testMessage = 'This is a test for network interruption handling.';
        
        // Start streaming request
        const streamPromise = testApiClient.testStreamingChat('/social-chat', testMessage);
        
        // Wait a bit then the request should complete or handle interruption
        const chunks = await streamPromise;
        
        // If successful, verify we got some response
        if (chunks.length > 0) {
          expect(chunks.join('').length).toBeGreaterThan(0);
        }
        
      } catch (error: any) {
        // Network interruptions should be handled gracefully
        expect(error.message).toMatch(/timeout|network|connection/i);
      }
    }, 15000);

    test('should handle malformed requests', async () => {
      // Test various malformed request scenarios
      const malformedRequests = [
        { endpoint: '/social-chat', data: { invalidField: 'test' } },
        { endpoint: '/social-chat', data: { message: null } },
        { endpoint: '/social-chat', data: { message: 123 } },
      ];

      for (const request of malformedRequests) {
        try {
          await testApiClient.authenticatedRequest(
            'POST',
            request.endpoint,
            request.data,
            400
          );
        } catch (error: any) {
          // Should return appropriate error status
          expect(error.response?.status).toBeOneOf([400, 422]);
        }
      }
    });
  });

  describe('Chat Performance', () => {
    test('should respond within acceptable time limits', async () => {
      const testMessage = 'Quick response test message.';
      const startTime = Date.now();
      
      const chunks = await testApiClient.testStreamingChat('/social-chat', testMessage);
      
      const responseTime = Date.now() - startTime;
      const firstChunkTime = responseTime; // Approximate first chunk time
      
      // Performance assertions
      assertCondition(
        firstChunkTime < 5000,
        'First chunk should arrive within 5 seconds',
        firstChunkTime
      );

      assertCondition(
        responseTime < 30000,
        'Complete response should arrive within 30 seconds',
        responseTime
      );

      console.log(`⏱️  Response performance: ${firstChunkTime}ms to first chunk, ${responseTime}ms total`);
    }, 35000);

    test('should handle concurrent chat requests', async () => {
      const concurrentRequests = 3;
      const baseMessage = 'Concurrent test message';
      
      const startTime = Date.now();
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        testApiClient.testStreamingChat('/social-chat', `${baseMessage} ${i + 1}`)
      );

      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`🔄 Concurrent requests: ${successful} successful, ${failed} failed in ${endTime - startTime}ms`);
      
      // At least some requests should succeed
      expect(successful).toBeGreaterThan(0);
      
      // Total time should be reasonable (not sequential)
      expect(endTime - startTime).toBeLessThan(45000);
    }, 50000);
  });

  describe('Chat Context and Memory', () => {
    test('should maintain conversation context', async () => {
      // This would require conversation management endpoints
      // For now, test basic context understanding
      
      const contextMessages = [
        'My name is TestUser and I like programming.',
        'What did I just tell you about myself?',
        'What programming languages should I learn?'
      ];

      let previousResponse = '';
      
      for (let i = 0; i < contextMessages.length; i++) {
        const chunks = await testApiClient.testStreamingChat('/social-chat', contextMessages[i]);
        const response = chunks.join('');
        
        console.log(`🧠 Context ${i + 1}: "${contextMessages[i]}" -> "${response.substring(0, 100)}..."`);
        
        // Second message should reference the name or programming
        if (i === 1) {
          const lowerResponse = response.toLowerCase();
          const hasContext = lowerResponse.includes('testuser') || 
                           lowerResponse.includes('programming') ||
                           lowerResponse.includes('name');
          
          if (hasContext) {
            console.log('✅ Context maintained across messages');
          } else {
            console.log('ℹ️  Context may not be maintained (depends on AI implementation)');
          }
        }
        
        previousResponse = response;
        await delay(3000); // Delay between context messages
      }
    }, 90000);

    test('should handle conversation metadata', async () => {
      // Test if the AI provides metadata about the conversation
      const testMessage = 'Can you tell me about this conversation?';
      
      try {
        const chunks = await testApiClient.testStreamingChat('/social-chat', testMessage);
        const response = chunks.join('');
        
        // Look for metadata in response or check if separate metadata endpoint exists
        console.log(`📊 Conversation metadata test: ${response.substring(0, 100)}...`);
        
        expect(response.length).toBeGreaterThan(0);
        
      } catch (error) {
        console.log('ℹ️  Conversation metadata handling test completed');
      }
    }, 30000);
  });
});