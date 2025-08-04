#!/usr/bin/env node

/**
 * Aether User Generation Script
 * Mass produces users with varied profiles for testing matching system
 */

const axios = require('axios');

// Configuration
const SERVER_URL = 'https://aether-server-j5kh.onrender.com'; // Render server
const USERS_TO_CREATE = 15;
const REQUEST_TIMEOUT = 30000; // 30 seconds
const RETRY_DELAY = 5000; // 5 seconds between retries
const MAX_RETRIES = 3;

// Diverse user profiles with interests and communication styles
const timestamp = Date.now();
const USER_PROFILES = [
  {
    username: `alex_dev_${timestamp}`,
    email: `alex${timestamp}@example.com`,
    interests: ['programming', 'web development', 'javascript', 'react'],
    style: 'analytical',
    messages: [
      "I love coding in JavaScript, especially React applications",
      "Been working on a new web app using Next.js",
      "Programming is my passion, I could code all day",
      "What's your favorite programming language?",
      "I'm really into functional programming concepts lately"
    ]
  },
  {
    username: 'sarah_artist',
    email: 'sarah@example.com', 
    interests: ['art', 'painting', 'creativity', 'design'],
    style: 'creative',
    messages: [
      "I'm obsessed with watercolor painting",
      "Art is my way of expressing emotions",
      "Just finished a beautiful landscape painting",
      "I love experimenting with different art mediums",
      "Creative expression is so important to me"
    ]
  },
  {
    username: 'mike_gamer',
    email: 'mike@example.com',
    interests: ['gaming', 'esports', 'strategy games', 'fps'],
    style: 'energetic',
    messages: [
      "Gaming is life! Just hit diamond rank",
      "I'm really into competitive gaming",
      "Love playing strategy games and FPS",
      "Gaming community is amazing",
      "Spent all weekend gaming with friends"
    ]
  },
  {
    username: 'luna_bookworm',
    email: 'luna@example.com',
    interests: ['reading', 'literature', 'philosophy', 'writing'],
    style: 'thoughtful',
    messages: [
      "I love getting lost in a good book",
      "Philosophy fascinates me deeply",
      "Reading is my favorite way to spend time",
      "Just finished an amazing novel",
      "Books open up entire worlds"
    ]
  },
  {
    username: 'david_fitness', 
    email: 'david@example.com',
    interests: ['fitness', 'running', 'health', 'nutrition'],
    style: 'energetic',
    messages: [
      "Fitness is my lifestyle",
      "Just crushed a 10k run this morning",
      "I'm passionate about health and wellness",
      "Love helping others with their fitness journey",
      "Nothing beats the runner's high"
    ]
  },
  {
    username: 'emma_chef',
    email: 'emma@example.com',
    interests: ['cooking', 'food', 'recipes', 'culinary arts'],
    style: 'social',
    messages: [
      "Cooking is my creative outlet",
      "I love experimenting with new recipes",
      "Food brings people together",
      "Just made the most amazing pasta dish",
      "Culinary arts is pure artistry"
    ]
  },
  {
    username: 'ryan_traveler',
    email: 'ryan@example.com',
    interests: ['travel', 'adventure', 'photography', 'cultures'],
    style: 'adventurous',
    messages: [
      "Travel opens your mind to new possibilities",
      "Just got back from an amazing trip to Japan",
      "I'm addicted to exploring new places",
      "Photography helps me capture travel memories",
      "Different cultures fascinate me"
    ]
  },
  {
    username: 'zoe_musician',
    email: 'zoe@example.com',
    interests: ['music', 'guitar', 'songwriting', 'indie rock'],
    style: 'creative',
    messages: [
      "Music is the language of the soul",
      "Been writing songs since I was 12",
      "Guitar is my first love",
      "Indie rock speaks to my heart",
      "Working on my first album"
    ]
  },
  {
    username: 'tyler_entrepreneur',
    email: 'tyler@example.com',
    interests: ['business', 'startups', 'innovation', 'networking'],
    style: 'ambitious',
    messages: [
      "Building the next big startup",
      "Innovation drives everything I do",
      "Business strategy is fascinating",
      "Networking is key to success",
      "Entrepreneurship is my calling"
    ]
  },
  {
    username: 'maya_scientist',
    email: 'maya@example.com',
    interests: ['science', 'research', 'biology', 'discoveries'],
    style: 'analytical',
    messages: [
      "Science explains the wonders of our world",
      "Research is my passion",
      "Biology never ceases to amaze me",
      "Love making new discoveries",
      "Scientific method guides my thinking"
    ]
  },
  {
    username: 'jake_comedian',
    email: 'jake@example.com',
    interests: ['comedy', 'humor', 'stand-up', 'entertainment'],
    style: 'humorous',
    messages: [
      "Laughter is the best medicine",
      "I live for making people laugh",
      "Comedy is my way of connecting with others",
      "Working on my stand-up routine",
      "Humor makes life better"
    ]
  },
  {
    username: 'ava_yogi',
    email: 'ava@example.com',
    interests: ['yoga', 'meditation', 'mindfulness', 'wellness'],
    style: 'peaceful',
    messages: [
      "Yoga brings peace to my mind",
      "Meditation changed my life",
      "Mindfulness is everything",
      "Wellness is a journey, not a destination",
      "Finding balance through yoga"
    ]
  },
  {
    username: 'noah_mechanic',
    email: 'noah@example.com',
    interests: ['cars', 'mechanics', 'engineering', 'tools'],
    style: 'practical',
    messages: [
      "I love working with my hands",
      "Cars are mechanical poetry",
      "Engineering solutions is satisfying",
      "Nothing beats fixing something broken",
      "Tools are my best friends"
    ]
  },
  {
    username: 'chloe_dancer',
    email: 'chloe@example.com',
    interests: ['dance', 'choreography', 'movement', 'expression'],
    style: 'expressive',
    messages: [
      "Dance is my language",
      "Movement tells stories",
      "Choreography is visual poetry",
      "My body is my instrument",
      "Dance connects soul to rhythm"
    ]
  },
  {
    username: 'ethan_crypto',
    email: 'ethan@example.com',
    interests: ['cryptocurrency', 'blockchain', 'fintech', 'investing'],
    style: 'analytical',
    messages: [
      "Crypto is the future of finance",
      "Blockchain technology is revolutionary",
      "I'm passionate about decentralized systems",
      "Investing in the digital future",
      "DeFi is changing everything"
    ]
  },
  {
    username: 'grace_teacher',
    email: 'grace@example.com',
    interests: ['education', 'teaching', 'learning', 'students'],
    style: 'nurturing',
    messages: [
      "Teaching is my calling",
      "I love helping students learn",
      "Education opens doors",
      "Learning never stops",
      "Students inspire me every day"
    ]
  }
];

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];

