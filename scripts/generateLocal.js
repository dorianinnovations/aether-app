#!/usr/bin/env node

/**
 * Local user generation script
 * Run this against a local aether-server instance
 */

const axios = require('axios');

// Configuration - change this to your local server
const SERVER_URL = 'http://localhost:5000';
const USERS_TO_CREATE = 15;

// Comprehensive user profiles with diverse interests
const USER_PROFILES = [
  {
    username: 'alex_fullstack',
    email: 'alex@test.com',
    interests: ['programming', 'web development', 'javascript', 'react', 'node.js'],
    style: 'analytical',
    messages: [
      "I'm passionate about full-stack development",
      "JavaScript is my favorite programming language",
      "React makes building UIs so much easier",
      "I love solving complex coding problems",
      "Node.js backend development is fascinating",
      "Clean code and best practices are important to me"
    ]
  },
  {
    username: 'sarah_designer',
    email: 'sarah@test.com',
    interests: ['design', 'ui/ux', 'creativity', 'art', 'figma'],
    style: 'creative',
    messages: [
      "Design is my passion and my calling",
      "I love creating beautiful user experiences",
      "Figma is an amazing design tool",
      "Color theory and typography fascinate me",
      "User-centered design is crucial",
      "Art and technology blend perfectly in UX"
    ]
  },
  {
    username: 'mike_gamer_pro',
    email: 'mike@test.com',
    interests: ['gaming', 'esports', 'strategy', 'fps', 'streaming'],
    style: 'energetic',
    messages: [
      "Gaming is not just a hobby, it's a lifestyle",
      "I'm ranked high in several competitive games",
      "Strategy games challenge my tactical thinking",
      "The esports scene is incredibly exciting",
      "I love streaming my gameplay",
      "Gaming communities are the best"
    ]
  },
  {
    username: 'luna_bookworm',
    email: 'luna@test.com',
    interests: ['reading', 'literature', 'philosophy', 'writing', 'poetry'],
    style: 'thoughtful',
    messages: [
      "Books transport me to different worlds",
      "Philosophy helps me understand life better",
      "I write poetry in my spare time",
      "Literature has shaped my worldview",
      "Reading is my favorite form of escape",
      "Words have incredible power"
    ]
  },
  {
    username: 'david_athlete',
    email: 'david@test.com',
    interests: ['fitness', 'running', 'health', 'nutrition', 'sports'],
    style: 'energetic',
    messages: [
      "Fitness is my way of life",
      "Running gives me mental clarity",
      "Proper nutrition fuels performance",
      "I love helping others reach their fitness goals",
      "Sports teach valuable life lessons",
      "Physical and mental health go hand in hand"
    ]
  },
  {
    username: 'emma_chef',
    email: 'emma@test.com',
    interests: ['cooking', 'culinary arts', 'food', 'recipes', 'nutrition'],
    style: 'social',
    messages: [
      "Cooking is my creative outlet",
      "I love experimenting with new flavors",
      "Food brings people together",
      "Culinary arts is both science and art",
      "I enjoy sharing recipes with friends",
      "Good food creates lasting memories"
    ]
  },
  {
    username: 'ryan_explorer',
    email: 'ryan@test.com',
    interests: ['travel', 'adventure', 'photography', 'cultures', 'hiking'],
    style: 'adventurous',
    messages: [
      "Travel broadens the mind and soul",
      "I love capturing moments through photography",
      "Different cultures fascinate me",
      "Hiking connects me with nature",
      "Adventure is calling and I must go",
      "Every journey teaches something new"
    ]
  },
  {
    username: 'zoe_musician',
    email: 'zoe@test.com',
    interests: ['music', 'guitar', 'songwriting', 'indie', 'concerts'],
    style: 'creative',
    messages: [
      "Music is the universal language",
      "I've been playing guitar for years",
      "Songwriting is how I express my emotions",
      "Indie music speaks to my soul",
      "Live concerts are pure magic",
      "Music connects people across boundaries"
    ]
  },
  {
    username: 'tyler_entrepreneur',
    email: 'tyler@test.com',
    interests: ['business', 'startups', 'innovation', 'leadership', 'networking'],
    style: 'ambitious',
    messages: [
      "Entrepreneurship is about solving problems",
      "Innovation drives progress",
      "Building teams is both art and science",
      "Networking opens unexpected opportunities",
      "Failure is just feedback for improvement",
      "Every challenge is a growth opportunity"
    ]
  },
  {
    username: 'maya_scientist',
    email: 'maya@test.com',
    interests: ['science', 'research', 'biology', 'discoveries', 'lab work'],
    style: 'analytical',
    messages: [
      "Science reveals the beauty of nature",
      "Research is my contribution to knowledge",
      "Biology never ceases to amaze me",
      "Lab work requires precision and patience",
      "Every experiment teaches something",
      "Discovery is the ultimate reward"
    ]
  },
  {
    username: 'jake_comedian',
    email: 'jake@test.com',
    interests: ['comedy', 'humor', 'stand-up', 'entertainment', 'writing'],
    style: 'humorous',
    messages: [
      "Laughter is the best medicine",
      "Comedy helps people cope with life",
      "Stand-up is raw and honest",
      "Timing is everything in humor",
      "Making people laugh is my gift",
      "Humor reveals truth in unexpected ways"
    ]
  },
  {
    username: 'ava_mindful',
    email: 'ava@test.com',
    interests: ['yoga', 'meditation', 'mindfulness', 'wellness', 'spirituality'],
    style: 'peaceful',
    messages: [
      "Yoga brings balance to my life",
      "Meditation quiets the mind",
      "Mindfulness is presence in action",
      "Wellness is holistic well-being",
      "Spirituality connects me to something greater",
      "Inner peace radiates outward"
    ]
  },
  {
    username: 'noah_builder',
    email: 'noah@test.com',
    interests: ['woodworking', 'crafts', 'building', 'tools', 'diy'],
    style: 'practical',
    messages: [
      "Working with my hands is therapeutic",
      "Woodworking teaches patience and precision",
      "Building something from scratch is rewarding",
      "Good tools make all the difference",
      "DIY projects save money and build skills",
      "Craftsmanship is a dying art worth preserving"
    ]
  },
  {
    username: 'chloe_dancer',
    email: 'chloe@test.com',
    interests: ['dance', 'choreography', 'movement', 'performance', 'ballet'],
    style: 'expressive',
    messages: [
      "Dance is poetry in motion",
      "Choreography is visual storytelling",
      "Movement expresses what words cannot",
      "Performance connects dancer and audience",
      "Ballet requires discipline and grace",
      "Dance is both athletic and artistic"
    ]
  },
  {
    username: 'ethan_techie',
    email: 'ethan@test.com',
    interests: ['technology', 'ai', 'blockchain', 'innovation', 'future'],
    style: 'analytical',
    messages: [
      "Technology shapes our future",
      "AI will transform every industry",
      "Blockchain enables new possibilities",
      "Innovation requires both vision and execution",
      "The future is being built today",
      "Technology should serve humanity"
    ]
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function createUser(profile) {
  try {
    const response = await axios.post(`${SERVER_URL}/auth/signup`, {
      email: profile.email,
      password: 'password123',
      username: profile.username
    });
    
    if (response.data.success) {
      console.log(`✅ Created: ${profile.username}`);
      return response.data.token;
    } else {
      console.log(`❌ Failed: ${profile.username} - ${response.data.error}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error: ${profile.username} - ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function sendMessages(token, messages, username) {
  console.log(`  📝 Sending ${messages.length} messages for ${username}...`);
  
  for (let i = 0; i < messages.length; i++) {
    try {
      await axios.post(`${SERVER_URL}/social-chat`, {
        message: messages[i],
        stream: false
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`    ✅ Message ${i + 1}/${messages.length}`);
      await delay(500); // Small delay between messages
      
    } catch (error) {
      console.log(`    ❌ Message ${i + 1} failed`);
    }
  }
}

async function forceAnalysis(token, username) {
  try {
    await axios.post(`${SERVER_URL}/matching/force-analysis`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`  🧠 Profile analysis completed for ${username}`);
  } catch (error) {
    console.log(`  ❌ Analysis failed for ${username}`);
  }
}

async function testMatching(testUsername, testPassword) {
  try {
    console.log(`\n🔍 Testing matching for ${testUsername}...`);
    
    // Login
    const loginResponse = await axios.post(`${SERVER_URL}/auth/login`, {
      email: `${testUsername}@test.com`,
      password: testPassword
    });
    
    if (!loginResponse.data.success) {
      console.log(`❌ Failed to login as ${testUsername}`);
      return;
    }
    
    const token = loginResponse.data.token;
    
    // Get matches
    const matchesResponse = await axios.get(`${SERVER_URL}/matching/find?limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (matchesResponse.data.success && matchesResponse.data.matches.length > 0) {
      console.log(`✅ Found ${matchesResponse.data.matches.length} matches for ${testUsername}:`);
      matchesResponse.data.matches.slice(0, 5).forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.user.username} (${Math.round(match.compatibility.score * 100)}%)`);
        console.log(`     ${match.matchReasons.join(' • ')}`);
      });
    } else {
      console.log(`❌ No matches found for ${testUsername}`);
    }
    
  } catch (error) {
    console.log(`❌ Error testing matching: ${error.response?.data?.error || error.message}`);
  }
}

async function generateUsers() {
  console.log(`🚀 Starting local user generation (${USERS_TO_CREATE} users)...\n`);
  
  const profiles = USER_PROFILES.slice(0, USERS_TO_CREATE);
  const successfulUsers = [];
  
  for (let i = 0; i < profiles.length; i++) {
    const profile = profiles[i];
    console.log(`\n[${i + 1}/${profiles.length}] Processing ${profile.username}...`);
    
    // Create user
    const token = await createUser(profile);
    if (!token) continue;
    
    // Send messages
    await sendMessages(token, profile.messages, profile.username);
    
    // Force analysis
    await forceAnalysis(token, profile.username);
    
    successfulUsers.push(profile.username);
    console.log(`✅ Completed ${profile.username}`);
    
    // Small delay between users
    await delay(1000);
  }
  
  console.log(`\n🎉 Generated ${successfulUsers.length}/${profiles.length} users successfully!`);
  
  if (successfulUsers.length > 0) {
    console.log('\n📋 Created users:');
    successfulUsers.forEach((username, index) => {
      console.log(`  ${index + 1}. ${username}`);
    });
    
    // Test matching with first user
    console.log('\n🧪 Testing matching system...');
    await testMatching(successfulUsers[0], 'password123');
  }
  
  console.log('\n✅ Process completed!');
  console.log('\n📱 To test in the app:');
  console.log('1. Start your local aether-server');
  console.log('2. Update your app to use localhost:5000');
  console.log('3. Create a new account and chat with Aether');
  console.log('4. Visit the Connections screen to see matches');
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === 'test') {
    const username = args[1] || 'alex_fullstack';
    const password = args[2] || 'password123';
    testMatching(username, password);
  } else {
    generateUsers().catch(console.error);
  }
}

module.exports = { generateUsers, testMatching };