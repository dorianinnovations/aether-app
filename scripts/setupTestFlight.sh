#!/bin/bash

# iOS TestFlight Setup Script
# This script will guide you through setting up iOS builds

echo "🍎 iOS TestFlight Setup"
echo "======================"
echo ""
echo "This script will help you set up your iOS app for TestFlight distribution."
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
else
    echo "✅ EAS CLI found: $(eas --version)"
fi

echo ""
echo "📱 Step 1: Configure iOS Credentials"
echo "This will connect to your Apple Developer Account and set up certificates."
echo ""
echo "Run: eas credentials:configure --platform ios"
echo ""

echo "🔨 Step 2: Start iOS Build"
echo "After credentials are set up, build for production:"
echo ""
echo "Run: eas build --platform ios --profile production"
echo ""

echo "📋 Step 3: Submit to TestFlight"
echo "Once the build completes, submit to TestFlight:"
echo ""
echo "Run: eas submit --platform ios"
echo ""

echo "💡 Tips:"
echo "- Make sure you have a valid Apple Developer Account"
echo "- The bundle ID 'com.aether.app' must be registered in App Store Connect"
echo "- You may need to create an app in App Store Connect first"
echo ""

echo "🚀 Your app will be available for TestFlight testing once approved!"