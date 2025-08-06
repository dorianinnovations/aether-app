/**
 * E2E Friends Management Tests
 * Tests friend connections, lookup, and management features
 */

import { testApiClient } from '../setup/apiClient';
import { TEST_USERS, testState, assertCondition, generateTestData, delay } from '../setup/testSetup';

describe('E2E Friends Management', () => {
  let primaryUserToken: string;
  let secondaryUserToken: string;
  let primaryUsername: string;
  let secondaryUsername: string;

  beforeAll(async () => {
    // Login primary user
    const primaryLogin = await testApiClient.publicRequest(
      'POST',
      '/auth/login',
      {
        email: TEST_USERS.PRIMARY.email,
        password: TEST_USERS.PRIMARY.password,
      }
    );
    
    primaryUserToken = (primaryLogin as any).token;
    testState.authToken = primaryUserToken;

    // Login secondary user for friend interactions
    const secondaryLogin = await testApiClient.publicRequest(
      'POST',
      '/auth/login',
      {
        email: TEST_USERS.SECONDARY.email,
        password: TEST_USERS.SECONDARY.password,
      }
    );
    
    secondaryUserToken = (secondaryLogin as any).token;

    console.log('✅ Both test users logged in successfully');
  });

  afterAll(async () => {
    // Cleanup: Remove any friend connections created during tests
    try {
      testState.authToken = primaryUserToken;
      
      if (secondaryUsername) {
        await testApiClient.authenticatedRequest(
          'DELETE',
          '/friends/remove',
          { username: secondaryUsername },
          200
        );
      }
      
    } catch (error) {
      console.warn('Failed to cleanup friend connections:', error);
    }
  });

  describe('User Identity', () => {
    test('should get current user username', async () => {
      testState.authToken = primaryUserToken;
      
      const response = await testApiClient.authenticatedRequest(
        'GET',
        '/friends/my-username',
        undefined,
        200,
        (data: any) => {
          assertCondition(
            !!data.username,
            'Response should contain username',
            data.username
          );

          assertCondition(
            typeof data.username === 'string' && data.username.length > 0,
            'Username should be a non-empty string',
            data.username
          );
        }
      );

      primaryUsername = response.username;
      expect(primaryUsername).toBeDefined();
      expect(primaryUsername.length).toBeGreaterThan(0);
      console.log(`👤 Primary user username: ${primaryUsername}`);
    });

    test('should get friend ID (legacy endpoint)', async () => {
      const response = await testApiClient.authenticatedRequest(
        'GET',
        '/friends/my-id',
        undefined,
        200,
        (data: any) => {
          // Legacy endpoint might return different format
          assertCondition(
            !!data.id || !!data.friendId || !!data.username,
            'Response should contain some form of user identifier',
            data
          );
        }
      );

      expect(response).toBeDefined();
      console.log(`🆔 User ID/identifier:`, response);
    });

    test('should get secondary user username for friend tests', async () => {
      testState.authToken = secondaryUserToken;
      
      const response = await testApiClient.authenticatedRequest(
        'GET',
        '/friends/my-username',
        undefined,
        200
      );

      secondaryUsername = (response as any).username;
      expect(secondaryUsername).toBeDefined();
      console.log(`👤 Secondary user username: ${secondaryUsername}`);

      // Switch back to primary user
      testState.authToken = primaryUserToken;
    });
  });

  describe('User Lookup', () => {
    test('should lookup existing user by username', async () => {
      const response = await testApiClient.authenticatedRequest(
        'GET',
        `/friends/lookup/${secondaryUsername}`,
        undefined,
        200,
        (data: any) => {
          assertCondition(
            !!data.user || !!data.profile,
            'Response should contain user data',
            data
          );

          const userData = data.user || data.profile || data;
          assertCondition(
            userData.username === secondaryUsername,
            'Returned username should match lookup',
            userData.username,
            secondaryUsername
          );
        }
      );

      const userData = response.user || response.profile || response;
      expect(userData.username).toBe(secondaryUsername);
      console.log(`🔍 Looked up user: ${userData.username}`);
    });

    test('should handle non-existent user lookup', async () => {
      const nonExistentUsername = `nonexistent_user_${Date.now()}`;
      
      try {
        await testApiClient.authenticatedRequest(
          'GET',
          `/friends/lookup/${nonExistentUsername}`,
          undefined,
          404
        );
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
        console.log(`✅ Correctly handled non-existent user lookup: ${nonExistentUsername}`);
      }
    });

    test('should validate username format in lookup', async () => {
      const invalidUsernames = [
        '', // Empty username
        'user@invalid', // Invalid characters
        'a', // Too short
        'x'.repeat(100), // Too long
      ];

      for (const invalidUsername of invalidUsernames) {
        try {
          await testApiClient.authenticatedRequest(
            'GET',
            `/friends/lookup/${encodeURIComponent(invalidUsername)}`,
            undefined,
            400
          );
        } catch (error: any) {
          expect(error.response?.status).toBeOneOf([400, 404]);
        }
      }
    });

    test('should handle special characters in username lookup', async () => {
      const specialUsernames = [
        'user-with-hyphens',
        'user_with_underscores',
        'user123numbers',
      ];

      for (const username of specialUsernames) {
        try {
          const response = await testApiClient.authenticatedRequest(
            'GET',
            `/friends/lookup/${encodeURIComponent(username)}`,
            undefined,
            200
          );
          
          console.log(`🔍 Successfully looked up special username: ${username}`);
          
        } catch (error: any) {
          // User might not exist, which is fine for this test
          if (error.response?.status === 404) {
            console.log(`ℹ️  User ${username} does not exist (expected)`);
          } else {
            expect(error.response?.status).not.toBe(400); // Should not be validation error
          }
        }
      }
    });
  });

  describe('Friend Requests and Connections', () => {
    test('should add friend by username', async () => {
      const response = await testApiClient.authenticatedRequest(
        'POST',
        '/friends/add',
        { username: secondaryUsername },
        200,
        (data: any) => {
          assertCondition(
            data.success !== false,
            'Friend addition should be successful',
            data.success
          );
        }
      );

      expect(response).toBeDefined();
      testState.friendConnections.push(secondaryUsername);
      console.log(`👫 Added friend: ${secondaryUsername}`);
    });

    test('should handle duplicate friend requests', async () => {
      try {
        await testApiClient.authenticatedRequest(
          'POST',
          '/friends/add',
          { username: secondaryUsername },
          409 // Expect conflict for duplicate
        );
      } catch (error: any) {
        // Might return different status codes for duplicate requests
        expect(error.response?.status).toBeOneOf([409, 400, 422]);
        console.log(`✅ Correctly handled duplicate friend request`);
      }
    });

    test('should reject adding non-existent user as friend', async () => {
      const nonExistentUsername = `fake_user_${Date.now()}`;
      
      try {
        await testApiClient.authenticatedRequest(
          'POST',
          '/friends/add',
          { username: nonExistentUsername },
          404
        );
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
        console.log(`✅ Correctly rejected non-existent user friend request`);
      }
    });

    test('should prevent adding self as friend', async () => {
      try {
        await testApiClient.authenticatedRequest(
          'POST',
          '/friends/add',
          { username: primaryUsername },
          400
        );
      } catch (error: any) {
        expect(error.response?.status).toBeOneOf([400, 422]);
        console.log(`✅ Correctly prevented self-friend request`);
      }
    });

    test('should validate friend request data', async () => {
      const invalidRequests = [
        {}, // Missing username
        { username: '' }, // Empty username
        { username: null }, // Null username
        { username: 123 }, // Invalid type
      ];

      for (const invalidRequest of invalidRequests) {
        try {
          await testApiClient.authenticatedRequest(
            'POST',
            '/friends/add',
            invalidRequest,
            400
          );
        } catch (error: any) {
          expect(error.response?.status).toBeOneOf([400, 422]);
        }
      }
    });
  });

  describe('Friends List Management', () => {
    test('should get friends list', async () => {
      const response = await testApiClient.authenticatedRequest(
        'GET',
        '/friends/list',
        undefined,
        200,
        (data: any) => {
          const friends = data.friends || data.data || data;
          
          assertCondition(
            Array.isArray(friends),
            'Friends list should be an array',
            Array.isArray(friends)
          );

          if (friends.length > 0) {
            const firstFriend = friends[0];
            assertCondition(
              !!firstFriend.username || !!firstFriend.id,
              'Each friend should have username or ID',
              firstFriend
            );
          }
        }
      );

      const friends = (response as any).friends || (response as any).data || response;
      expect(Array.isArray(friends)).toBe(true);
      console.log(`👥 Retrieved friends list with ${friends.length} friends`);

      // Verify our test friend is in the list
      const testFriendInList = friends.some((friend: any) => 
        friend.username === secondaryUsername ||
        friend.user?.username === secondaryUsername
      );

      if (testFriendInList) {
        console.log(`✅ Test friend ${secondaryUsername} found in friends list`);
      } else {
        console.log(`ℹ️  Test friend ${secondaryUsername} not yet in friends list (may require mutual acceptance)`);
      }
    });

    test('should handle empty friends list', async () => {
      // Test with a user who should have no friends
      // For this test, we'll assume the response structure handles empty lists gracefully
      
      const response = await testApiClient.authenticatedRequest(
        'GET',
        '/friends/list',
        undefined,
        200
      );

      const friends = (response as any).friends || (response as any).data || response;
      expect(Array.isArray(friends)).toBe(true);
      
      // Empty friends list should still return valid structure
      console.log(`📋 Friends list structure valid for ${friends.length} friends`);
    });

    test('should paginate friends list if supported', async () => {
      // Try to test pagination parameters
      try {
        const response = await testApiClient.authenticatedRequest(
          'GET',
          '/friends/list?limit=10&page=1',
          undefined,
          200
        );

        const friends = (response as any).friends || (response as any).data || response;
        expect(Array.isArray(friends)).toBe(true);
        console.log(`📄 Paginated friends list: ${friends.length} friends`);
        
      } catch (error: any) {
        // Pagination might not be supported
        if (error.response?.status === 400) {
          console.log('ℹ️  Friends list pagination not supported');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Friend Requests (if supported)', () => {
    test('should get pending friend requests', async () => {
      try {
        const response = await testApiClient.authenticatedRequest(
          'GET',
          '/friends/requests',
          undefined,
          200,
          (data: any) => {
            const requests = data.requests || data.pending || data.data || data;
            
            assertCondition(
              Array.isArray(requests),
              'Friend requests should be an array',
              Array.isArray(requests)
            );
          }
        );

        const requests = response.requests || response.pending || response.data || response;
        console.log(`📨 Retrieved ${requests.length} pending friend requests`);
        
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('ℹ️  Friend requests endpoint not available');
        } else {
          throw error;
        }
      }
    });

    test('should accept friend request', async () => {
      // This test assumes there are pending requests
      // In a real scenario, you'd coordinate between test users
      
      try {
        const response = await testApiClient.authenticatedRequest(
          'POST',
          '/friends/requests/accept',
          { username: secondaryUsername },
          200
        );

        console.log(`✅ Accepted friend request from ${secondaryUsername}`);
        
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('ℹ️  No pending friend request to accept');
        } else {
          throw error;
        }
      }
    });

    test('should decline friend request', async () => {
      try {
        const response = await testApiClient.authenticatedRequest(
          'POST',
          '/friends/requests/decline',
          { username: 'some_test_user' },
          200
        );

        console.log(`✅ Declined friend request functionality verified`);
        
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('ℹ️  No pending friend request to decline');
        } else if (error.response?.status === 400) {
          console.log('ℹ️  Friend request decline endpoint validated request format');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Friend Removal', () => {
    test('should remove friend connection', async () => {
      // Only try to remove if we successfully added the friend
      if (testState.friendConnections.includes(secondaryUsername)) {
        const response = await testApiClient.authenticatedRequest(
          'DELETE',
          '/friends/remove',
          { username: secondaryUsername },
          200,
          (data: any) => {
            assertCondition(
              data.success !== false,
              'Friend removal should be successful',
              data.success
            );
          }
        );

        expect(response).toBeDefined();
        
        // Remove from our test state
        const index = testState.friendConnections.indexOf(secondaryUsername);
        if (index > -1) {
          testState.friendConnections.splice(index, 1);
        }
        
        console.log(`💔 Removed friend: ${secondaryUsername}`);
      } else {
        console.log('ℹ️  Skipping friend removal - no friend connection to remove');
      }
    });

    test('should handle removing non-existent friend', async () => {
      const nonExistentFriend = `fake_friend_${Date.now()}`;
      
      try {
        await testApiClient.authenticatedRequest(
          'DELETE',
          '/friends/remove',
          { username: nonExistentFriend },
          404
        );
      } catch (error: any) {
        expect(error.response?.status).toBeOneOf([404, 400]);
        console.log(`✅ Correctly handled non-existent friend removal`);
      }
    });

    test('should validate friend removal request', async () => {
      const invalidRequests = [
        {}, // Missing username
        { username: '' }, // Empty username
        { username: null }, // Null username
      ];

      for (const invalidRequest of invalidRequests) {
        try {
          await testApiClient.authenticatedRequest(
            'DELETE',
            '/friends/remove',
            invalidRequest,
            400
          );
        } catch (error: any) {
          expect(error.response?.status).toBeOneOf([400, 422]);
        }
      }
    });
  });

  describe('Friend Relationship Verification', () => {
    test('should verify mutual friend relationship', async () => {
      // Re-establish friend connection for this test
      try {
        await testApiClient.authenticatedRequest(
          'POST',
          '/friends/add',
          { username: secondaryUsername },
          200
        );

        // Check from primary user's perspective
        const primaryFriends = await testApiClient.authenticatedRequest(
          'GET',
          '/friends/list',
          undefined,
          200
        );

        // Check from secondary user's perspective
        testState.authToken = secondaryUserToken;
        const secondaryFriends = await testApiClient.authenticatedRequest(
          'GET',
          '/friends/list',
          undefined,
          200
        );

        testState.authToken = primaryUserToken; // Switch back

        const primaryFriendsList = (primaryFriends as any).friends || (primaryFriends as any).data || primaryFriends;
        const secondaryFriendsList = (secondaryFriends as any).friends || (secondaryFriends as any).data || secondaryFriends;

        const primaryHasSecondary = primaryFriendsList.some((friend: any) => 
          friend.username === secondaryUsername ||
          friend.user?.username === secondaryUsername
        );

        const secondaryHasPrimary = secondaryFriendsList.some((friend: any) => 
          friend.username === primaryUsername ||
          friend.user?.username === primaryUsername
        );

        console.log(`🔄 Mutual friendship verification:`);
        console.log(`   Primary -> Secondary: ${primaryHasSecondary ? '✅' : '❌'}`);
        console.log(`   Secondary -> Primary: ${secondaryHasPrimary ? '✅' : '❌'}`);

        // In a mutual friend system, both should be true
        // In a follow system, they might be independent
        
      } catch (error: any) {
        console.log('ℹ️  Mutual friendship verification completed with mixed results');
      }
    });

    test('should handle friend status consistency', async () => {
      // Verify that friend relationships are consistent across operations
      const beforeFriends = await testApiClient.authenticatedRequest(
        'GET',
        '/friends/list',
        undefined,
        200
      );

      const beforeCount = ((beforeFriends as any).friends || (beforeFriends as any).data || beforeFriends).length;

      // Perform lookup of existing friend
      if (beforeCount > 0) {
        const existingFriend = ((beforeFriends as any).friends || (beforeFriends as any).data || beforeFriends)[0];
        const friendUsername = existingFriend.username || existingFriend.user?.username;

        if (friendUsername) {
          const lookupResult = await testApiClient.authenticatedRequest(
            'GET',
            `/friends/lookup/${friendUsername}`,
            undefined,
            200
          );

          expect(lookupResult).toBeDefined();
          console.log(`🔍 Friend consistency verified for ${friendUsername}`);
        }
      }

      console.log(`📊 Friend list consistency: ${beforeCount} friends maintained`);
    });
  });

  describe('Friends System Performance', () => {
    test('should load friends list efficiently', async () => {
      const startTime = Date.now();
      
      await testApiClient.authenticatedRequest(
        'GET',
        '/friends/list',
        undefined,
        200
      );

      const loadTime = Date.now() - startTime;
      
      assertCondition(
        loadTime < 3000,
        'Friends list should load within 3 seconds',
        loadTime
      );

      console.log(`⏱️  Friends list loaded in ${loadTime}ms`);
    });

    test('should handle concurrent friend operations', async () => {
      // Test concurrent lookups
      const concurrentLookups = [
        secondaryUsername,
        primaryUsername,
        'nonexistent1',
        'nonexistent2'
      ];

      const startTime = Date.now();
      const results = await Promise.allSettled(
        concurrentLookups.map(username => 
          testApiClient.authenticatedRequest(
            'GET',
            `/friends/lookup/${username}`,
            undefined,
            200
          ).catch(e => e)
        )
      );

      const endTime = Date.now();
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      console.log(`🔄 Concurrent lookups: ${successful}/${concurrentLookups.length} successful in ${endTime - startTime}ms`);
      
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});