/**
 * Test script to debug grails saving functionality
 */

const axios = require('axios');

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

async function testGrails() {
  try {
    console.log('🧪 Testing grails functionality...\n');

    // You'll need to replace this with a valid auth token
    const authToken = 'YOUR_AUTH_TOKEN_HERE'; // Get this from your app's storage
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Test data
    const testGrails = {
      topTracks: [
        {
          id: "test1",
          name: "Test Song 1",
          artist: "Test Artist 1",
          album: "Test Album 1",
          imageUrl: "https://example.com/image1.jpg",
          spotifyUrl: "https://open.spotify.com/track/test1"
        }
      ],
      topAlbums: [
        {
          id: "test2",
          name: "Test Album 2",
          artist: "Test Artist 2",
          imageUrl: "https://example.com/image2.jpg",
          spotifyUrl: "https://open.spotify.com/album/test2"
        }
      ]
    };

    console.log('📤 Saving grails...');
    console.log('Data:', JSON.stringify(testGrails, null, 2));
    
    const saveResponse = await axios.post(`${API_URL}/spotify/grails`, testGrails, { headers });
    console.log('✅ Save response:', saveResponse.data);

    console.log('\n📥 Fetching grails...');
    const getResponse = await axios.get(`${API_URL}/spotify/grails`, { headers });
    console.log('✅ Get response:', getResponse.data);

  } catch (error) {
    console.error('❌ Error testing grails:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Note: Replace YOUR_AUTH_TOKEN_HERE with a valid token before running
console.log('⚠️  Before running this test:');
console.log('1. Make sure you\'re logged in to the app');
console.log('2. Get your auth token from the app');
console.log('3. Replace YOUR_AUTH_TOKEN_HERE in this script\n');

if (process.argv.includes('--run')) {
  testGrails();
} else {
  console.log('Add --run flag to execute the test');
}