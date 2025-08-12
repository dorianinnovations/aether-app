# Aether App - Claude Development Context

## Project Overview

Aether is a sophisticated AI-powered mobile application built with React Native and Expo, featuring real-time AI conversations, personal analytics, and intelligent networking capabilities. The application emphasizes premium user experience through neumorphic design principles and advanced interaction patterns.

## Technology Stack

### Core Framework
- **React Native**: 0.79.5 with Expo 53
- **TypeScript**: 5.8 with strict mode enforcement
- **Node.js**: 18+ required for development
- **React**: 19.0.0 with latest hooks and concurrent features

### Navigation & UI
- **React Navigation**: 7.x stack and bottom tab navigation
- **React Native Reanimated**: 3.17.4 for hardware-accelerated animations
- **React Native Gesture Handler**: Touch interactions and gestures
- **Expo Linear Gradient**: Advanced gradient effects

### State Management & Data
- **React Context**: Theme and settings management
- **AsyncStorage**: Persistent local storage
- **Axios**: HTTP client for API communications
- **Socket.io**: Real-time messaging capabilities

### Development Tools
- **ESLint**: TypeScript and React Native rule enforcement
- **TypeScript Compiler**: Strict type checking with noEmit flag
- **Expo CLI**: Development server and build tooling
- **Metro**: React Native bundler and development server

## Architecture Patterns

### Design System Structure
The application follows atomic design principles with a comprehensive design system:

```
src/design-system/
├── components/
│   ├── atoms/          # Basic UI elements (Button, Input, Badge)
│   ├── molecules/      # Component combinations (ChatInput, MetricCard)
│   └── organisms/      # Complex sections (Header, ProfileCard)
├── tokens/             # Design tokens (colors, typography, spacing)
├── hooks/              # Design system hooks
└── transitions/        # Animation configurations
```

### Application Architecture
```
src/
├── components/         # Shared application components
├── contexts/          # React contexts (ThemeContext, SettingsContext)
├── hooks/             # Custom application hooks
├── screens/           # Screen components organized by feature
├── services/          # API services and utilities
├── types/             # TypeScript type definitions
└── utils/             # Helper functions and utilities
```

## Key Features & Screens

### Authentication Flow
- **HeroLandingScreen**: Animated onboarding with Lottie animations
- **SignInScreen**: Secure authentication with form validation
- **SignUpScreen**: User registration with password strength validation
- **OnboardingScreen**: User preference setup and feature introduction

### Core Application
- **ChatScreen**: Real-time AI conversations with streaming responses
- **BuzzScreen**: Live news aggregation with priority indicators
- **ProfileScreen**: User settings and customization
- **InsightsScreen**: Personal analytics and pattern visualization

### Navigation Structure
Stack-based navigation with conditional rendering based on authentication state:
- Unauthenticated: Landing → Auth flows
- Authenticated: Bottom tab navigation between core features

## Development Commands

### Verified Commands
```bash
# Development
npm start              # Start Expo development server
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run in web browser

# Code Quality
npm run lint          # ESLint with TypeScript rules
npm run typecheck     # TypeScript compilation check
```

### Testing Scripts
```bash
# Manual Testing
node scripts/checkServer.js        # Backend connectivity verification
node scripts/testSignup.js         # User registration flow testing
node scripts/testSocialCards.js    # Social features validation
```

## API Integration

### Service Architecture
Modular API service structure with centralized client management:

```
src/services/apiModules/
├── core/              # Base client and error handling
├── endpoints/         # Feature-specific API endpoints
└── utils/             # Request utilities and storage
```

### Key Services
- **Authentication**: Token-based auth with refresh handling
- **Real-time Messaging**: WebSocket and SSE connections
- **Analytics**: User behavior tracking and insights
- **File Processing**: Image upload and attachment handling
- **Spotify Integration**: Music service connectivity

## Design System & Theming

### Typography System
- **Crimson Pro**: Elegant serif for headings and branding
- **Inter**: Clean sans-serif for body text and UI
- **Nunito**: Rounded sans-serif for friendly contexts
- **JetBrains Mono**: Monospace for code and technical content

### Color System
Sophisticated color palette with light/dark theme support:
- **Primary**: Deep blues and teals for brand identity
- **Secondary**: Warm accents for highlighting
- **Neutral**: Comprehensive gray scale for backgrounds
- **Semantic**: Success, warning, error, and info colors

