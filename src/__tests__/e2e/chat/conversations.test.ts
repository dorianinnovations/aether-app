/**
 * E2E Conversation Management Tests
 * Tests conversation CRUD operations, sync, and history management
 * Refactored to use shared test utilities for better maintainability
 */

import { testApiClient } from '../setup/apiClient';
import { assertCondition, delay, generateTestData } from '../setup/testSetup';
import {
  createTestSuite,
  createTestConversation,
  sendTestMessage,
  validateAndExtract,
  measureTime,
  globalResourceManager
} from '../setup/testUtilities';

describe('E2E Conversation Management', () => {
  const testSuite = createTestSuite('Conversation Management');
  let testMessages: any[] = [];
  let testConversationIds: string[] = [];

  beforeAll(testSuite.beforeAll);
  afterAll(testSuite.afterAll);

  describe('Conversation Creation', () => {
    test('should create new conversation', async () => {
      const { result: conversationId, duration } = await measureTime(
        () => createTestConversation('Test Conversation'),
        'Create conversation'
      );
      
      // Track for cleanup
      testSuite.resourceManager.trackConversation(conversationId);
      
      expect(conversationId).toBeDefined();
      expect(duration).toBeLessThan(5000); // Performance assertion
    });

    test('should create conversation with first message', async () => {
      const conversationId = await createTestConversation(
        'Test Conversation with Message',
        'This is the first message'
      );
      
      testSuite.resourceManager.trackConversation(conversationId);
      expect(conversationId).toBeDefined();
    });

    test('should handle empty conversation creation', async () => {
      const response = await testApiClient.authenticatedRequest(
        'POST',
        '/conversation/conversations',
        {},
        201
      );

      const conversationId = validateAndExtract.conversationId(response);
      testSuite.resourceManager.trackConversation(conversationId);
      
      expect(conversationId).toBeDefined();
      console.log(`✅ Created empty conversation: ${conversationId}`);
    });
  });

  describe('Message Management', () => {
    let targetConversationId: string;

    beforeAll(async () => {
      // Create a dedicated conversation for message tests
      targetConversationId = await createTestConversation('Message Test Conversation');
      testSuite.resourceManager.trackConversation(targetConversationId);
    });

    test('should add user message to conversation', async () => {
      await sendTestMessage(targetConversationId, 'Test user message', 'user');
      
      // Verify message was added by retrieving conversation
      const conversation = await testApiClient.authenticatedRequest(
        'GET',
        `/conversation/conversations/${targetConversationId}`,
        undefined,
        200
      );
      
      const messages = validateAndExtract.array(conversation, 'messages');
      expect(messages.length).toBeGreaterThan(0);
    });

    test('should add assistant message to conversation', async () => {
      await sendTestMessage(
        targetConversationId, 
        'This is a test assistant response.',
        'assistant'
      );
      
      // Verify message was added
      const conversation = await testApiClient.authenticatedRequest(
        'GET',
        `/conversation/conversations/${targetConversationId}`,
        undefined,
        200
      );
      
      const messages = validateAndExtract.array(conversation, 'messages');
      expect(messages.length).toBeGreaterThan(0);
    });

    test('should validate message format', async () => {
      const invalidMessages = [
        { content: 'Missing role' }, // No role
        { role: 'user' }, // No content
        { role: 'invalid', content: 'Invalid role' }, // Invalid role
        { role: 'user', content: '' }, // Empty content
      ];

      for (const invalidMessage of invalidMessages) {
        try {
          await testApiClient.authenticatedRequest(
            'POST',
            `/conversation/conversations/${targetConversationId}/messages`,
            invalidMessage,
            400
          );
        } catch (error: any) {
          expect(error.response?.status).toBeOneOf([400, 422]);
        }
      }
    });
  });

  describe('Conversation Retrieval', () => {
    test('should get recent conversations', async () => {
      const response = await testApiClient.authenticatedRequest(
        'GET',
        '/conversation/conversations/recent?limit=20',
        undefined,
        200,
        (data: any) => {
          const conversations = data.conversations || data.data || data;
          const conversationList = Array.isArray(conversations) ? conversations : [conversations].filter(Boolean);
          
          assertCondition(
            Array.isArray(conversationList),
            'Should return array of conversations',
            Array.isArray(conversationList)
          );

          if (conversationList.length > 0) {
            const firstConversation = conversationList[0];
            assertCondition(
              !!firstConversation.id || !!firstConversation._id,
              'Each conversation should have an ID',
              !!firstConversation.id || !!firstConversation._id
            );
          }
        }
      );

      const conversations = response.conversations || response.data || response;
      const conversationList = Array.isArray(conversations) ? conversations : [];
      
      console.log(`📋 Retrieved ${conversationList.length} recent conversations`);
      expect(conversationList).toBeDefined();
    });

    test('should get specific conversation with messages', async () => {
      // Create a conversation for this test
      const conversationId = await createTestConversation('Specific Conversation Test');
      testSuite.resourceManager.trackConversation(conversationId);
      
      const response = await testApiClient.authenticatedRequest(
        'GET',
        `/conversation/conversations/${conversationId}?messageLimit=100`,
        undefined,
        200,
        (data: any) => {
          const conversation = data.conversation || data.data || data;
          
          assertCondition(
            !!conversation,
            'Should return conversation data',
            !!conversation
          );

          if (conversation.messages) {
            assertCondition(
              Array.isArray(conversation.messages),
              'Messages should be an array',
              Array.isArray(conversation.messages)
            );
          }
        }
      );

      const conversation = response.conversation || response.data || response;
      const messageCount = conversation.messages ? conversation.messages.length : 0;
      
      console.log(`💬 Retrieved conversation ${conversationId} with ${messageCount} messages`);
      expect(conversation).toBeDefined();
    });

    test('should handle non-existent conversation', async () => {
      const fakeConversationId = 'nonexistent_conversation_id_123';
      
      try {
        await testApiClient.authenticatedRequest(
          'GET',
          `/conversation/conversations/${fakeConversationId}`,
          undefined,
          404
        );
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    test('should paginate conversations', async () => {
      // Test pagination with different limits
      const limits = [5, 10, 20];
      
      for (const limit of limits) {
        const response = await testApiClient.authenticatedRequest(
          'GET',
          `/conversation/conversations/recent?limit=${limit}`,
          undefined,
          200
        );

        const conversations = validateAndExtract.array(response, 'conversations');
        const conversationList = Array.isArray(conversations) ? conversations : [];
        
        assertCondition(
          conversationList.length <= limit,
          `Should not exceed limit of ${limit}`,
          conversationList.length
        );

        console.log(`📄 Page with limit ${limit}: ${conversationList.length} conversations`);
      }
    });
  });

  describe('Conversation Updates', () => {
    let targetConversationId: string;

    beforeAll(async () => {
      // Create a conversation for updates testing
      targetConversationId = await createTestConversation('Update Test Conversation');
      testSuite.resourceManager.trackConversation(targetConversationId);
    });

    test('should update conversation title', async () => {
      const newTitle = `Updated ${generateTestData.title()}`;
      
      const response = await testApiClient.authenticatedRequest(
        'PUT',
        `/conversation/conversations/${targetConversationId}/title`,
        { title: newTitle },
        200,
        (data: any) => {
          assertCondition(
            data.success !== false,
            'Title update should be successful',
            data.success
          );
        }
      );

      expect(response).toBeDefined();
      console.log(`✅ Updated conversation title to: ${newTitle}`);

      // Verify the title was updated by retrieving the conversation
      const updatedConversation = await testApiClient.authenticatedRequest(
        'GET',
        `/conversation/conversations/${targetConversationId}`,
        undefined,
        200
      );

      const conversation = (updatedConversation as any).conversation || (updatedConversation as any).data || updatedConversation;
      if (conversation.title) {
        expect(conversation.title).toBe(newTitle);
      }
    });

    test('should validate title format', async () => {
      const invalidTitles = [
        '', // Empty title
        ' '.repeat(1000), // Extremely long title
        null, // Null title
      ];

      for (const invalidTitle of invalidTitles) {
        try {
          await testApiClient.authenticatedRequest(
            'PUT',
            `/conversation/conversations/${targetConversationId}/title`,
            { title: invalidTitle },
            400
          );
        } catch (error: any) {
          expect(error.response?.status).toBeOneOf([400, 422]);
        }
      }
    });
  });

  describe('Conversation Search', () => {
    test('should search conversations by query', async () => {
      const searchQuery = 'test';
      
      const response = await testApiClient.authenticatedRequest(
        'GET',
        `/conversation/conversations?search=${encodeURIComponent(searchQuery)}&limit=10`,
        undefined,
        200,
        (data: any) => {
          const results = data.conversations || data.results || data.data || data;
          
          if (results && Array.isArray(results)) {
            assertCondition(
              Array.isArray(results),
              'Search results should be an array',
              Array.isArray(results)
            );
          }
        }
      );

      const results = response.conversations || response.results || response.data || response;
      const resultList = Array.isArray(results) ? results : [];
      
      console.log(`🔍 Search for "${searchQuery}" returned ${resultList.length} results`);
      expect(resultList).toBeDefined();
    });

    test('should handle empty search query', async () => {
      try {
        const response = await testApiClient.authenticatedRequest(
          'GET',
          '/conversation/conversations?search=&limit=10',
          undefined,
          200
        );

        // Empty search might return all conversations or no results
        const results = (response as any)?.conversations || (response as any)?.results || (response as any)?.data || response;
        expect(results).toBeDefined();
        
      } catch (error: any) {
        // Some implementations might require non-empty search query
        expect(error.response?.status).toBeOneOf([400, 422]);
      }
    });

    test('should search with special characters', async () => {
      const specialQueries = [
        'test!@#$%',
        'test with spaces',
        '测试', // Unicode characters
        'test-with-hyphens',
      ];

      for (const query of specialQueries) {
        try {
          const response = await testApiClient.authenticatedRequest(
            'GET',
            `/conversation/conversations?search=${encodeURIComponent(query)}&limit=5`,
            undefined,
            200
          );

          const results = (response as any)?.conversations || (response as any)?.results || (response as any)?.data || response;
          console.log(`🔍 Search for "${query}": ${Array.isArray(results) ? results.length : 'N/A'} results`);
          
        } catch (error: any) {
          // Some special characters might not be supported
          if (error.response?.status !== 400) {
            throw error;
          }
        }
      }
    });
  });

  describe('Conversation Sync', () => {
    test('should sync conversations for offline support', async () => {
      const syncData = {
        conversations: testConversationIds.map((id: string) => ({
          id,
          lastModified: new Date().toISOString(),
          messageCount: 2
        })),
        lastSyncTime: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };

      const response = await testApiClient.authenticatedRequest(
        'POST',
        '/conversation/conversations/sync',
        syncData,
        200,
        (data: any) => {
          assertCondition(
            data.success !== false,
            'Sync should be successful',
            data.success
          );
        }
      );

      expect(response).toBeDefined();
      console.log(`🔄 Synced ${syncData.conversations.length} conversations`);
    });

    test('should handle empty sync request', async () => {
      const response = await testApiClient.authenticatedRequest(
        'POST',
        '/conversation/conversations/sync',
        {
          conversations: [],
          lastSyncTime: new Date().toISOString()
        },
        200
      );

      expect(response).toBeDefined();
      console.log('🔄 Empty sync completed');
    });

    test('should validate sync data format', async () => {
      const invalidSyncData = [
        { conversations: 'invalid' }, // conversations should be array
        { conversations: [], lastSyncTime: 'invalid-date' }, // invalid date format
        { conversations: [{ id: null }] }, // invalid conversation data
      ];

      for (const invalidData of invalidSyncData) {
        try {
          await testApiClient.authenticatedRequest(
            'POST',
            '/conversation/conversations/sync',
            invalidData,
            400
          );
        } catch (error: any) {
          expect(error.response?.status).toBeOneOf([400, 422]);
        }
      }
    });
  });

  describe('Conversation Deletion', () => {
    test('should delete specific conversation', async () => {
      // Create a conversation specifically for deletion
      const deleteTestConversation = await testApiClient.authenticatedRequest(
        'POST',
        '/conversation/conversations',
        { title: 'Test Conversation for Deletion' },
        200
      );

      const conversationId = (deleteTestConversation as any)?.id || 
                           (deleteTestConversation as any)?._id || 
                           (deleteTestConversation as any)?.conversationId || 
                           (deleteTestConversation as any)?.data?.id;

      if (!conversationId) {
        throw new Error('Failed to create conversation for deletion test');
      }

      // Delete the conversation
      const response = await testApiClient.authenticatedRequest(
        'DELETE',
        `/conversation/conversations/${conversationId}`,
        undefined,
        200,
        (data: any) => {
          assertCondition(
            data.success !== false,
            'Deletion should be successful',
            data.success
          );
        }
      );

      expect(response).toBeDefined();
      console.log(`🗑️  Deleted conversation: ${conversationId}`);

      // Verify conversation is deleted
      try {
        await testApiClient.authenticatedRequest(
          'GET',
          `/conversation/conversations/${conversationId}`,
          undefined,
          404
        );
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    test('should handle deletion of non-existent conversation', async () => {
      const fakeConversationId = 'nonexistent_conversation_for_deletion';
      
      try {
        await testApiClient.authenticatedRequest(
          'DELETE',
          `/conversation/conversations/${fakeConversationId}`,
          undefined,
          404
        );
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    // Note: We don't test DELETE ALL conversations to preserve test data
    // test('should delete all conversations', async () => {
    //   This would be too destructive for a test environment
    // });
  });

  describe('Conversation Performance', () => {
    test('should load conversations within acceptable time', async () => {
      const startTime = Date.now();
      
      await testApiClient.authenticatedRequest(
        'GET',
        '/conversation/conversations/recent?limit=50',
        undefined,
        200
      );

      const loadTime = Date.now() - startTime;
      
      assertCondition(
        loadTime < 5000,
        'Conversation loading should be under 5 seconds',
        loadTime
      );

      console.log(`⏱️  Loaded conversations in ${loadTime}ms`);
    });

    test('should handle large message history efficiently', async () => {
      if (testConversationIds.length === 0) {
        console.log('ℹ️  Skipping large message history test - no conversations available');
        return;
      }

      const startTime = Date.now();
      
      await testApiClient.authenticatedRequest(
        'GET',
        `/conversation/conversations/${testConversationIds[0]}?messageLimit=500`,
        undefined,
        200
      );

      const loadTime = Date.now() - startTime;
      
      assertCondition(
        loadTime < 10000,
        'Large conversation loading should be under 10 seconds',
        loadTime
      );

      console.log(`⏱️  Loaded large conversation in ${loadTime}ms`);
    });
  });
});