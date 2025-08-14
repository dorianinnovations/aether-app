# Google OAuth Setup Guide

## Overview

This guide explains how to set up Google OAuth authentication for the Aether app.

## Backend Setup

### 1. Environment Variables

Add to your backend `.env` file:

```bash
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** or **Google Identity API**
4. Go to **APIs & Services > Credentials**
5. Create **OAuth 2.0 Client IDs** for:
   - **Web application** (for your backend)
   - **iOS application** (for the mobile app)
   - **Android application** (for the mobile app)

### 3. Configure OAuth Clients

#### Web Application Client (Backend)
- **Authorized JavaScript origins**: `http://localhost:5000`, `https://your-production-domain.com`
- **Authorized redirect URIs**: Not needed for server-side verification

#### iOS Application Client
- **Bundle ID**: `com.isaiahpappas.aether` (match your app.json)

#### Android Application Client
- **Package name**: `com.isaiahpappas.aether`
- **SHA-1 certificate fingerprint**: Get from your keystore

## Frontend Setup

### 1. Environment Variables

Create a `.env` file in the frontend directory:

```bash
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_ios_oauth_client_id_here
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

**Important**: Use the **iOS Client ID** for `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, not the web client ID.

### 2. Required Packages

The following packages are already installed:
- `expo-auth-session`
- `expo-crypto`

### 3. App Configuration

The `app.json` is already configured with:
- Expo AuthSession plugin
- Custom URL scheme: `aether`

## Testing

### 1. Test Backend Endpoint

```bash
curl -X POST http://localhost:5000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token": "your_google_id_token"}'
```

### 2. Test Frontend

1. Start the development server: `npm start`
2. Open the app on a physical device (Google OAuth doesn't work in simulator)
3. Tap the "Continue with Google" button
4. Complete the OAuth flow
5. Check if you're successfully logged in

## Troubleshooting

### Common Issues

1. **"Client ID not found"**: Make sure you're using the correct client ID for the platform
2. **"Unauthorized"**: Check that your bundle ID matches the one in Google Console
3. **"Invalid token"**: Ensure the backend can verify the token with the correct client ID

### Debug Tips

1. Check the logs in both frontend and backend
2. Verify the Google token is being passed correctly
3. Test the backend Google auth endpoint directly
4. Make sure Google APIs are enabled in your project

## Security Notes

1. Never commit your `.env` files to version control
2. Use different client IDs for development and production
3. Regularly rotate your OAuth credentials
4. Monitor OAuth usage in Google Cloud Console

## Production Deployment

1. Update authorized origins and redirect URIs in Google Console
2. Use production client IDs in your environment variables
3. Ensure HTTPS is enabled for your backend
4. Test the complete flow in your production environment