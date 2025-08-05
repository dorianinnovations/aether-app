# CRITICAL BUG: Modal/Drawer Infinite Recursion - Maximum Call Stack Exceeded

## Issue Summary
**Status**: CRITICAL - App completely unusable  
**Error**: `RangeError: Maximum call stack size exceeded, js engine: hermes`  
**Affected Components**: HeaderMenu, ConversationDrawer, possibly other modals  
**User Impact**: Cannot open header menu, cannot open conversation drawer, app crashes

## Problem Description
The app crashes with infinite recursion when attempting to open:
- Header menu (hamburger button)
- Conversation drawer (chat history)
- Potentially other modal components

**Root Cause**: React hooks dependency hell - `useCallback` + `useEffect` creating circular dependencies

## Technical Details

### What Happened
Recent changes introduced `shouldRender` state management pattern to modals, but the implementation created circular dependencies:

1. `useCallback` functions depend on state/refs
2. `useEffect` depends on these functions
3. Functions change → Effect runs → State changes → Re-render → Functions recreate → Loop

### Files Involved
- `src/design-system/components/organisms/HeaderMenu.tsx` 
- `src/design-system/components/organisms/ConversationDrawer.tsx`
- `src/design-system/hooks/useHeaderMenu.ts`

### Current State
**Partial fixes attempted**:
- Added missing `friends` navigation case in `useHeaderMenu.ts`
- Removed `useCallback` from animation functions
- Fixed dependency arrays

**Status**: Still failing - recursion persists

## Reproduction Steps
1. Start app
2. Try to open header menu (hamburger icon)
3. App crashes with stack overflow
4. Same happens with conversation drawer

## Required Fix Strategy

### Immediate Actions Needed
1. **Revert the `shouldRender` pattern entirely** - go back to simple `visible` prop
2. **Remove all `useCallback` from animation functions** - they don't need memoization
3. **Simplify state management** - avoid complex state transitions in modals

### Files to Investigate/Fix
```
src/design-system/components/organisms/HeaderMenu.tsx
src/design-system/components/organisms/ConversationDrawer.tsx  
src/design-system/components/atoms/BlurModal.tsx
src/design-system/components/organisms/MetricDetailModal.tsx
src/screens/chat/ChatScreen.tsx (HeaderMenu usage)
```

### Code Pattern to Remove
**BAD** (current):
```typescript
const [shouldRender, setShouldRender] = useState(false);

const showMenu = useCallback(() => {
  // animation logic
}, [dependencies]);

useEffect(() => {
  if (visible) {
    setShouldRender(true);
    showMenu();
  } else {
    hideMenu();
  }
}, [visible, showMenu, hideMenu]); // <- CIRCULAR DEPENDENCY
```

**GOOD** (target):
```typescript
// Simple pattern - no shouldRender state needed
const showMenu = () => {
  // animation logic - no useCallback needed
};

useEffect(() => {
  if (visible) {
    showMenu();
  } else {
    hideMenu();
  }
}, [visible]); // <- Only depend on prop

// OR even simpler - no effects at all, just call directly in handlers
```

## Success Criteria
- [ ] Header menu opens without crash
- [ ] Conversation drawer opens without crash  
- [ ] No console errors about maximum call stack
- [ ] All modal animations work smoothly
- [ ] TypeScript compilation passes
- [ ] No ESLint hook dependency warnings

## Testing Instructions
1. `npm run typecheck` - must pass
2. Test header menu functionality
3. Test conversation drawer functionality  
4. Test on device (not just simulator)
5. Check for any other affected modals

## Priority
**CRITICAL** - This blocks all modal functionality in the app. User cannot access core features.

## Notes for Next Developer
- The issue is NOT the modal logic itself - it's React hooks optimization gone wrong
- Don't try to be clever with `useCallback` and complex dependency arrays
- Sometimes the simplest solution (regular functions) is the best
- Consider removing `shouldRender` pattern entirely and using simple `visible` prop
- The animation timing doesn't need to be perfect - working is better than broken

## Environment
- React Native with Hermes JS engine
- Expo development build
- Device testing shows same behavior as simulator

---
**Created**: 2025-08-05  
**Severity**: Critical - App Unusable  
**Component**: Modal System  
**Tags**: react-hooks, infinite-recursion, modal, critical-bug