# CLAUDE.md - AI Development Bible

## 🎯 PROJECT ESSENTIALS

**Project Name**: Aether App  
**Type**: React Native Mobile Application  
**Stack**: React Native 0.79.5, Expo SDK 53, TypeScript 5.8.3  
**Backend**: https://aether-server-j5kh.onrender.com  

## 🚨 CRITICAL COMMANDS (VERIFIED WORKING)

### Development Commands
```bash
# Start development server
npm start

# Platform-specific launches
npm run android
npm run ios  
npm run web

# Code Quality (ACTUALLY EXIST)
npm run lint       # ESLint with TypeScript
npm run typecheck  # TypeScript compilation check
```

### ❌ FAKE/NON-EXISTENT COMMANDS (DON'T USE THESE)
```bash
npm run test          # NO JEST CONFIGURED
npm run test:e2e      # NO DETOX INSTALLED
npm run test:coverage # NO TEST COVERAGE SETUP
npm run analyze       # NO BUNDLE ANALYZER
npm run build:profile # DOESN'T EXIST
```

## 📂 ACTUAL PROJECT STRUCTURE (VERIFIED)

```
src/
├── components/           # Legacy components (2 files)
│   ├── ConversationDrawer.tsx
│   └── ConversationList.tsx
├── design-system/        # ATOMIC DESIGN SYSTEM
│   ├── components/
│   │   ├── atoms/        # 24 UI primitives ✅
│   │   ├── molecules/    # 19 composite components ✅  
│   │   └── organisms/    # 9 complex components ✅
│   ├── hooks/           # 4 design system hooks
│   ├── tokens/          # Design tokens (colors, spacing, etc)
│   └── transitions/     # Animation definitions
├── hooks/               # 21 business logic hooks
├── screens/             # Application screens
│   ├── auth/           # Sign in/up screens
│   ├── chat/           # Chat + settings
│   ├── feed/           # Social feed
│   ├── insights/       # Analytics dashboard  
│   ├── onboarding/     # User onboarding
│   └── social/         # Social networking
├── services/           # API & business services
│   ├── api.ts          # Main API client
│   ├── apiModules/     # Modular API structure
│   ├── realTimeMessaging.ts
│   ├── sseService.ts   # Server-Sent Events
│   └── [12 other services]
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

## 🔧 DEVELOPMENT WORKFLOW

### Starting Development
```bash
# Always verify server connectivity first
node scripts/checkServer.js

# Start with tunnel for device testing
npm run tunnel

# Or standard local development  
npm start
```

### Code Quality Checks
```bash
# Run before every commit
npm run typecheck && npm run lint
```

### Testing Scripts (MANUAL TESTING ONLY)
```bash
# Manual API testing scripts
node scripts/testSignup.js
node scripts/testSocialCards.js
```

## 🏗️ ARCHITECTURE DEEP DIVE

### State Management
- **Context API**: ThemeContext, SettingsContext
- **AsyncStorage**: Persistent user preferences
- **Real-time**: Server-Sent Events (SSE) for live updates

### Navigation Structure
```
App.tsx
├── HeroLandingScreen (entry)
├── Auth Stack
│   ├── SignInScreen
│   └── SignUpScreen  
└── Main Stack
    ├── ChatScreen (AI conversations)
    ├── FeedScreen (social feed)
    ├── SocialScreen (community)
    ├── InsightsScreen (analytics)
    ├── ProfileScreen (user profile)
    └── FriendsScreen (connections)
```

### Design System Philosophy
- **Atomic Design**: Atoms → Molecules → Organisms
- **Neumorphic**: Subtle shadows and depth effects
- **Glassmorphism**: Blur effects throughout UI
- **Dual Theme**: Light/dark mode with system detection

## 🌐 API INTEGRATION

### Base Configuration
```typescript
BASE_URL: https://aether-server-j5kh.onrender.com
AUTH: JWT tokens with automatic refresh
REAL_TIME: Server-Sent Events (SSE)
```

### Key API Modules
- **auth.ts**: Authentication & user management
- **chat.ts**: AI conversation handling  
- **social.ts**: Social networking features
- **notifications.ts**: Real-time notifications
- **spotify.ts**: Spotify integration
- **user.ts**: User profile management

### File Upload Support
- **Images**: PNG, JPG, WEBP
- **Documents**: PDF, TXT, MD
- **Processing**: Multipart upload with preview

## 🎨 THEME & STYLING

### Color System
```typescript
// Light theme
primary: '#007AFF'
background: '#FFFFFF'
surface: '#F8F9FA'

