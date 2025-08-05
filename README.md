# Aether Mobile App

A sophisticated React Native application combining AI-powered conversations, emotional analytics, social networking, and beautiful neumorphic design.

## 🚀 Core Features

### 🤖 AI Chat Assistant
- Real-time streaming conversations with advanced AI
- Server-Sent Events (SSE) for live response streaming
- Context-aware responses with conversation memory
- File attachments and multimedia support
- Conversation history management with delete functionality

### 📊 Analytics & Insights
- Real-time emotional metrics tracking
- Personal behavioral pattern analysis
- Interactive data visualizations and trend charts
- Historical analytics with detailed insights dashboard

### 🌐 Social Platform
- Modular social feed with real-time updates
- Community-based post categorization
- Like, comment, and share functionality with optimistic updates
- Advanced search and filtering capabilities
- Real-time Server-Sent Events integration

### 🎨 Advanced Design System
- **Atomic Design Architecture**: Atoms, Molecules, Organisms
- **Dual Theme Support**: Light/Dark themes with glassmorphic effects
- **Neumorphic Design**: Subtle shadows and depth throughout
- **Advanced Animations**: React Native Reanimated with 60fps performance
- **Comprehensive Design Tokens**: Colors, spacing, typography, shadows

## 🏗️ Architecture

### Project Structure
```
src/
├── components/
│   └── ConversationDrawer.tsx       # Complex conversation management (1,715 lines)
├── constants/                       # App-wide configuration and API endpoints
├── contexts/
│   ├── SettingsContext.tsx         # Global settings management
│   └── ThemeContext.tsx            # Theme system with persistence
├── design-system/
│   ├── components/
│   │   ├── atoms/                   # Basic UI elements
│   │   │   ├── AnimatedHamburger.tsx
│   │   │   ├── BlurModal.tsx
│   │   │   ├── LottieLoader.tsx
│   │   │   ├── RainbowShimmerText.tsx
│   │   │   └── [15+ more atoms]
│   │   ├── molecules/               # Component combinations
│   │   │   ├── EnhancedChatInput.tsx
│   │   │   ├── EnhancedBubble.tsx
│   │   │   ├── SocialCard.tsx
│   │   │   └── [10+ more molecules]
│   │   └── organisms/               # Complex UI sections
│   │       ├── Header.tsx           # Advanced header with menu system
│   │       ├── HeaderMenu.tsx       # Animated dropdown menu
│   │       └── [5+ more organisms]
│   ├── hooks/                       # Design system hooks
│   ├── tokens/                      # Centralized design tokens
│   │   ├── colors.ts               # Extensive pastel palette
│   │   ├── spacing.ts              # Responsive spacing system
│   │   ├── typography.ts           # Font families and text styles
│   │   └── shadows.ts              # Neumorphic shadow system
│   └── transitions/                 # Custom navigation transitions
├── hooks/                           # Custom React hooks
│   ├── useGreeting.ts              # Dynamic greeting system
│   ├── useMessages.ts              # Chat message management
│   ├── useSocialCards.ts           # Social content management
│   └── [15+ more hooks]
├── screens/
│   ├── auth/
│   │   ├── SignInScreen.tsx        # Authentication with validation
│   │   └── SignUpScreen.tsx        # User registration flow
│   ├── chat/
│   │   ├── ChatScreen.tsx          # Main chat interface
│   │   └── SettingsModal.tsx       # Chat configuration
│   ├── feed/
│   │   └── FeedScreen.tsx          # Social feed interface
│   ├── insights/
│   │   └── InsightsScreen.tsx      # Analytics dashboard
│   ├── social/                     # Modular social platform
│   │   ├── SocialScreen.tsx        # Main container (220 lines vs original 1,521)
│   │   ├── components/             # Reusable social components
│   │   ├── hooks/                  # Social data management
│   │   ├── types/                  # TypeScript interfaces
│   │   ├── constants/              # Static data and configuration
│   │   └── utils/                  # Helper functions
│   ├── HeroLandingScreen.tsx       # Onboarding screen
│   ├── ProfileScreen.tsx           # User profile management
│   └── FriendsScreen.tsx          # Social connections
├── services/
│   ├── api.ts                      # Centralized API service
│   ├── StreamEngine.ts             # SSE streaming engine
│   ├── sseService.ts              # Server-Sent Events integration
│   ├── streaming.ts               # Chat streaming logic
│   └── [8+ more services]
├── types/                          # Centralized TypeScript definitions
│   ├── navigation.ts              # Navigation type definitions
│   ├── social.ts                  # Social platform types
│   ├── chat.ts                    # Chat-related types
│   └── [5+ more type files]
└── utils/                          # Shared utilities
    ├── formatting.ts              # Data formatting utilities
    ├── validation.ts              # Input validation
    ├── theme.ts                   # Theme utilities
    └── [10+ more utilities]
```

### Key Architectural Decisions

#### Navigation Structure
- **Root Stack**: Manages authenticated/unauthenticated states
- **Auth Stack**: Hero → Onboarding → SignIn/SignUp flow
- **Main Stack**: Chat → Friends → Profile → Feed navigation
- **Custom Transitions**: Smooth color fade animations between screens

#### State Management
- **React Context**: Global theme, settings, and authentication state
- **Local State**: Component-specific UI interactions
- **Persistent Storage**: AsyncStorage for user preferences and conversation history
- **Real-time Updates**: Server-Sent Events for live data synchronization