### Component Patterns
- **Neumorphic Design**: Subtle shadows and highlights
- **Glass Morphism**: Transparent backgrounds with blur effects
- **Haptic Feedback**: Touch interactions with native feedback
- **Smooth Animations**: Hardware-accelerated transitions

## State Management

### Context Providers
- **ThemeContext**: Light/dark mode and color scheme management
- **SettingsContext**: User preferences and application settings
- **ToastProvider**: Global notification system

### Local Storage
- **AsyncStorage**: Persistent user preferences and auth tokens
- **Settings Storage**: Type-safe settings persistence
- **Cache Management**: Efficient data caching strategies

## Real-time Features

### Streaming Technologies
- **Server-Sent Events**: Live AI response streaming
- **WebSocket**: Real-time messaging and presence
- **Socket.io**: Advanced real-time event handling

### Live Data Updates
- **Message Streaming**: Real-time AI conversation updates
- **Presence Indicators**: User online status
- **Notification Stream**: Live system notifications

## Error Handling & Logging

### Error Management
- **Centralized Error Handler**: Consistent error processing
- **API Error Mapping**: User-friendly error messages
- **Retry Logic**: Automatic retry for transient failures
- **Offline Handling**: Graceful degradation without connectivity

### Development Debugging
- **Logger Service**: Structured logging for development
- **Error Boundaries**: React error containment
- **Debug Modes**: Development-only debugging features

## Performance Optimization

### Rendering Optimization
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Expensive calculation memoization
- **Native Driver**: Hardware-accelerated animations
- **Image Optimization**: Efficient image loading and caching

### Bundle Optimization
- **Tree Shaking**: Unused code elimination
- **Code Splitting**: Dynamic import strategies
- **Asset Optimization**: Image and font compression

## Security Considerations

### Authentication Security
- **Token Management**: Secure storage and rotation
- **API Security**: Encrypted communications with backend
- **Input Validation**: Comprehensive form security
- **Data Privacy**: User information protection

### Development Security
- **Environment Variables**: Secure configuration management
- **API Key Protection**: Prevent exposure in client code
- **Dependency Auditing**: Regular security updates

## Development Workflow

### Code Quality
- **TypeScript Strict Mode**: Maximum type safety
- **ESLint Configuration**: Comprehensive linting rules
- **Import Organization**: Consistent import structure
- **File Naming**: Clear and consistent conventions

### Testing Strategy
- **Manual Testing Scripts**: Critical flow validation
- **Type Safety**: Compile-time error prevention
- **Integration Testing**: Backend connectivity verification
- **User Journey Testing**: End-to-end flow validation

## Deployment & Distribution

### Build Configuration
- **EAS Build**: Production builds for iOS and Android
- **Expo Application Services**: App store distribution
- **Over-the-Air Updates**: Seamless feature deployment

### Environment Management
- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Live application deployment

## Known Patterns & Conventions

### Component Structure
- **Props Interface**: TypeScript interfaces for all props
- **Default Props**: Sensible defaults where applicable
- **Component Export**: Named exports with index files
- **Styling Patterns**: StyleSheet with design tokens

### Hook Patterns
- **Custom Hooks**: Reusable logic extraction
- **State Management**: Consistent useState patterns
- **Effect Cleanup**: Proper useEffect cleanup
- **Performance Hooks**: Memoization strategies

### File Organization
- **Feature-based**: Group related files by feature
- **Index Exports**: Clean import paths
- **Type Definitions**: Centralized type management
- **Utility Functions**: Reusable helper functions

## Recent Development Focus

### Current Features
- **Live News Integration**: Real-time content aggregation in BuzzScreen
- **Enhanced Analytics**: Improved user behavior tracking
- **UI/UX Improvements**: Refined design system components
- **Performance Optimizations**: Reduced bundle size and load times

### Technical Debt & Improvements
- **Component Refactoring**: Ongoing design system consolidation
- **Type Safety**: Continued TypeScript coverage expansion
- **Performance Monitoring**: Real-time performance metrics
- **Error Handling**: Enhanced error recovery mechanisms

This documentation provides comprehensive context for development work on the Aether application. When making changes, always consider the established patterns, maintain type safety, and follow the design system principles.