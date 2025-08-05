# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
npm start                    # Start Expo development server
npm run android             # Run on Android emulator
npm run ios                 # Run on iOS simulator
npm run web                 # Run on web browser
```

### Code Quality
```bash
npm run typecheck           # Run TypeScript type checking (use this frequently)
npm run lint               # Run ESLint code analysis
npm test                   # Run Jest unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate test coverage report
```

### Single Test Execution
```bash
npm test -- --testNamePattern="specific test name"
npm test -- src/__tests__/specific-file.test.tsx
```

## Architecture Overview

### Design System Foundation
This codebase follows **atomic design principles** with a sophisticated design system:
- **Atoms** (`src/design-system/components/atoms/`): Basic UI elements (buttons, inputs, icons, loaders)
- **Molecules** (`src/design-system/components/molecules/`): Component combinations (chat bubbles, cards, inputs)  
- **Organisms** (`src/design-system/components/organisms/`): Complex UI sections (headers, modals, navigation)
- **Design Tokens** (`src/design-system/tokens/`): Centralized styling system with colors, spacing, typography, shadows

### State Architecture
- **Global State**: React Context API for theme, settings, authentication
- **Theme System**: Dual-theme support (light/dark) with glassmorphic and neumorphic effects
- **Settings**: Persistent storage using AsyncStorage with centralized context
- **Real-time State**: Server-Sent Events for live data synchronization

### API Integration Pattern
- **Base API**: `src/services/api.ts` contains centralized axios instance with authentication
- **Streaming Chat**: Real-time Server-Sent Events (SSE) for AI conversations
- **Error Handling**: Comprehensive error boundaries and retry logic
- **Backend URL**: https://aether-server-j5kh.onrender.com (Render.com deployment)

## Key Architectural Decisions

### Navigation Architecture
The app uses a sophisticated three-tier navigation structure:

#### Root Stack Navigator
- **Purpose**: Manages authenticated/unauthenticated states
- **States**: `Auth` (unauthenticated) → `MainStack` (authenticated)
- **Authentication Flow**: Token-based with automatic state detection

#### Auth Stack Navigator (`AuthStack`)
- **Initial Route**: `Hero` (HeroLandingScreen)
- **Flow**: Hero → Onboarding → SignIn/SignUp
- **Screens Available**: `Hero`, `Onboarding`, `SignIn`, `SignUp`
- **Important**: Hero screen only exists in AuthStack, not MainStack

#### Main Stack Navigator (`MainStack`) 
- **Available Screens**: `Chat`, `Friends`, `Profile`, `Feed`
- **Initial Focus**: Chat (main application screen)
- **Navigation**: All authenticated user navigation happens here
- **Important**: Logo navigation should target `Chat`, not `Hero`

### Screen Architecture

#### ChatScreen.tsx
- **Core Functionality**: Primary chat interface with AI streaming
- **Key Features**: 
  - Real-time message streaming via SSE
  - Conversation history management
  - File attachment support
  - Typing indicators and animations
  - Settings modal integration

#### ConversationDrawer.tsx (1,715 lines)
- **Complex Component**: Comprehensive conversation history management
- **Features**:
  - Real-time conversation loading from server
  - Delete/clear functionality with confirmation
  - HTTP events integration for real-time updates
  - Advanced styling and button layouts
  - Message synchronization with backend

#### Social Platform Architecture (Modular Design)
**Major Refactor**: Converted monolithic 1,521-line component into modular architecture

```
src/screens/social/
├── SocialScreen.tsx         # Main container (220 lines vs original 1,521)
├── components/              # Reusable UI components (Atomic Design)
│   ├── CommunityChip.tsx   # Community selection atom
│   └── index.ts            # Component exports
├── hooks/                   # Custom React hooks for data management
│   ├── useSocialData.ts    # Posts loading, caching, auto-refresh
│   ├── useRealTimeUpdates.ts # Server-Sent Events integration
│   ├── usePostActions.ts   # Like/share/comment with optimistic updates
│   └── index.ts            # Hook exports
├── types/                   # TypeScript interfaces
├── constants/               # Static data (communities, colors, tabs)
├── utils/                   # Helper functions (color getters, filtering)
└── index.ts                # Module exports
```

**Architectural Benefits**:
- **Separation of Concerns**: Business logic isolated in custom hooks
- **Component Reusability**: Atomic design enables easy composition
- **Type Safety**: Comprehensive TypeScript interfaces throughout
- **Real-time Updates**: SSE integration with optimistic UI updates
- **Performance**: Better code splitting and render optimization
- **Scalability**: Easy to add features without touching existing code

#### Authentication Screens
- **SignInScreen.tsx**: Comprehensive sign-in with validation and error handling
- **SignUpScreen.tsx**: User registration flow with Hero navigation fallback
- **Navigation Pattern**: Both screens can navigate to `Hero` when in AuthStack

#### Enhanced Components
- **EnhancedChatInput**: Advanced input with attachments, voice recording, file upload
- **Header.tsx**: Advanced header with menu system and **logo navigation to Chat screen**
- **HeaderMenu.tsx**: Animated dropdown with glassmorphic effects

### Organized Modular Structure

#### TypeScript Definitions (`src/types/`)
```
types/
├── analytics.ts            # Analytics and metrics types
├── api.ts                  # API request/response interfaces
├── chat.ts                 # Chat-related type definitions
├── navigation.ts           # Navigation parameter lists
├── social.ts              # Social platform interfaces
├── ui.ts                  # UI component prop types
├── user.ts                # User profile and authentication types
└── index.ts               # Centralized type exports
```

#### Utilities (`src/utils/`)
```
utils/
├── animations.ts          # Animation utilities and constants
├── conversationAnalyzer.ts # Chat analysis and sentiment detection
├── formatting.ts          # Data formatting and display utilities
├── logger.ts             # Logging utilities and error tracking
├── navigation.ts         # Navigation helpers and guards
├── placeholderMessages.ts # Default messages and content
├── promptTemplates.ts    # AI prompt generation templates
├── rateLimitHandler.ts   # API rate limiting and retry logic
├── storage.ts            # AsyncStorage helpers and encryption
├── storageCleanup.ts     # Data cleanup and optimization
├── theme.ts              # Theme utilities and color helpers
├── validation.ts         # Input validation and sanitization
└── index.ts              # Utility exports
```

#### Constants (`src/constants/`)
- **Centralized Configuration**: API endpoints, app settings, theme colors
- **Environment Management**: Development, staging, production configs
- **Static Data**: Default values, placeholder content, configuration objects

#### Custom Hooks (`src/hooks/`)
```
hooks/
├── useGreeting.ts         # Dynamic greeting system with user personalization
├── useMessages.ts         # Chat message management and history
├── useSocialCards.ts      # Social content management with caching
├── useSocialProxy.ts      # Social platform API integration
├── useConversationEvents.ts # Real-time conversation event handling
├── useKeyboard.ts         # Keyboard behavior and animation management
├── useSettings.ts         # Global settings management
├── useTheme.ts           # Theme management and persistence
└── [10+ more hooks]       # Specialized functionality hooks
```

### Styling System
- **Theme Colors**: Extensive pastel color palette with semantic color mapping
- **Glassmorphism**: Blur and transparency effects throughout the UI
- **Neumorphism**: Subtle shadow and depth effects for modern feel
- **Animation**: React Native Reanimated for smooth micro-interactions
- **Design Tokens**: Centralized spacing, typography, colors, and shadows

### Testing Strategy
- **Integration Tests**: User flow testing in `src/__tests__/integration/`
- **Component Tests**: Screen-level testing with React Native Testing Library
- **Unit Tests**: Utility function testing and service testing
- **Type Safety**: TypeScript strict mode with comprehensive coverage

### Performance Considerations
- **FlatList Optimization**: Conversation history uses optimized rendering with virtualization
- **Image Caching**: Lazy loading and caching for profile pictures and media
- **Bundle Optimization**: Code splitting and memory leak prevention
- **Animation Performance**: Native driver usage for 60fps animations
- **Real-time Optimization**: Efficient SSE handling with cleanup

## Critical Development Guidelines

### Navigation Development
- **Logo Navigation**: Always navigates to `Chat` screen (not `Hero`) from authenticated state
- **Screen Availability**: `Hero` screen only exists in `AuthStack`, not `MainStack`
- **Error Handling**: Implement fallback navigation patterns for edge cases
- **Custom Transitions**: Use established color fade transitions between screens

### API Service Usage
Always use the centralized API service in `src/services/api.ts`. It handles:
- Authentication token management with automatic refresh
- Request/response interceptors with error handling
- Base URL configuration and environment management
- Retry logic and comprehensive error reporting

### Design System Compliance
- **Use Design Tokens**: All styling must use tokens from `src/design-system/tokens/`
- **Follow Atomic Design**: Create components following atoms → molecules → organisms pattern
- **Maintain Theme Support**: All UI elements must support light/dark themes
- **Use Established Patterns**: Follow existing color palette and spacing system

### Message/Chat Development
- **Streaming Pattern**: All chat responses use Server-Sent Events (SSE) via StreamEngine
- **Conversation Management**: Integrate with ConversationDrawer for history management
- **Message Rendering**: Support markdown with custom styling via EnhancedBubble
- **Real-time Sync**: Maintain conversation history synchronization with backend
- **Error Handling**: Implement comprehensive error boundaries for streaming failures

### Social Platform Development
When working with the social platform (`src/screens/social/`):
- **Use Custom Hooks**: Leverage `useSocialData`, `useRealTimeUpdates`, and `usePostActions`
- **Component Composition**: Build features by composing existing atoms and molecules
- **Real-time Integration**: Utilize Server-Sent Events for live updates via `useRealTimeUpdates`
- **Optimistic Updates**: Implement optimistic UI updates for better user experience
- **Type Safety**: All components must use TypeScript interfaces from `types/index.ts`
- **Constants**: Use predefined colors, communities, and configurations from `constants/`
- **Modular Architecture**: Keep components focused and single-responsibility
- **Performance**: Consider code splitting and lazy loading for new organisms

### Code Quality Requirements
- **TypeScript Strict Mode**: All code must pass TypeScript strict compilation
- **ESLint Compliance**: Follow React Native best practices via ESLint configuration
- **Proper Typing**: Component props must use proper TypeScript interfaces
- **Test Coverage**: Maintain test coverage for new functionality
- **Clean Code**: Remove debug logs, personal comments, and unused code before commits

### Recent Architecture Updates

#### Navigation Fix (Latest)
- **Issue Resolved**: "Hero screen not found" navigation error
- **Solution**: Updated logo press handler from `navigation.navigate('Hero')` to `navigation.navigate('Chat')`
- **Location**: `src/design-system/components/organisms/Header.tsx:321`
- **Context**: Logo navigation now correctly targets main authenticated screen

#### Code Cleanup (Latest)
- **Debug Cleanup**: Removed development console.log statements from:
  - `src/hooks/useGreeting.ts:125`
  - `src/services/StreamEngine.ts:117,165`
  - `src/screens/chat/ChatScreen.tsx:365,390`
- **Comment Optimization**: Cleaned up completed TODOs and commented-out code
- **Unused Code**: Removed commented-out auto-refresh intervals and imports

#### Social Platform Refactor
- **Migration**: Converted monolithic `ConnectionsScreen.tsx` (1,521 lines) to modular architecture
- **Performance**: Reduced main container to 220 lines with improved render optimization
- **Maintainability**: Separated concerns into custom hooks and reusable components
- **Scalability**: Easy feature addition without modifying existing code

## Important Architecture Notes

### File Organization Priority
1. **Always prefer editing existing files** over creating new ones
2. **Use established patterns** from existing components and hooks
3. **Follow the modular architecture** established in social platform
4. **Maintain atomic design principles** throughout the codebase

### Performance Best Practices
- **FlatList Usage**: Use optimized FlatList for all list rendering
- **Native Driver**: Always use native driver for animations where possible
- **Memory Management**: Properly cleanup subscriptions, timers, and listeners
- **Bundle Size**: Consider code splitting for large feature additions

### Security Considerations
- **Token Management**: Never expose JWT tokens in logs or debug statements
- **Input Validation**: Use established validation utilities for all user inputs
- **API Security**: All API calls must go through centralized service with interceptors
- **Local Storage**: Use encrypted storage for sensitive data

This is a production-grade React Native application with sophisticated architecture, comprehensive testing, modular design patterns, and professional development practices. Always maintain these standards when making modifications or additions.