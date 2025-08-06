#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Server health check script
 */

const axios = require('axios');

const SERVER_URL = 'https://aether-server-j5kh.onrender.com';

async function checkHealth() {
  console.log('🔍 Checking server health...\n');
  
  // Test basic connection
  try {
    console.log('Testing basic connection...');
    const response = await axios.get(`${SERVER_URL}/`, { timeout: 10000 });
    console.log(`✓ Basic connection: ${response.status} - ${response.data}`);
  } catch (error) {
    console.log(`✗ Basic connection failed: ${error.response?.status} - ${error.message}`);
  }
  
  // Test health endpoint
  try {
    console.log('\nTesting health endpoint...');
    const response = await axios.get(`${SERVER_URL}/health`, { timeout: 10000 });
    console.log(`✓ Health check: ${response.status}`);
    console.log('Health data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`✗ Health check failed: ${error.response?.status} - ${error.message}`);
  }
  
  // Test auth endpoint availability
  try {
    console.log('\nTesting auth endpoint...');
    const response = await axios.post(`${SERVER_URL}/auth/signup`, {
      email: 'test@test.com',
      password: 'test123',
      username: 'testuser'
    }, { timeout: 10000 });
    console.log(`Auth endpoint response: ${response.status}`);
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.log(`Auth endpoint: ${status} - ${data?.error || error.message}`);
    
    if (status === 400 && data?.error?.includes('already exists')) {
      console.log('✓ Auth endpoint is working (user already exists)');
    } else if (status === 503) {
      console.log('✗ Server is unavailable (503)');
    }
  }
}

checkHealth();