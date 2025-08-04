#!/usr/bin/env node

/**
 * Small batch user generation for testing
 */

const axios = require('axios');

const SERVER_URL = 'https://aether-server-j5kh.onrender.com';
const REQUEST_TIMEOUT = 30000;
const RETRY_DELAY = 10000; // 10 seconds
const MAX_RETRIES = 2;

// Small diverse batch with unique timestamps
const timestamp = Date.now();
const SMALL_BATCH = [
  {
    username: `alex_coder_${timestamp}`,
    email: `alex.coder.${timestamp}@example.com`,
    messages: [
      "I love programming in JavaScript",
      "Working on React applications is my passion",
      "Code reviews help me learn new patterns",
      "Programming challenges are fun to solve"
    ]
  },
  {
    username: `sarah_creative_${timestamp}`,
    email: `sarah.creative.${timestamp}@example.com`, 
    messages: [
      "Art is my way of expressing myself",
      "I'm obsessed with digital design",
      "Creativity flows through everything I do",
      "Visual storytelling is powerful"
    ]
  },
  {
    username: `mike_gamer_${timestamp}`,
    email: `mike.gamer.${timestamp}@example.com`,
    messages: [
      "Gaming is my favorite hobby",
      "I love competitive esports",
      "Strategy games challenge my mind",
      "Gaming community is amazing"
    ]
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createUser(profile, attempt = 1) {
  try {
    console.log(`Creating ${profile.username} (attempt ${attempt}/${MAX_RETRIES})...`);
    
    const response = await axios.post(`${SERVER_URL}/auth/signup`, {
      email: profile.email,
      password: 'password123',
      username: profile.username
    }, {
      timeout: REQUEST_TIMEOUT
    });
    
    if (response.data.status === 'success') {
      console.log(`✓ Created: ${profile.username}`);
      return response.data.token;
    } else {
      console.log(`✗ Failed: ${response.data.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    const status = error.response?.status;
    console.log(`✗ Error: ${status} - ${error.response?.data?.error || error.message}`);
    
    if ((status === 429 || status === 503 || status >= 500) && attempt < MAX_RETRIES) {
      console.log(`  Waiting ${RETRY_DELAY/1000}s before retry...`);
      await delay(RETRY_DELAY);
      return createUser(profile, attempt + 1);
    }
    
    return null;
  }
}

async function sendMessages(token, messages, username) {
  for (const message of messages) {
    try {
      await axios.post(`${SERVER_URL}/social-chat`, {
        message,
        stream: false
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: REQUEST_TIMEOUT
      });
      
      console.log(`  ✓ Sent message for ${username}`);
      await delay(1000);
      
    } catch (error) {
      console.log(`  ✗ Message failed: ${error.response?.status}`);
    }
  }
}

async function forceAnalysis(token, username) {
  try {
    await axios.post(`${SERVER_URL}/matching/force-analysis`, {}, {
      headers: { 'Authorization': `Bearer ${token}` },
      timeout: REQUEST_TIMEOUT
    });
    console.log(`  ✓ Analysis completed for ${username}`);
  } catch (error) {
    console.log(`  ✗ Analysis failed for ${username}`);
  }
}

async function generateSmallBatch() {
  console.log('🚀 Creating small batch of test users...\n');
  
  for (const profile of SMALL_BATCH) {
    console.log(`\nProcessing ${profile.username}...`);
    
    const token = await createUser(profile);
    if (!token) continue;
    
    await sendMessages(token, profile.messages, profile.username);
    await forceAnalysis(token, profile.username);
    
    console.log(`✅ Completed ${profile.username}`);
    await delay(5000); // 5 second delay between users
  }
  
  console.log('\n🎉 Small batch completed!');
}

generateSmallBatch().catch(console.error);