#### Social Platform (Modular Architecture)
The social platform demonstrates advanced architectural patterns:
- **Separation of Concerns**: Business logic isolated in custom hooks
- **Component Reusability**: Atomic design enables easy composition
- **Real-time Integration**: SSE for live updates with optimistic UI
- **Type Safety**: Comprehensive TypeScript interfaces throughout
- **Performance**: Code splitting and optimized rendering

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Studio

### Setup
```bash
git clone <repository-url>
cd aether-app
npm install
```

### Development Commands
```bash
# Core Development
npm start                    # Start Expo development server
npm run android             # Run on Android emulator
npm run ios                 # Run on iOS simulator
npm run web                 # Run on web browser

# Code Quality
npm run typecheck           # TypeScript type checking (use frequently)
npm run lint               # ESLint code analysis
npm test                   # Jest unit tests
npm run test:watch         # Tests in watch mode
npm run test:coverage      # Generate coverage report

# Single Test Execution
npm test -- --testNamePattern="specific test name"
npm test -- src/__tests__/specific-file.test.tsx
```

### Testing Strategy
- **Integration Tests**: Complete user flow testing
- **Component Tests**: Screen-level testing with React Native Testing Library
- **Unit Tests**: Service and utility function testing
- **Type Safety**: TypeScript strict mode with comprehensive coverage

## 🔗 Backend Integration

### API Architecture
- **Base URL**: https://aether-server-j5kh.onrender.com (Render.com deployment)
- **Authentication**: JWT token-based with automatic refresh
- **Streaming**: Server-Sent Events for real-time chat responses
- **File Upload**: Multipart form data for attachments
- **Error Handling**: Comprehensive retry logic and user feedback

### Service Integration
- **Chat Streaming**: Real-time AI conversation responses
- **Analytics API**: Emotional metrics collection and analysis
- **Social API**: Posts, likes, comments, and real-time updates
- **User Management**: Authentication, profiles, and preferences

## 🎨 Design System

### Theme System
- **Light/Dark Themes**: Automatic system preference detection
- **Color Palette**: Extensive pastel colors with semantic mapping
- **Typography**: Inter, Nunito, and Crimson Pro font families
- **Spacing**: Consistent 8px grid system with responsive scaling

### Visual Effects
- **Glassmorphism**: Blur and transparency effects throughout UI
- **Neumorphism**: Subtle shadows and depth for modern feel
- **Animations**: Smooth micro-interactions with native performance
- **Responsive Design**: Adaptive layouts for various screen sizes

## 📱 Performance Optimizations

- **FlatList Optimization**: Conversation history with virtualization
- **Image Caching**: Lazy loading and efficient memory management
- **Bundle Optimization**: Code splitting and tree shaking
- **Animation Performance**: Native driver usage for 60fps
- **Memory Management**: Proper cleanup of subscriptions and timers

## 🔒 Security

- **Token Management**: Secure JWT storage and automatic refresh
- **API Security**: Request validation and sanitization
- **Local Storage**: Encrypted sensitive data storage
- **Navigation Guards**: Protected routes for authenticated content

## 🚀 Deployment

### Build Configuration
- **Expo EAS**: Managed builds for iOS and Android
- **Environment Variables**: Development, staging, and production configs
- **Over-the-Air Updates**: Rapid iteration without app store releases
- **Bundle Analysis**: Size optimization and performance monitoring

### Platform Support
- **iOS**: Native iOS app with optimized performance
- **Android**: Material Design compliance with native features
- **Web**: Progressive Web App capabilities (development)

## 📊 Monitoring & Analytics

- **Performance Tracking**: Real-time performance metrics
- **Error Reporting**: Comprehensive crash and error logging
- **User Analytics**: Behavioral pattern analysis
- **A/B Testing**: Feature flag support for experimentation

## 🎯 Recent Improvements

### Navigation Enhancement
- **Fixed Logo Navigation**: Resolved "Hero screen not found" error by updating navigation target from `Hero` to `Chat` for authenticated users
- **Improved Error Handling**: Better fallback mechanisms for navigation failures

### Code Quality
- **Debug Cleanup**: Removed development console.log statements
- **Comment Optimization**: Cleaned up completed TODOs and commented-out code
- **Type Safety**: Enhanced TypeScript coverage across all modules

### Modular Social Platform
- **Architecture Refactor**: Converted monolithic 1,521-line component into modular 220-line container
- **Performance Optimization**: Better code splitting and render optimization
- **Real-time Features**: Advanced SSE integration with optimistic updates

## 💻 Technology Stack

- **Framework**: React Native 0.72+ with Expo SDK 49+
- **Language**: TypeScript 5.0+ (strict mode)
- **Navigation**: React Navigation 6 with custom transitions
- **Styling**: StyleSheet with design tokens and theme system
- **Animations**: React Native Reanimated 3 with native driver
- **State Management**: React Context API with persistent storage
- **Testing**: Jest + React Native Testing Library + Detox
- **Icons**: Feather, MaterialCommunityIcons, FontAwesome5
- **Development Tools**: ESLint, Prettier, TypeScript compiler
- **Backend Communication**: Axios with interceptors, SSE integration

## 📄 License

Private project - All rights reserved.

---

*Built with ❤️ using React Native and modern development practices.*