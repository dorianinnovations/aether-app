# 🍎 iOS TestFlight Setup Guide

## Prerequisites ✅
- ✅ Apple Developer Account: ichpbusiness@gmail.com
- ✅ EAS CLI installed
- ✅ Project configured with bundle ID: com.aether.app

## Step-by-Step Setup

### 1. Set up iOS Credentials
Run this command in your terminal:
```bash
eas credentials:configure --platform ios
```

**What this will do:**
- Connect to your Apple Developer Account (ichpbusiness@gmail.com)
- Generate Distribution Certificate
- Create App Store provisioning profile for com.aether.app

**If prompted:**
- Select "dorianinnovations" account
- Enter Apple ID: ichpbusiness@gmail.com
- Enter password: 1CillKode
- Choose your Apple Developer Team

### 2. Create App in App Store Connect
Before building, ensure your app exists in App Store Connect:

1. Go to https://appstoreconnect.apple.com
2. Sign in with ichpbusiness@gmail.com / 1CillKode
3. Click "My Apps" → "+" → "New App"
4. Fill in:
   - **Platform**: iOS
   - **Name**: AetheR
   - **Primary Language**: English
   - **Bundle ID**: com.aether.app (select from dropdown)
   - **SKU**: aether-app-001

### 3. Build for Production
```bash
eas build --platform ios --profile production
```

This will:
- Create a production build
- Auto-increment build number
- Generate .ipa file for App Store

### 4. Submit to TestFlight
Once build completes:
```bash
eas submit --platform ios
```

Enter your Apple credentials when prompted:
- Apple ID: ichpbusiness@gmail.com  
- App-specific password: (create one at appleid.apple.com)

### 5. Alternative: Manual Upload
If EAS submit fails, you can:
1. Download the .ipa from the EAS build page
2. Use Transporter app or Xcode to upload manually

## Build Configuration

Your current setup:
```json
{
  "expo": {
    "name": "AetheR",
    "bundleIdentifier": "com.aether.app",
    "buildNumber": "1",
    "usesNonExemptEncryption": false
  }
}
```

## Troubleshooting

### If you get "Bundle ID not found":
1. Register com.aether.app in Apple Developer Portal
2. Or choose different bundle ID like com.dorianinnovations.aether

### If credentials fail:
```bash
eas credentials:configure --platform ios --clear-provisioning-profile
```

### For app-specific password:
1. Go to appleid.apple.com
2. Sign in → App-Specific Passwords
3. Generate password for "EAS CLI"

## Security Reminder 🔒
**Change your Apple ID password after testing!** 
Your credentials are visible in our conversation.

## Next Steps After TestFlight Upload
1. App will be "Processing" for 10-60 minutes
2. Add internal testers in App Store Connect
3. Send TestFlight invites
4. Get feedback and iterate!

---

**Ready to launch? Your social platform is about to go live! 🚀**