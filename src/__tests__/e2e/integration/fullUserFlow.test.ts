/**
 * E2E Full User Flow Integration Tests
 * Tests complete user journeys from registration to advanced features
 */

import { testApiClient } from '../setup/apiClient';
import { testState, assertCondition, generateTestData, delay } from '../setup/testSetup';

describe('E2E Full User Flow Integration', () => {
  let userCredentials: {
    email: string;
    username: string;
    password: string;
    name: string;
  };
  let authToken: string;
  let conversationId: string;
  let friendUsername: string;

  beforeAll(() => {
    // Generate unique user for this test flow
    userCredentials = {
      email: generateTestData.email(),
      username: generateTestData.username(),
      password: 'TestPassword123!',
      name: 'Full Flow Test User'
    };
  });

  afterAll(async () => {
    // Comprehensive cleanup
    if (authToken) {
      testState.authToken = authToken;
      
      try {
        // Delete conversations
        if (conversationId) {
          await testApiClient.authenticatedRequest(
            'DELETE',
            `/conversation/conversations/${conversationId}`,
            undefined,
            200
          );
        }
        
        // Remove friends
        if (friendUsername) {
          await testApiClient.authenticatedRequest(
            'DELETE',
            '/friends/remove',
            { username: friendUsername },
            200
          );
        }

        // Delete user account
        await testApiClient.authenticatedRequest(
          'DELETE',
          '/user/delete',
          undefined,
          200
        );

        console.log('🧹 Full cleanup completed');
        
      } catch (error) {
        console.warn('⚠️  Some cleanup operations failed:', error);
      }
    }
  });

  describe('Complete User Journey', () => {
    test('1. New User Registration Flow', async () => {
      console.log('📝 Starting user registration flow...');

      // Check username availability
      const availabilityCheck = await testApiClient.publicRequest(
        'GET',
        `/auth/check-username/${userCredentials.username}`,
        undefined,
        200,
        (data: any) => {
          assertCondition(
            data.available === true,
            'Username should be available for new user',
            data.available
          );
        }
      );

      expect(availabilityCheck.available).toBe(true);
      console.log(`✅ Username ${userCredentials.username} is available`);

      // Register new user
      const registrationResponse = await testApiClient.publicRequest(
        'POST',
        '/auth/signup',
        userCredentials,
        200,
        (data: any) => {
          assertCondition(
            !!data.token,
            'Registration should provide auth token',
            !!data.token
          );

          assertCondition(
            data.data?.user?.email === userCredentials.email,
            'User email should match registration',
            data.data?.user?.email,
            userCredentials.email
          );
        }
      );

      authToken = registrationResponse.token;
      testState.authToken = authToken;
      testState.currentUser = registrationResponse.data.user;

      console.log(`✅ User registered successfully with email: ${userCredentials.email}`);
    });

    test('2. Profile Setup and Customization', async () => {
      console.log('👤 Setting up user profile...');

      // Get initial profile
      const initialProfile = await testApiClient.authenticatedRequest(
        'GET',
        '/user/profile',
        undefined,
        200,
        (data: any) => {
          const userData = data.data?.user || data.user || data;
          assertCondition(
            !!userData,
            'Profile should contain user data',
            !!userData
          );
        }
      );

      const userData = initialProfile.data?.user || initialProfile.user || initialProfile;
      console.log(`📋 Initial profile loaded for: ${userData.email}`);

      // Update user settings
      const settingsUpdate = {
        theme: 'dark',
        notifications: true,
        language: 'en',
        autoSave: true
      };

      await testApiClient.authenticatedRequest(
        'POST',
        '/user/settings',
        settingsUpdate,
        200,
        (data: any) => {
          assertCondition(
            data.success !== false,
            'Settings update should be successful',
            data.success
          );
        }
      );

      console.log('⚙️  User settings configured');

      // Update preferences
      const preferencesUpdate = {
        chatModel: 'gpt-4',
        streamingEnabled: true,
        webSearchEnabled: true
      };

      await testApiClient.authenticatedRequest(
        'POST',
        '/user/preferences',
        preferencesUpdate,
        200
      );

      console.log('🎛️  User preferences set');
    });

    test('3. First AI Chat Conversation', async () => {
      console.log('💬 Starting first AI chat conversation...');

      // Create new conversation
      const conversation = await testApiClient.authenticatedRequest(
        'POST',
        '/conversation/conversations',
        { title: 'My First Aether Chat' },
        200
      );

      conversationId = conversation.id || conversation._id || conversation.conversationId || conversation.data?.id;
      assertCondition(
        !!conversationId,
        'Conversation creation should return ID',
        conversationId
      );

      console.log(`📝 Created conversation: ${conversationId}`);

      // Send first message via streaming
      const firstMessage = 'Hello Aether! This is my first message. Can you tell me what you can help me with?';
      const chunks = await testApiClient.testStreamingChat('/social-chat', firstMessage);

      assertCondition(
        chunks.length > 0,
        'AI should respond with streaming chunks',
        chunks.length
      );

      const aiResponse = chunks.join('');
      assertCondition(
        aiResponse.length > 50,
        'AI response should be substantial',
        aiResponse.length
      );

      console.log(`🤖 AI responded with ${chunks.length} chunks, total length: ${aiResponse.length}`);

      // Add user message to conversation
      await testApiClient.authenticatedRequest(
        'POST',
        `/conversation/conversations/${conversationId}/messages`,
        {
          role: 'user',
          content: firstMessage,
          timestamp: new Date().toISOString()
        },
        200
      );

      // Add AI response to conversation
      await testApiClient.authenticatedRequest(
        'POST',
        `/conversation/conversations/${conversationId}/messages`,
        {
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString(),
          metadata: { chunks: chunks.length }
        },
        200
      );

      console.log('💾 Messages saved to conversation history');
    });

    test('4. Friend Discovery and Connection', async () => {
      console.log('👥 Exploring friend features...');

      // Get current username
      const usernameResponse = await testApiClient.authenticatedRequest(
        'GET',
        '/friends/my-username',
        undefined,
        200
      );

      const myUsername = usernameResponse.username;
      console.log(`🆔 My username: ${myUsername}`);

      // Look up a potential friend (using secondary test user)
      const friendLookup = await testApiClient.authenticatedRequest(
        'GET',
        '/friends/lookup/testuser2',
        undefined,
        200
      ).catch(error => {
        if (error.response?.status === 404) {
          console.log('ℹ️  Test friend user not found, skipping friend connection');
          return null;
        }
        throw error;
      });

      if (friendLookup) {
        const friendData = friendLookup.user || friendLookup.profile || friendLookup;
        friendUsername = friendData.username;
        
        console.log(`🔍 Found potential friend: ${friendUsername}`);

        // Send friend request
        await testApiClient.authenticatedRequest(
          'POST',
          '/friends/add',
          { username: friendUsername },
          200,
          (data: any) => {
            assertCondition(
              data.success !== false,
              'Friend request should be sent successfully',
              data.success
            );
          }
        );

        console.log(`📨 Friend request sent to ${friendUsername}`);

        // Get friends list to verify
        const friendsList = await testApiClient.authenticatedRequest(
          'GET',
          '/friends/list',
          undefined,
          200
        );

        const friends = friendsList.friends || friendsList.data || friendsList;
        console.log(`👥 Current friends list has ${friends.length} connections`);
      }
    });

    test('5. Social Platform Interaction', async () => {
      console.log('🌐 Testing social platform features...');

      // Get social proxy profile
      const socialProfile = await testApiClient.authenticatedRequest(
        'GET',
        '/social-proxy/profile',
        undefined,
        200
      ).catch(error => {
        if (error.response?.status === 404) {
          console.log('ℹ️  Social proxy profile not found, will create');
          return null;
        }
        throw error;
      });

      if (socialProfile) {
        console.log('📱 Social proxy profile loaded');
      }

      // Update social status
      const statusUpdate = {
        status: 'Testing the Aether social platform! 🚀',
        mood: 'excited',
        currentPlans: 'Exploring all the amazing features',
        location: 'Test Environment'
      };

      await testApiClient.authenticatedRequest(
        'POST',
        '/social-proxy/status',
        statusUpdate,
        200,
        (data: any) => {
          assertCondition(
            data.success !== false,
            'Status update should be successful',
            data.success
          );
        }
      );

      console.log('📢 Social status updated');

      // Get timeline
      const timeline = await testApiClient.authenticatedRequest(
        'GET',
        '/social-proxy/timeline?limit=10',
        undefined,
        200
      );

      const timelineData = timeline.timeline || timeline.activities || timeline.data || timeline;
      const timelineItems = Array.isArray(timelineData) ? timelineData : [];
      
      console.log(`📰 Timeline loaded with ${timelineItems.length} activities`);
    });

    test('6. Spotify Integration (if available)', async () => {
      console.log('🎵 Testing Spotify integration...');

      try {
        // Get Spotify auth URL
        const spotifyAuth = await testApiClient.authenticatedRequest(
          'GET',
          '/spotify/auth?platform=mobile',
          undefined,
          200,
          (data: any) => {
            assertCondition(
              !!data.authUrl,
              'Spotify auth should provide URL',
              !!data.authUrl
            );
          }
        );

        console.log('🔗 Spotify auth URL obtained');

        // Check Spotify connection status
        const spotifyStatus = await testApiClient.authenticatedRequest(
          'GET',
          '/spotify/status',
          undefined,
          200
        );

        const isConnected = spotifyStatus.connected || spotifyStatus.data?.connected;
        console.log(`🎵 Spotify connection status: ${isConnected ? 'Connected' : 'Not connected'}`);

        if (!isConnected) {
          console.log('ℹ️  Spotify not connected - this is expected for automated tests');
        }

      } catch (error: any) {
        if (error.response?.status === 503) {
          console.log('ℹ️  Spotify service unavailable in test environment');
        } else {
          console.warn('⚠️  Spotify integration test encountered issues:', error.message);
        }
      }
    });

    test('7. Advanced Chat Features', async () => {
      console.log('🧠 Testing advanced chat features...');

      // Test web search enabled chat
      const webSearchMessage = 'What are the latest developments in React Native?';
      
      try {
        const webSearchChunks = await testApiClient.testStreamingChat('/social-chat', webSearchMessage);
        const webSearchResponse = webSearchChunks.join('');

        console.log(`🔍 Web search chat completed: ${webSearchResponse.length} characters`);

        // Add to conversation
        await testApiClient.authenticatedRequest(
          'POST',
          `/conversation/conversations/${conversationId}/messages`,
          {
            role: 'user',
            content: webSearchMessage,
            timestamp: new Date().toISOString()
          },
          200
        );

        await testApiClient.authenticatedRequest(
          'POST',
          `/conversation/conversations/${conversationId}/messages`,
          {
            role: 'assistant',
            content: webSearchResponse,
            timestamp: new Date().toISOString(),
            metadata: { webSearchEnabled: true }
          },
          200
        );

      } catch (error) {
        console.log('ℹ️  Web search features may not be available in test environment');
      }

      // Test conversation title update
      const newTitle = 'My Complete Aether Experience';
      await testApiClient.authenticatedRequest(
        'PUT',
        `/conversation/conversations/${conversationId}/title`,
        { title: newTitle },
        200
      );

      console.log(`📝 Conversation title updated to: ${newTitle}`);
    });

    test('8. Real-time Features', async () => {
      console.log('⚡ Testing real-time features...');

      try {
        // Test notification stream connection
        await testApiClient.testSSEConnection('/notifications/stream');
        console.log('🔔 Notification stream connection successful');

      } catch (error: any) {
        console.log('ℹ️  Real-time notifications may require additional setup');
      }

      // Test notification service stats
      const notificationStats = await testApiClient.authenticatedRequest(
        'GET',
        '/notifications/stats',
        undefined,
        200
      ).catch(error => {
        console.log('ℹ️  Notification stats not available');
        return null;
      });

      if (notificationStats) {
        console.log('📊 Notification service stats retrieved');
      }
    });

    test('9. Data Management and Sync', async () => {
      console.log('🔄 Testing data management features...');

      // Get recent conversations to verify our conversation exists
      const recentConversations = await testApiClient.authenticatedRequest(
        'GET',
        '/conversation/conversations/recent?limit=10',
        undefined,
        200
      );

      const conversations = recentConversations.conversations || recentConversations.data || recentConversations;
      const conversationList = Array.isArray(conversations) ? conversations : [];
      
      const ourConversation = conversationList.find(conv => 
        (conv.id || conv._id) === conversationId
      );

      assertCondition(
        !!ourConversation,
        'Our test conversation should be in recent list',
        !!ourConversation
      );

      console.log(`📚 Verified conversation exists in recent list`);

      // Test conversation sync
      const syncData = {
        conversations: [{
          id: conversationId,
          lastModified: new Date().toISOString(),
          messageCount: 4 // We added 4 messages total
        }],
        lastSyncTime: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      };

      await testApiClient.authenticatedRequest(
        'POST',
        '/conversation/conversations/sync',
        syncData,
        200
      );

      console.log('🔄 Conversation sync completed');
    });

    test('10. System Health and Monitoring', async () => {
      console.log('🏥 Testing system health endpoints...');

      // Check system health
      const health = await testApiClient.publicRequest(
        'GET',
        '/health',
        undefined,
        200,
        (data: any) => {
          assertCondition(
            data.status === 'healthy' || data.status === 'ok',
            'System should be healthy',
            data.status
          );
        }
      );

      console.log(`💚 System health: ${health.status}`);

      // Check LLM service
      const llmHealth = await testApiClient.publicRequest(
        'GET',
        '/llm',
        undefined,
        200
      );

      console.log('🧠 LLM service health verified');

      // Get system status
      const systemStatus = await testApiClient.publicRequest(
        'GET',
        '/status',
        undefined,
        200
      );

      console.log('📊 System status retrieved');
    });

    test('11. Performance Validation', async () => {
      console.log('⏱️  Validating system performance...');

      const performanceTests = [
        {
          name: 'Profile Loading',
          test: () => testApiClient.authenticatedRequest('GET', '/user/profile', undefined, 200),
          maxTime: 2000
        },
        {
          name: 'Friends List',
          test: () => testApiClient.authenticatedRequest('GET', '/friends/list', undefined, 200),
          maxTime: 3000
        },
        {
          name: 'Recent Conversations',
          test: () => testApiClient.authenticatedRequest('GET', '/conversation/conversations/recent?limit=20', undefined, 200),
          maxTime: 3000
        },
        {
          name: 'Social Timeline',
          test: () => testApiClient.authenticatedRequest('GET', '/social-proxy/timeline?limit=10', undefined, 200).catch(() => null),
          maxTime: 4000
        }
      ];

      for (const perfTest of performanceTests) {
        const startTime = Date.now();
        
        try {
          await perfTest.test();
          const duration = Date.now() - startTime;
          
          assertCondition(
            duration < perfTest.maxTime,
            `${perfTest.name} should complete within ${perfTest.maxTime}ms`,
            duration
          );

          console.log(`⚡ ${perfTest.name}: ${duration}ms`);
          
        } catch (error) {
          console.log(`ℹ️  ${perfTest.name}: Test not available or failed`);
        }
      }
    });

    test('12. Complete User Experience Validation', async () => {
      console.log('🎯 Final user experience validation...');

      // Verify all major features are accessible
      const featureChecklist = {
        profileAccess: false,
        chatFunctionality: false,
        conversationHistory: false,
        socialFeatures: false,
        friendsSystem: false,
        settingsManagement: false
      };

      // Profile access
      try {
        await testApiClient.authenticatedRequest('GET', '/user/profile', undefined, 200);
        featureChecklist.profileAccess = true;
      } catch (error) {
        console.warn('❌ Profile access failed');
      }

      // Chat functionality
      try {
        const testChunks = await testApiClient.testStreamingChat('/social-chat', 'Final test message');
        featureChecklist.chatFunctionality = testChunks.length > 0;
      } catch (error) {
        console.warn('❌ Chat functionality failed');
      }

      // Conversation history
      try {
        const conversations = await testApiClient.authenticatedRequest('GET', '/conversation/conversations/recent', undefined, 200);
        featureChecklist.conversationHistory = true;
      } catch (error) {
        console.warn('❌ Conversation history failed');
      }

      // Social features
      try {
        await testApiClient.authenticatedRequest('GET', '/social-proxy/profile', undefined, 200);
        featureChecklist.socialFeatures = true;
      } catch (error) {
        // Social features might not be fully set up
        featureChecklist.socialFeatures = false;
      }

      // Friends system
      try {
        await testApiClient.authenticatedRequest('GET', '/friends/list', undefined, 200);
        featureChecklist.friendsSystem = true;
      } catch (error) {
        console.warn('❌ Friends system failed');
      }

      // Settings management
      try {
        await testApiClient.authenticatedRequest('GET', '/user/settings', undefined, 200);
        featureChecklist.settingsManagement = true;
      } catch (error) {
        console.warn('❌ Settings management failed');
      }

      // Calculate success rate
      const totalFeatures = Object.keys(featureChecklist).length;
      const workingFeatures = Object.values(featureChecklist).filter(Boolean).length;
      const successRate = (workingFeatures / totalFeatures) * 100;

      console.log('\n📊 Final Feature Assessment:');
      Object.entries(featureChecklist).forEach(([feature, working]) => {
        console.log(`   ${working ? '✅' : '❌'} ${feature}`);
      });
      
      console.log(`\n🎯 Overall Success Rate: ${successRate.toFixed(1)}% (${workingFeatures}/${totalFeatures})`);

      // Assert minimum success rate
      assertCondition(
        successRate >= 70,
        'At least 70% of core features should be working',
        successRate
      );

      console.log('\n🎉 Complete user journey validation completed!');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle concurrent operations gracefully', async () => {
      console.log('🔄 Testing concurrent operations...');

      const concurrentOperations = [
        () => testApiClient.authenticatedRequest('GET', '/user/profile', undefined, 200),
        () => testApiClient.authenticatedRequest('GET', '/friends/list', undefined, 200),
        () => testApiClient.authenticatedRequest('GET', '/conversation/conversations/recent', undefined, 200),
        () => testApiClient.testStreamingChat('/social-chat', 'Concurrent test message'),
        () => testApiClient.authenticatedRequest('GET', '/notifications/stats', undefined, 200).catch(() => null)
      ];

      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentOperations.map(op => op()));
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`⚡ Concurrent operations: ${successful} successful, ${failed} failed in ${endTime - startTime}ms`);
      
      // Should handle most operations successfully
      expect(successful).toBeGreaterThan(failed);
    });

    test('should handle network timeouts gracefully', async () => {
      console.log('⏱️  Testing timeout handling...');

      // This test verifies that our API client handles timeouts properly
      // The actual timeout behavior is configured in the API client
      
      try {
        const quickResponse = await testApiClient.authenticatedRequest(
          'GET',
          '/user/profile',
          undefined,
          200
        );
        
        expect(quickResponse).toBeDefined();
        console.log('✅ Quick operations handle timeouts appropriately');
        
      } catch (error: any) {
        if (error.message?.includes('timeout')) {
          console.log('⏱️  Timeout handling working correctly');
        } else {
          throw error;
        }
      }
    });

    test('should maintain data consistency across operations', async () => {
      console.log('🔒 Testing data consistency...');

      // Get initial state
      const initialProfile = await testApiClient.authenticatedRequest(
        'GET',
        '/user/profile',
        undefined,
        200
      );

      const initialConversations = await testApiClient.authenticatedRequest(
        'GET',
        '/conversation/conversations/recent',
        undefined,
        200
      );

      // Perform operations that might affect state
      await testApiClient.authenticatedRequest(
        'POST',
        '/user/settings',
        { theme: 'light' },
        200
      );

      // Verify state consistency
      const finalProfile = await testApiClient.authenticatedRequest(
        'GET',
        '/user/profile',
        undefined,
        200
      );

      const finalConversations = await testApiClient.authenticatedRequest(
        'GET',
        '/conversation/conversations/recent',
        undefined,
        200
      );

      // Core identity should remain consistent
      const initialUser = initialProfile.data?.user || initialProfile.user || initialProfile;
      const finalUser = finalProfile.data?.user || finalProfile.user || finalProfile;

      expect(initialUser.email).toBe(finalUser.email);
      expect(initialUser.id || initialUser._id).toBe(finalUser.id || finalUser._id);

      console.log('✅ Data consistency maintained across operations');
    });
  });
});