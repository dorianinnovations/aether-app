// Test script to verify social cards API integration
const axios = require('axios');

// Configuration
const API_BASE_URL = 'https://aether-server-j5kh.onrender.com/api';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

// API client setup
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Test functions
async function testFriendsList() {
  try {
    console.log('\n📋 Testing Friends List API...');
    const response = await api.get('/friends');
    console.log('✅ Friends list response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Friends list error:', error.response?.data || error.message);
    throw error;
  }
}

async function testSocialProxyProfile(username) {
  try {
    console.log(`\n👤 Testing Social Proxy Profile for ${username}...`);
    const response = await api.get(`/social-proxy/friend/${username}`);
    console.log('✅ Social proxy response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`❌ Social proxy error for ${username}:`, error.response?.data || error.message);
    throw error;
  }
}

async function testUpdateStatus(status) {
  try {
    console.log(`\n💭 Testing Status Update: "${status}"...`);
    const response = await api.put('/social-proxy/status', { status });
    console.log('✅ Status update response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Status update error:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function testSocialCardsIntegration() {
  console.log('🚀 Starting Feed Integration Test...');
  console.log('================================');
  
  try {
    // Test 1: Get friends list
    const friendsData = await testFriendsList();
    
    if (!friendsData.success || !friendsData.friends?.length) {
      console.log('⚠️  No friends found in the list. Add some friends first!');
      return;
    }
    
    // Test 2: Get social proxy profile for each friend
    console.log(`\n📊 Found ${friendsData.friends.length} friends. Testing social proxy profiles...`);
    
    for (const friend of friendsData.friends.slice(0, 3)) { // Test first 3 friends
      await testSocialProxyProfile(friend.username);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }
    
    // Test 3: Update current user's status
    await testUpdateStatus('🧪 Testing social cards integration!');
    
    console.log('\n✅ All tests completed successfully!');
    console.log('================================');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.log('================================');
  }
}

// Run the test
if (require.main === module) {
  console.log('Note: Please update TEST_TOKEN with a valid authentication token before running.');
  console.log('You can get a token by logging in through the app and checking network requests.\n');
  
  if (TEST_TOKEN === 'your-test-token-here') {
    console.error('❌ Please update TEST_TOKEN with a valid authentication token!');
    process.exit(1);
  }
  
  testSocialCardsIntegration();
}

module.exports = {
  testFriendsList,
  testSocialProxyProfile,
  testUpdateStatus,
  testSocialCardsIntegration
};