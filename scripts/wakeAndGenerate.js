#!/usr/bin/env node

/**
 * Wake up Render server and generate users
 */

const axios = require('axios');

const SERVER_URL = 'https://aether-server-j5kh.onrender.com';
const MAX_WAKE_ATTEMPTS = 10;
const WAKE_DELAY = 30000; // 30 seconds between wake attempts

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function wakeServer() {
  console.log('🌅 Attempting to wake up Render server...\n');
  
  for (let attempt = 1; attempt <= MAX_WAKE_ATTEMPTS; attempt++) {
    try {
      console.log(`Wake attempt ${attempt}/${MAX_WAKE_ATTEMPTS}...`);
      
      const response = await axios.get(`${SERVER_URL}/health`, { 
        timeout: 60000 // 60 second timeout for wake attempts
      });
      
      if (response.status === 200) {
        console.log('✅ Server is awake and healthy!');
        console.log('Server info:', JSON.stringify(response.data, null, 2));
        return true;
      }
      
    } catch (error) {
      const status = error.response?.status;
      console.log(`  Status: ${status || 'timeout'} - ${error.message}`);
      
      if (status && status !== 503) {
        console.log('✅ Server responded with non-503 error - likely awake');
        return true;
      }
      
      if (attempt < MAX_WAKE_ATTEMPTS) {
        console.log(`  Waiting ${WAKE_DELAY/1000} seconds before next attempt...\n`);
        await delay(WAKE_DELAY);
      }
    }
  }
  
  console.log('❌ Failed to wake server after maximum attempts');
  return false;
}

async function createTestUser() {
  console.log('\n🧪 Creating test user to verify functionality...');
  
  try {
    const response = await axios.post(`${SERVER_URL}/auth/signup`, {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      username: `testuser${Date.now()}`
    }, { timeout: 30000 });
    
    if (response.data.success) {
      console.log('✅ Test user created successfully!');
      return response.data.token;
    } else {
      console.log('❌ Test user creation failed:', response.data.error);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Test user creation error:', error.response?.data?.error || error.message);
    return null;
  }
}

async function generateQuickBatch(token) {
  console.log('\n🚀 Generating quick batch of diverse users...\n');
  
  const quickProfiles = [
    {
      username: `dev${Date.now()}`,
      email: `dev${Date.now()}@example.com`,
      messages: [
        "I love programming and building web applications",
        "JavaScript and React are my go-to technologies",
        "Code quality and best practices matter to me"
      ]
    },
    {
      username: `artist${Date.now()}`,
      email: `artist${Date.now()}@example.com`,
      messages: [
        "Art and creativity define who I am",
        "I express myself through digital design",
        "Visual storytelling is my passion"
      ]
    },
    {
      username: `gamer${Date.now()}`,
      email: `gamer${Date.now()}@example.com`,
      messages: [
        "Gaming is my favorite way to unwind",
        "I love competitive strategy games",
        "The gaming community is incredible"
      ]
    }
  ];
  
  const successfulUsers = [];
  
  for (const profile of quickProfiles) {
    try {
      console.log(`Creating ${profile.username}...`);
      
      const response = await axios.post(`${SERVER_URL}/auth/signup`, {
        email: profile.email,
        password: 'password123',
        username: profile.username
      }, { timeout: 30000 });
      
      if (response.data.success) {
        console.log(`✅ Created ${profile.username}`);
        
        // Send messages
        for (const message of profile.messages) {
          try {
            await axios.post(`${SERVER_URL}/social-chat`, {
              message,
              stream: false
            }, {
              headers: { 'Authorization': `Bearer ${response.data.token}` },
              timeout: 30000
            });
            console.log(`  ✅ Sent message for ${profile.username}`);
            await delay(2000);
          } catch (msgError) {
            console.log(`  ❌ Message failed for ${profile.username}`);
          }
        }
        
        // Force analysis
        try {
          await axios.post(`${SERVER_URL}/matching/force-analysis`, {}, {
            headers: { 'Authorization': `Bearer ${response.data.token}` },
            timeout: 30000
          });
          console.log(`  ✅ Analysis completed for ${profile.username}`);
        } catch (analysisError) {
          console.log(`  ❌ Analysis failed for ${profile.username}`);
        }
        
        successfulUsers.push(profile.username);
        
      } else {
        console.log(`❌ Failed to create ${profile.username}: ${response.data.error}`);
      }
      
      await delay(5000); // 5 second delay between users
      
    } catch (error) {
      console.log(`❌ Error creating ${profile.username}: ${error.response?.data?.error || error.message}`);
    }
  }
  
  console.log(`\n🎉 Generated ${successfulUsers.length} users successfully!`);
  console.log('Created users:', successfulUsers.join(', '));
  
  return successfulUsers;
}

async function main() {
  console.log('🚀 Starting wake and generate process...\n');
  
  // Wake the server
  const isAwake = await wakeServer();
  if (!isAwake) {
    console.log('❌ Unable to wake server, exiting...');
    process.exit(1);
  }
  
  // Create test user
  const testToken = await createTestUser();
  if (!testToken) {
    console.log('❌ Server not fully functional, exiting...');
    process.exit(1);
  }
  
  // Generate batch of users
  const createdUsers = await generateQuickBatch();
  
  if (createdUsers.length > 0) {
    console.log('\n✅ Process completed successfully!');
    console.log('\nYou can now test the matching system in the app.');
    console.log('Create a new account, chat with Aether, and check the Connections screen.');
  } else {
    console.log('\n❌ No users were created successfully.');
  }
}

main().catch(console.error);