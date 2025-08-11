# Toast System

Global toast notification system for consistent user feedback across the entire app.

## Features

- **Perfect Positioning**: Matches header location exactly
- **Lightning Fast**: 2x speed animations (150ms in, 125ms out)
- **4 Toast Types**: Success, Error, Warning, Info with themed colors
- **Auto-dismiss**: Smart durations based on message importance
- **Theme Aware**: Adapts to light/dark mode automatically
- **Global Access**: Available on any screen

## Usage

### Basic Usage

```typescript
import { useToast } from '../design-system/components/organisms';

const MyScreen = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleAction = () => {
    showSuccess('Operation completed successfully!'); // 3 seconds, green
    showError('Something went wrong!');               // 5 seconds, red  
    showWarning('Please check your connection');     // 4 seconds, yellow
    showInfo('New update available');                // 4 seconds, blue
  };
};
```

### Advanced Usage

```typescript
const { showToast } = useToast();

showToast({
  message: 'Custom toast message',
  type: 'success',
  duration: 2000,           // Custom duration in ms
  position: 'top',          // 'top' or 'bottom'
  showCloseButton: false    // Hide close button
});
```

## Toast Types

| Type | Duration | Color | Icon |
|------|----------|-------|------|
| `success` | 3 seconds | Green | check-circle |
| `error` | 5 seconds | Red | alert-circle |
| `warning` | 4 seconds | Yellow | alert-triangle |
| `info` | 4 seconds | Blue | info |

## Implementation

The toast system is globally available through:
- **ToastProvider** wraps the entire app in `App.tsx`
- **Toast component** positioned to match header exactly
- **useToast hook** provides easy access from any screen

No setup required - just import and use!