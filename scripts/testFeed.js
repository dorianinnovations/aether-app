/* eslint-disable no-console */
/**
 * Feed Testing Script
 * Tests the complete feed functionality including posts, timeline, and friends
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'https://aether-server-j5kh.onrender.com';

// Test credentials - you'll need to update these
const TEST_USER_1 = {
  email: 'testuser1@example.com',
  password: 'Test123!@#',
  username: 'testuser1',
  name: 'Test User One'
};

const TEST_USER_2 = {
  email: 'testuser2@example.com', 
  password: 'Test123!@#',
  username: 'testuser2',
  name: 'Test User Two'
};

// API client
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper functions
async function signUp(userData) {
  try {
    console.log(`\n📝 Signing up ${userData.username}...`);
    const response = await api.post('/auth/signup', userData);
    console.log(`✅ ${userData.username} signed up successfully`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error?.includes('already exists')) {
      console.log(`ℹ️ ${userData.username} already exists, attempting login...`);
      return await login(userData);
    }
    console.error(`❌ Signup error for ${userData.username}:`, error.response?.data || error.message);
    throw error;
  }
}

async function login(userData) {
  try {
    console.log(`\n🔐 Logging in ${userData.username}...`);
    const response = await api.post('/auth/login', {
      email: userData.email,
      password: userData.password
    });
    console.log(`✅ ${userData.username} logged in successfully`);
    return response.data;
  } catch (error) {
    console.error(`❌ Login error for ${userData.username}:`, error.response?.data || error.message);
    throw error;
  }
}

async function addFriend(token, friendUsername) {
  try {
    console.log(`\n👥 Adding ${friendUsername} as friend...`);
    const response = await api.post('/friends/add', 
      { username: friendUsername },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Added ${friendUsername} as friend`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error?.includes('Already friends')) {
      console.log(`ℹ️ Already friends with ${friendUsername}`);
      return { success: true, message: 'Already friends' };
    }
    console.error(`❌ Add friend error:`, error.response?.data || error.message);
    throw error;
  }
}

async function createPost(token, text, visibility = 'friends') {
  try {
    console.log(`\n📝 Creating post: "${text.substring(0, 50)}..."`);
    const response = await api.post('/social-proxy/posts',
      { text, visibility },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Post created successfully`);
    return response.data;
  } catch (error) {
    console.error(`❌ Create post error:`, error.response?.data || error.message);
    throw error;
  }
}

async function updateStatus(token, status, plans, mood) {
  try {
    console.log(`\n💭 Updating status...`);
    const response = await api.post('/social-proxy/status',
      { currentStatus: status, currentPlans: plans, mood },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ Status updated successfully`);
    return response.data;
  } catch (error) {
    console.error(`❌ Update status error:`, error.response?.data || error.message);
    throw error;
  }
}

async function getTimeline(token) {
  try {
    console.log(`\n📋 Fetching timeline...`);
    const response = await api.get('/social-proxy/timeline',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const timeline = response.data.timeline || [];
    console.log(`✅ Timeline fetched: ${timeline.length} activities`);
    
    // Display timeline items
    timeline.forEach((activity, index) => {
      console.log(`  ${index + 1}. [${activity.type}] by ${activity.user?.username}: ${
        activity.content?.text?.substring(0, 50) || 'No text'
      }`);
    });
    
    return response.data;
  } catch (error) {
    console.error(`❌ Get timeline error:`, error.response?.data || error.message);
    throw error;
  }
}

async function getFriendsList(token) {
  try {
    console.log(`\n👥 Fetching friends list...`);
    const response = await api.get('/friends/list',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const friends = response.data.friends || [];
    console.log(`✅ Friends list: ${friends.length} friends`);
    friends.forEach(friend => {
      console.log(`  - ${friend.username} (${friend.name})`);
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Get friends error:`, error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function testFeedComplete() {
  console.log('🚀 Starting Complete Feed Test...');
  console.log('================================\n');
  
  try {
    // Step 1: Set up users
    console.log('📦 STEP 1: Setting up test users...');
    const user1Auth = await signUp(TEST_USER_1);
    const user2Auth = await signUp(TEST_USER_2);
    
    const token1 = user1Auth.token;
    const token2 = user2Auth.token;
    
    // Step 2: Make them friends
    console.log('\n📦 STEP 2: Establishing friendship...');
    await addFriend(token1, TEST_USER_2.username);
    
    // Step 3: Create content for User 1
    console.log('\n📦 STEP 3: Creating content for User 1...');
    await createPost(token1, '🎉 Just joined Aether! Excited to connect with everyone here!');
    await updateStatus(token1, 'Working on exciting projects', 'Coffee meetup this weekend', 'productive');
    await createPost(token1, '☕ Anyone up for a coffee chat about AI and the future of social networking?');
    
    // Step 4: Create content for User 2
    console.log('\n📦 STEP 4: Creating content for User 2...');
    await createPost(token2, '🚀 Building something amazing today! Stay tuned for updates.');
    await updateStatus(token2, 'Deep in code mode', 'Launching new features soon', 'focused');
    await createPost(token2, '💡 Just had an incredible brainstorming session. Innovation is in the air!');
    
    // Step 5: Check User 1's timeline
    console.log('\n📦 STEP 5: Checking User 1\'s timeline...');
    const timeline1 = await getTimeline(token1);
    
    // Step 6: Check User 2's timeline
    console.log('\n📦 STEP 6: Checking User 2\'s timeline...');
    const timeline2 = await getTimeline(token2);
    
    // Step 7: Verify friends lists
    console.log('\n📦 STEP 7: Verifying friends lists...');
    await getFriendsList(token1);
    await getFriendsList(token2);
    
    // Summary
    console.log('\n✅ FEED TEST COMPLETE!');
    console.log('================================');
    console.log('Summary:');
    console.log(`  - User 1 timeline: ${timeline1.timeline?.length || 0} activities`);
    console.log(`  - User 2 timeline: ${timeline2.timeline?.length || 0} activities`);
    console.log('\n💡 Next steps:');
    console.log('  1. Open the app and login with either test account');
    console.log('  2. Navigate to the Feed screen');
    console.log('  3. You should see posts from both users');
    console.log('  4. Try creating new posts and refreshing the feed');
    console.log('\nTest accounts:');
    console.log(`  User 1: ${TEST_USER_1.email} / ${TEST_USER_1.password}`);
    console.log(`  User 2: ${TEST_USER_2.email} / ${TEST_USER_2.password}`);
    
  } catch (error) {
    console.error('\n❌ Feed test failed:', error.message);
    console.log('================================');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  console.log('🔧 Feed Testing Script');
  console.log('This script will:');
  console.log('  1. Create/login two test users');
  console.log('  2. Make them friends');
  console.log('  3. Create posts and status updates');
  console.log('  4. Verify the timeline is working\n');
  
  testFeedComplete();
}

module.exports = {
  signUp,
  login,
  addFriend,
  createPost,
  updateStatus,
  getTimeline,
  getFriendsList,
  testFeedComplete
};