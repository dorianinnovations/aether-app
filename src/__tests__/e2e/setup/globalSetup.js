/**
 * Global Setup for E2E Tests
 * Runs once before all tests in the suite
 */
/* eslint-disable no-console */

const axios = require('axios');

module.exports = async () => {
  console.log('🚀 Starting global E2E test setup...');
  
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://aether-server-j5kh.onrender.com';
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 5000; // 5 seconds
  
  // Wait for server to be available
  console.log(`🔗 Checking server availability at ${API_BASE_URL}...`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept 4xx as "server available"
      });
      
      console.log(`✅ Server is available (status: ${response.status})`);
      break;
      
    } catch (error) {
      console.log(`⚠️  Server check attempt ${attempt}/${MAX_RETRIES} failed:`, error.code || error.message);
      
      if (attempt === MAX_RETRIES) {
        console.error('❌ Server is not available after maximum retries');
        console.error('Please ensure the Aether server is running before running E2E tests');
        throw new Error(`Server not available at ${API_BASE_URL}`);
      }
      
      console.log(`⏱️  Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  // Test critical endpoints
  try {
    console.log('🔍 Testing critical endpoints...');
    
    const criticalEndpoints = [
      { path: '/health', name: 'Health Check' },
      { path: '/auth/check-username/test123', name: 'Username Check' }
    ];
    
    for (const endpoint of criticalEndpoints) {
      try {
        await axios.get(`${API_BASE_URL}${endpoint.path}`, { timeout: 5000 });
        console.log(`   ✅ ${endpoint.name}`);
      } catch (error) {
        if (error.response && error.response.status < 500) {
          console.log(`   ✅ ${endpoint.name} (${error.response.status})`);
        } else {
          console.log(`   ⚠️  ${endpoint.name} may have issues`);
        }
      }
    }
    
  } catch (error) {
    console.warn('⚠️  Some critical endpoints may not be fully available');
  }
  
  // Set global test configuration
  global.__E2E_CONFIG__ = {
    API_BASE_URL,
    SERVER_AVAILABLE: true,
    SETUP_TIMESTAMP: new Date().toISOString()
  };
  
  console.log('✅ Global E2E test setup completed successfully');
  console.log(`📊 Test suite starting at ${global.__E2E_CONFIG__.SETUP_TIMESTAMP}`);
};