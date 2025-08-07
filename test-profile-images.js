/**
 * Test Profile Image Endpoints
 * Frontend API service test for profile photo and banner uploads
 */

import { UserAPI } from './src/services/apiModules/endpoints/user.js';

async function testProfileImageEndpoints() {
  console.log('🧪 Testing Profile Image Endpoints...\n');

  try {
    // Test 1: Get profile images (should be empty initially)
    console.log('1️⃣ Testing GET /user/images...');
    const initialImages = await UserAPI.getProfileImages();
    console.log('✅ Initial images:', JSON.stringify(initialImages, null, 2));

    // Test 2: Upload profile photo (simulated)
    console.log('\n2️⃣ Testing profile photo upload...');
    // Note: In a real React Native app, this would be an actual file URI
    const mockImageUri = 'file://mock-profile-photo.jpg';
    
    try {
      const uploadResult = await UserAPI.uploadProfilePicture(mockImageUri);
      console.log('✅ Profile photo upload:', JSON.stringify(uploadResult, null, 2));
    } catch (error) {
      console.log('ℹ️ Profile photo upload test (expected to fail in Node.js):', error.message);
    }

    // Test 3: Upload banner image (simulated) 
    console.log('\n3️⃣ Testing banner image upload...');
    const mockBannerUri = 'file://mock-banner-image.jpg';
    
    try {
      const bannerResult = await UserAPI.uploadBannerImage(mockBannerUri);
      console.log('✅ Banner image upload:', JSON.stringify(bannerResult, null, 2));
    } catch (error) {
      console.log('ℹ️ Banner image upload test (expected to fail in Node.js):', error.message);
    }

    // Test 4: Get updated profile images
    console.log('\n4️⃣ Testing GET /user/images after uploads...');
    try {
      const updatedImages = await UserAPI.getProfileImages();
      console.log('✅ Updated images:', JSON.stringify(updatedImages, null, 2));
    } catch (error) {
      console.log('ℹ️ Get images test:', error.message);
    }

    // Test 5: Delete profile photo
    console.log('\n5️⃣ Testing profile photo deletion...');
    try {
      const deleteResult = await UserAPI.deleteProfilePicture();
      console.log('✅ Profile photo deleted:', JSON.stringify(deleteResult, null, 2));
    } catch (error) {
      console.log('ℹ️ Profile photo deletion test:', error.message);
    }

    // Test 6: Delete banner image
    console.log('\n6️⃣ Testing banner image deletion...');
    try {
      const deleteBannerResult = await UserAPI.deleteBannerImage();
      console.log('✅ Banner image deleted:', JSON.stringify(deleteBannerResult, null, 2));
    } catch (error) {
      console.log('ℹ️ Banner image deletion test:', error.message);
    }

    console.log('\n🎉 Profile Image API Tests Complete!');
    
    // Display endpoint summary
    console.log('\n📋 Available Endpoints:');
    console.log('• POST /user/profile-photo - Upload profile photo (≤1MB)');
    console.log('• POST /user/banner-image - Upload banner image (≤1MB)');
    console.log('• GET /user/images - Get current profile images');
    console.log('• DELETE /user/profile-photo - Remove profile photo');
    console.log('• DELETE /user/banner-image - Remove banner image');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testProfileImageEndpoints();
}

export { testProfileImageEndpoints };