# Frontend Logging

Himinbjörg includes a configurable logging system for the frontend to help with debugging and monitoring in different environments.

## Quick Start

```typescript
import { logger } from '@/lib/logger';

// Debug - detailed diagnostics (development only)
logger.debug('Component', 'State updated', { newState });

// Info - general information
logger.info('API', 'Request sent to /api/items');

// Warn - non-critical issues
logger.warn('Validation', 'Missing optional field', { field: 'description' });

// Error - critical issues
logger.error('Network', 'Failed to fetch data', error);
```

## Log Levels

The logger supports five verbosity levels:

| Level   | When to Use | Visible In |
|---------|------------|------------|
| `debug` | Detailed diagnostics, state changes, function calls | Development only (default) |
| `info`  | General information, successful operations | Development & Staging |
| `warn`  | Non-critical issues, deprecation warnings | All environments |
| `error` | Critical failures, exceptions | All environments (default in production) |
| `none`  | Disable all logging | Special cases only |

## Configuration

### Environment Variable

Set the log level in your `.env` file:

```env
VITE_LOG_LEVEL=debug   # Development
VITE_LOG_LEVEL=warn    # Production
```

### Runtime Configuration

Change the log level at runtime via browser console:

```javascript
// Set to debug mode
logger.setLevel('debug');

// Check current level
logger.getLevel(); // returns 'debug', 'info', 'warn', 'error', or 'none'

// Disable all logging
logger.setLevel('none');
```

The log level is persisted to `localStorage` and survives page refreshes.

## Default Behavior

- **Development** (`npm run dev`): Defaults to `debug` level
- **Production** (`npm run build`): Defaults to `warn` level
- Priority: localStorage > VITE_LOG_LEVEL > default

## Best Practices

### 1. Use Appropriate Contexts

The first argument is the context (component/module name):

```typescript
// ✅ Good - clear context
logger.debug('ItemTile', 'Rendering tile', { item });
logger.info('Dashboard', 'Items loaded', { count });

// ❌ Bad - vague context
logger.debug('Component', 'Something happened');
```

### 2. Include Relevant Data

Pass additional context as arguments:

```typescript
// ✅ Good - includes useful data
logger.error('API', 'Failed to create item', {
  url: '/api/items',
  status: response.status,
  error: error.message
});

// ❌ Bad - no context
logger.error('API', 'Request failed');
```

### 3. Don't Log Sensitive Data

Never log passwords, tokens, or personal information:

```typescript
// ❌ NEVER do this
logger.debug('Auth', 'Login attempt', {
  username,
  password  // ⚠️ Security risk!
});

// ✅ Do this instead
logger.debug('Auth', 'Login attempt', {
  username,
  passwordLength: password.length
});
```

### 4. Use Debug for Verbose Logging

Keep production logs clean by using debug for detailed diagnostics:

```typescript
// Debug level - won't show in production
logger.debug('Tooltip', 'Position calculated', {
  top: position.top,
  left: position.left,
  rect: triggerRect
});

// Info level - shows in development & staging
logger.info('Items', 'Successfully loaded items', {
  count: items.length
});
```

## Examples

### Component Lifecycle

```typescript
export default function Dashboard() {
  onMount(() => {
    logger.debug('Dashboard', 'Component mounted');
  });

  onCleanup(() => {
    logger.debug('Dashboard', 'Component cleaned up');
  });

  // ...
}
```

### API Requests

```typescript
async function fetchItems() {
  try {
    logger.debug('API', 'Fetching items from /api/items');

    const response = await fetch('/api/items');

    if (!response.ok) {
      logger.warn('API', 'Items fetch returned non-OK status', {
        status: response.status,
        statusText: response.statusText
      });
    }

    const data = await response.json();
    logger.info('API', 'Items fetched successfully', {
      count: data.length
    });

    return data;
  } catch (error) {
    logger.error('API', 'Failed to fetch items', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}
```

### State Changes

```typescript
const [items, setItems] = createSignal<Item[]>([]);

const addItem = (item: Item) => {
  logger.debug('ItemStore', 'Adding item', {
    itemId: item.id,
    itemTitle: item.title
  });

  setItems(prev => [...prev, item]);

  logger.debug('ItemStore', 'Item added', {
    totalCount: items().length
  });
};
```

### Error Boundaries

```typescript
<ErrorBoundary
  fallback={(err) => {
    logger.error('ErrorBoundary', 'Caught error in component tree', {
      error: err.message,
      stack: err.stack,
      componentStack: err.componentStack
    });

    return <ErrorView error={err} />;
  }}
>
  <App />
</ErrorBoundary>
```

## Console Output

The logger uses styled console output for better readability:

- **Debug**: Gray text
- **Info**: Blue text, bold
- **Warn**: Yellow/orange text, bold (uses console.warn)
- **Error**: Red text, bold (uses console.error)

Example output:
```
[ItemTile] Rendering tile { item: { id: 1, title: 'Plex' } }
[Dashboard] Items loaded { count: 12 }
[API] Request sent to /api/items
```

## Browser DevTools Integration

The logger is available globally in the browser console:

```javascript
// Access logger from console
window.logger.setLevel('debug');
window.logger.getLevel();
```

This is useful for debugging production issues without rebuilding.

## TypeScript Support

The logger is fully typed:

```typescript
import { logger, type LogLevel } from '@/lib/logger';

const level: LogLevel = 'debug'; // 'debug' | 'info' | 'warn' | 'error' | 'none'
logger.setLevel(level);
```

## Performance

- Log level checks are fast (simple number comparison)
- Disabled log levels have near-zero overhead
- In production builds with `none` level, tree-shaking can remove unused log calls
- Use debug level freely - it won't impact production performance
