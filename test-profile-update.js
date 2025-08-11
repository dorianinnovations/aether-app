const axios = require('axios');

const API_BASE_URL = 'https://aether-server-j5kh.onrender.com';

// Test profile update endpoint
async function testProfileUpdate() {
  try {
    console.log('Testing profile update endpoint...');
    
    // Try without auth first to see the error
    const response = await axios.put(`${API_BASE_URL}/user/profile`, {
      displayName: 'Test Name',
      bio: 'Test Bio'
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    
    // If it's 401, that's expected (auth required)
    if (error.response?.status === 401) {
      console.log('✅ Endpoint exists and requires auth (expected)');
    } else if (error.response?.status === 404) {
      console.log('❌ Endpoint not found - this is the problem!');
    } else {
      console.log('❓ Unexpected error:', error.message);
    }
  }
}

// Test health endpoint
async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Server is running');
    console.log('Health response:', response.data);
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
  }
}

async function main() {
  await testHealth();
  console.log('---');
  await testProfileUpdate();
}

main();