// Dark theme  
primary: '#0A84FF'
background: '#000000'
surface: '#1C1C1E'
```

### Typography Stack
- **Primary**: Inter (UI text)
- **Code**: JetBrains Mono  
- **Headings**: Crimson Pro
- **Body**: Nunito

### Animation Framework
- **React Native Reanimated 3**: Hardware acceleration
- **Haptic Feedback**: iOS/Android native haptics
- **Lottie**: Complex animations (spinner, success states)

## 🔐 SECURITY IMPLEMENTATION

### Authentication Flow
1. JWT token storage in encrypted AsyncStorage
2. Automatic token refresh on API calls
3. Secure logout with token cleanup

### Data Protection
- Sensitive data encrypted at rest
- API requests over HTTPS only
- No credentials in source code

## ⚡ PERFORMANCE OPTIMIZATIONS

### Bundle Management
- **Code Splitting**: Dynamic imports for large screens
- **Image Optimization**: WebP format throughout
- **Font Loading**: Expo Google Fonts integration

### Memory Management
- FlatList virtualization for long lists
- Image caching with automatic cleanup
- Event listener cleanup in useEffect

## 🚀 BUILD & DEPLOYMENT

### Development Build
```bash
# Expo development build (local)
npm start

# Tunnel mode for device testing
npm run tunnel
```

### Production Considerations
- EAS Build configuration in `eas.json`
- Environment variables in `.env` files
- Asset optimization for app stores

## 🐛 DEBUGGING & TROUBLESHOOTING

### Common Issues
1. **Metro bundler cache**: `npx expo start --clear`
2. **Node modules**: `rm -rf node_modules && npm install`
3. **TypeScript errors**: Check `tsconfig.json` strict mode

### Logging Strategy
- Custom logger in `src/utils/logger.ts`
- Error boundary for crash reporting
- Network request logging in development

## 📱 PLATFORM-SPECIFIC NOTES

### iOS Specific
- Haptic feedback integration
- iOS-style navigation animations
- App Store compliance considerations

### Android Specific  
- Material Design compliance
- Android permissions handling
- Google Play Store requirements

### Web Specific
- React Native Web compatibility
- Browser-specific CSS handling
- Progressive Web App features

## 🔄 REAL-TIME FEATURES

### Server-Sent Events (SSE)
- Live chat messages
- Social feed updates
- Notification streaming
- Analytics data sync

### WebSocket Fallback
- Configured for environments without SSE support
- Automatic connection retry logic
- Connection state management

## 📊 ANALYTICS & MONITORING

### Built-in Analytics
- User behavior tracking
- Performance metrics
- Crash reporting
- Feature usage statistics

### Integration Points
- Custom metrics API endpoints
- Real-time dashboard updates
- Export functionality for reports

---

## ⚠️ DEVELOPMENT RULES

1. **ALWAYS** run `npm run typecheck` before commits
2. **NEVER** commit without running `npm run lint`
3. **CHECK** server connectivity with `node scripts/checkServer.js`
4. **USE** design system components instead of creating new ones
5. **FOLLOW** atomic design principles strictly
6. **TEST** on both iOS and Android before major changes
7. **DOCUMENT** any new environment variables
8. **MAINTAIN** this CLAUDE.md file religiously

## 🔄 LAST UPDATED
**Date**: 2025-08-07  
**Audited By**: Claude (Pedantic Documentation Enforcer)  
**Status**: ✅ VERIFIED ACCURATE

---
*This file is the SINGLE SOURCE OF TRUTH for AI development on this project. Every statement has been verified against actual code.*