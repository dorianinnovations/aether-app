/**
 * Global Teardown for E2E Tests
 * Runs once after all tests in the suite
 */

const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🧹 Starting global E2E test teardown...');
  
  try {
    // Generate test execution summary
    const config = global.__E2E_CONFIG__ || {};
    const endTime = new Date().toISOString();
    
    const summary = {
      testSuiteStart: config.SETUP_TIMESTAMP,
      testSuiteEnd: endTime,
      serverUrl: config.API_BASE_URL,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform
    };
    
    // Save summary to reports directory
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const summaryPath = path.join(reportsDir, 'test-execution-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('📊 Test execution summary saved to:', summaryPath);
    
    // Display execution summary
    console.log('\n📋 E2E Test Execution Summary:');
    console.log('=' .repeat(50));
    console.log(`   Started: ${summary.testSuiteStart}`);
    console.log(`   Ended: ${summary.testSuiteEnd}`);
    console.log(`   Server: ${summary.serverUrl}`);
    console.log(`   Environment: ${summary.environment}`);
    console.log(`   Node Version: ${summary.nodeVersion}`);
    console.log(`   Platform: ${summary.platform}`);
    
    const duration = new Date(endTime) - new Date(config.SETUP_TIMESTAMP || endTime);
    console.log(`   Total Duration: ${Math.round(duration / 1000)}s`);
    
    // Cleanup any global resources
    if (global.__E2E_CLEANUP_TASKS__) {
      console.log('🔧 Running cleanup tasks...');
      
      for (const task of global.__E2E_CLEANUP_TASKS__) {
        try {
          await task();
        } catch (error) {
          console.warn('⚠️  Cleanup task failed:', error.message);
        }
      }
    }
    
    console.log('✅ Global E2E test teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown encountered errors:', error);
    // Don't throw - we don't want teardown errors to fail the test suite
  }
  
  // Final message
  console.log('\n🎯 E2E Test Suite Execution Complete!');
  console.log('📁 Check the reports directory for detailed results');
};