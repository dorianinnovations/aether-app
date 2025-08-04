#!/usr/bin/env node

const axios = require('axios');

const SERVER_URL = 'https://aether-server-j5kh.onrender.com';

async function testSignup() {
  try {
    console.log('Testing signup...');
    
    const response = await axios.post(`${SERVER_URL}/auth/signup`, {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      username: `testuser${Date.now()}`
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error message:', error.message);
  }
}

testSignup();