// Create user account with retry logic
async function createUser(profile, attempt = 1) {
  try {
    console.log(`  Attempt ${attempt}/${MAX_RETRIES} for ${profile.username}...`);
    
    const response = await axios.post(`${SERVER_URL}/auth/signup`, {
      email: profile.email,
      password: 'password123',
      username: profile.username
    }, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.status === 'success') {
      console.log(`✓ Created user: ${profile.username}`);
      return response.data.token;
    } else {
      console.log(`✗ Failed to create user ${profile.username}: ${response.data.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    const statusCode = error.response?.status;
    const errorMsg = error.response?.data?.error || error.message;
    
    console.log(`✗ Error creating user ${profile.username} (attempt ${attempt}): ${statusCode} - ${errorMsg}`);
    
    // Retry on rate limit or server error
    if ((statusCode === 429 || statusCode === 503 || statusCode >= 500) && attempt < MAX_RETRIES) {
      console.log(`  Retrying in ${RETRY_DELAY/1000} seconds...`);
      await delay(RETRY_DELAY);
      return createUser(profile, attempt + 1);
    }
    
    return null;
  }
}

// Send chat messages to build profile
async function sendMessages(token, messages, username) {
  console.log(`  Sending ${messages.length} messages for ${username}...`);
  
  for (let i = 0; i < messages.length; i++) {
    try {
      const response = await axios.post(`${SERVER_URL}/social-chat`, {
        message: messages[i],
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`    ✓ Message ${i + 1}/${messages.length} sent`);
      await delay(500); // Small delay between messages
      
    } catch (error) {
      console.log(`    ✗ Failed to send message ${i + 1}: ${error.response?.data?.error || error.message}`);
    }
  }
}

// Force profile analysis
async function forceAnalysis(token, username) {
  try {
    const response = await axios.post(`${SERVER_URL}/matching/force-analysis`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log(`  ✓ Profile analysis completed for ${username}`);
    } else {
      console.log(`  ✗ Profile analysis failed for ${username}`);
    }
  } catch (error) {
    console.log(`  ✗ Analysis error for ${username}: ${error.response?.data?.error || error.message}`);
  }
}

// Main execution
async function generateUsers() {
  console.log(`🚀 Starting user generation for ${USERS_TO_CREATE} users...\n`);
  
  const selectedProfiles = USER_PROFILES.slice(0, USERS_TO_CREATE);
  
  for (let i = 0; i < selectedProfiles.length; i++) {
    const profile = selectedProfiles[i];
    console.log(`\n[${i + 1}/${selectedProfiles.length}] Processing ${profile.username}...`);
    
    // Create user account
    const token = await createUser(profile);
    if (!token) {
      continue;
    }
    
    // Send chat messages to build profile
    await sendMessages(token, profile.messages, profile.username);
    
    // Force profile analysis
    await forceAnalysis(token, profile.username);
    
    console.log(`✓ Completed ${profile.username}\n`);
    
    // Longer delay between users to be respectful to server
    await delay(3000);
  }
  
  console.log('\n🎉 User generation completed!');
  console.log('\nYou can now test the matching system with these diverse user profiles.');
  console.log('\nTo test matching, sign up with a new account and chat with Aether,');
  console.log('then visit the Connections screen to see your matches!');
}

// Test matching for a specific user
async function testMatching(username, password) {
  try {
    console.log(`\n🔍 Testing matching for ${username}...`);
    
    // Login
    const loginResponse = await axios.post(`${SERVER_URL}/auth/login`, {
      email: `${username}@example.com`,
      password: password
    });
    
    if (!loginResponse.data.success) {
      console.log(`✗ Failed to login as ${username}`);
      return;
    }
    
    const token = loginResponse.data.token;
    
    // Get matches
    const matchesResponse = await axios.get(`${SERVER_URL}/matching/find?limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (matchesResponse.data.success) {
      console.log(`✓ Found ${matchesResponse.data.matches.length} matches for ${username}:`);
      matchesResponse.data.matches.forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.user.username} (${Math.round(match.compatibility.score * 100)}% compatibility)`);
        console.log(`     Reasons: ${match.matchReasons.join(', ')}`);
      });
    } else {
      console.log(`✗ No matches found for ${username}`);
    }
    
  } catch (error) {
    console.log(`✗ Error testing matching: ${error.response?.data?.error || error.message}`);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === 'test') {
    // Test matching for a specific user
    const username = args[1] || 'alex_dev';
    const password = args[2] || 'password123';
    testMatching(username, password);
  } else {
    // Generate users
    generateUsers().catch(console.error);
  }
}

module.exports = { generateUsers, testMatching };