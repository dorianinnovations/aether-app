#!/usr/bin/env node

/**
 * Mass generate 15 diverse users for matching testing
 */

const axios = require('axios');

const SERVER_URL = 'https://aether-server-j5kh.onrender.com';
const timestamp = Date.now();

const DIVERSE_USERS = [
  {
    username: `alex_coder_${timestamp}`,
    email: `alex${timestamp}@example.com`,
    messages: [
      "I love programming in JavaScript and React",
      "Web development is my passion",
      "Clean code and best practices are important",
      "I enjoy solving complex algorithms"
    ]
  },
  {
    username: `sarah_artist_${timestamp}`,
    email: `sarah${timestamp}@example.com`,
    messages: [
      "Art is my way of expressing creativity",
      "I love digital design and visual storytelling", 
      "Color theory fascinates me",
      "Creative projects bring me joy"
    ]
  },
  {
    username: `mike_gamer_${timestamp}`,
    email: `mike${timestamp}@example.com`,
    messages: [
      "Gaming is life, especially competitive esports",
      "Strategy games challenge my mind",
      "I love the gaming community",
      "FPS games are my specialty"
    ]
  },
  {
    username: `luna_reader_${timestamp}`,
    email: `luna${timestamp}@example.com`,
    messages: [
      "Books transport me to different worlds",
      "Philosophy and literature shape my thinking",
      "Reading is my favorite escape",
      "I love discussing deep topics"
    ]
  },
  {
    username: `david_athlete_${timestamp}`,
    email: `david${timestamp}@example.com`,
    messages: [
      "Fitness is my lifestyle and passion",
      "Running gives me mental clarity",
      "Health and nutrition are key",
      "I love helping others achieve fitness goals"
    ]
  },
  {
    username: `emma_chef_${timestamp}`,
    email: `emma${timestamp}@example.com`,
    messages: [
      "Cooking is my creative outlet",
      "I love experimenting with flavors",
      "Food brings people together",
      "Culinary arts is both science and art"
    ]
  },
  {
    username: `ryan_traveler_${timestamp}`,
    email: `ryan${timestamp}@example.com`,
    messages: [
      "Travel opens your mind to possibilities",
      "Photography captures my adventures",
      "Different cultures fascinate me",
      "Adventure is calling"
    ]
  },
  {
    username: `zoe_musician_${timestamp}`,
    email: `zoe${timestamp}@example.com`,
    messages: [
      "Music is the universal language",
      "Guitar is my first love",
      "Songwriting expresses my emotions",
      "Indie rock speaks to my soul"
    ]
  },
  {
    username: `tyler_biz_${timestamp}`,
    email: `tyler${timestamp}@example.com`,
    messages: [
      "Entrepreneurship is about solving problems",
      "Innovation drives everything I do",
      "Building teams is an art",
      "Every challenge is growth"
    ]
  },
  {
    username: `maya_scientist_${timestamp}`,
    email: `maya${timestamp}@example.com`,
    messages: [
      "Science reveals nature's beauty",
      "Research is my contribution to knowledge",
      "Biology never ceases to amaze me",
      "Discovery is the ultimate reward"
    ]
  },
  {
    username: `jake_comedian_${timestamp}`,
    email: `jake${timestamp}@example.com`,
    messages: [
      "Laughter is the best medicine",
      "Comedy helps people cope with life",
      "Making people laugh is my gift",
      "Humor reveals truth"
    ]
  },
  {
    username: `ava_yogi_${timestamp}`,
    email: `ava${timestamp}@example.com`,
    messages: [
      "Yoga brings balance to my life",
      "Meditation quiets the mind",
      "Mindfulness is presence in action",
      "Inner peace radiates outward"
    ]
  },
  {
    username: `noah_builder_${timestamp}`,
    email: `noah${timestamp}@example.com`,
    messages: [
      "Working with my hands is therapeutic",
      "Woodworking teaches patience",
      "Building from scratch is rewarding",
      "Craftsmanship is art"
    ]
  },
  {
    username: `chloe_dancer_${timestamp}`,
    email: `chloe${timestamp}@example.com`,
    messages: [
      "Dance is poetry in motion",
      "Movement expresses what words cannot",
      "Choreography is visual storytelling",
      "Dance connects body and soul"
    ]
  },
  {
    username: `ethan_tech_${timestamp}`,
    email: `ethan${timestamp}@example.com`,
    messages: [
      "Technology shapes our future",
      "AI will transform every industry",
      "Innovation requires vision and execution",
      "The future is being built today"
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
    
    if (response.data.status === 'success') {
      console.log(`✅ Created: ${profile.username}`);
      return response.data.token;
    } else {
      console.log(`❌ Failed: ${profile.username}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error: ${profile.username} - ${error.response?.status}`);
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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`  ✅ Message sent for ${username}`);
      await delay(500);
    } catch (error) {
      console.log(`  ❌ Message failed for ${username}`);
    }
  }
}

async function forceAnalysis(token, username) {
  try {
    await axios.post(`${SERVER_URL}/matching/force-analysis`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`  🧠 Analysis completed for ${username}`);
  } catch (error) {
    console.log(`  ❌ Analysis failed for ${username}`);
  }
}

async function massGenerate() {
  console.log('🚀 Mass generating 15 diverse users...\n');
  
  let successCount = 0;
  
  for (let i = 0; i < DIVERSE_USERS.length; i++) {
    const profile = DIVERSE_USERS[i];
    console.log(`\n[${i + 1}/15] Processing ${profile.username}...`);
    
    const token = await createUser(profile);
    if (!token) continue;
    
    await sendMessages(token, profile.messages, profile.username);
    await forceAnalysis(token, profile.username);
    
    successCount++;
    console.log(`✅ Completed ${profile.username}`);
    
    await delay(2000); // 2 second delay between users
  }
  
  console.log(`\n🎉 Generated ${successCount}/15 users successfully!`);
  console.log('\n✅ Ready to test matching!');
  console.log('Create a new account in the app, chat with Aether, then check Connections screen.');
}

massGenerate().catch(console.error);