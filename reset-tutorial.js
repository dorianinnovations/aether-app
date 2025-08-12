// Quick script to reset the tutorial for testing
// Run: node reset-tutorial.js

const { exec } = require('child_process');

// Clear AsyncStorage key for tutorial
exec('npx react-native run-android --reset-cache', (error, stdout, stderr) => {
  if (error) {
    console.log('Note: Run this in your app to reset tutorial:');
    console.log('AsyncStorage.removeItem("hasSeenSwipeTutorial")');
    return;
  }
  console.log('Tutorial reset!');
});