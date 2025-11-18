# API Response Format Fix

## Problem

When opening the "Add Tile" sidebar, the app was spamming the `/api/tags` endpoint and eventually hitting rate limits (429 errors).

### Error Messages

```
Query data cannot be undefined. Please make sure to return a value other than undefined from your query function. Affected query key: ["tags"]
Failed to load resource: the server responded with a status of 429 (Too Many Requests) (tags, line 0)
```

## Root Cause

The API endpoints were returning **inconsistent response formats**:

### Before (Inconsistent):

**Items and Tags endpoints** returned unwrapped data:
```json
[
  {"id": 1, "title": "App 1"},
  {"id": 2, "title": "App 2"}
]
```

**Applications endpoint** returned wrapped data:
```json
{
  "status": "success",
  "data": [
    {"appid": "plex", "name": "Plex"}
  ]
}
```

### The Issue

The frontend API clients (`resources/js/api/*.ts`) were expecting **all endpoints** to return wrapped responses with `response.data.data` structure:

```typescript
getAll: async (): Promise<Tag[]> => {
  const response = await apiClient.get<ApiResponse<Tag[]>>('/api/tags');
  return response.data.data;  // ❌ This was undefined for items/tags!
}
```

When the query function returned `undefined`, TanStack Query would:
1. Error and retry automatically
2. Continue retrying on every render
3. Create an infinite loop
4. Eventually hit rate limits (429 errors)

## Solution

### 1. Standardized All API Responses

Updated [routes/api.php](routes/api.php) to wrap all responses consistently:

```php
// ✅ After: All endpoints now return wrapped data
Route::get('/items', function() {
    $items = Item::where('deleted_at', null)
        ->where('type', 0)
        ->orderBy('order', 'asc')
        ->get();

    return response()->json([
        'status' => 'success',
        'data' => $items,
    ]);
});

Route::get('/tags', function() {
    $tags = \App\Item::where('type', 1)
        ->where('deleted_at', null)
        ->orderBy('order', 'asc')
        ->get();

    return response()->json([
        'status' => 'success',
        'data' => $tags,
    ]);
});
```

### 2. Added Query Client Safeguards

Updated [resources/js/app.tsx](resources/js/app.tsx#L11-L22) to prevent excessive refetching:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,      // ✅ Added
      refetchOnReconnect: false,  // ✅ Added
      retry: 1,
      retryDelay: 1000,           // ✅ Added - wait 1s between retries
    },
  },
});
```

## Changes Made

### Files Modified:
- ✅ [routes/api.php](routes/api.php) - Wrapped all items and tags endpoints
- ✅ [resources/js/app.tsx](resources/js/app.tsx) - Added query client safeguards

### API Endpoints Updated:
- ✅ `GET /api/items` - Returns `{status, data}`
- ✅ `GET /api/items/{id}` - Returns `{status, data}`
- ✅ `POST /api/items` - Returns `{status, data}`
- ✅ `PUT /api/items/{id}` - Returns `{status, data}`
- ✅ `DELETE /api/items/{id}` - Returns `{status, data: null}`
- ✅ `GET /api/items/{id}/refresh` - Returns `{status, data: null}`
- ✅ `GET /api/tags` - Returns `{status, data}`
- ✅ `GET /api/tags/{id}` - Returns `{status, data}`
- ✅ `POST /api/tags` - Returns `{status, data}`
- ✅ `PUT /api/tags/{id}` - Returns `{status, data}`
- ✅ `DELETE /api/tags/{id}` - Returns `{status, data: null}`

## Result

- ✅ No more infinite query loops
- ✅ No more 429 rate limit errors
- ✅ Add Tile form loads correctly
- ✅ Tags dropdown populates properly
- ✅ Consistent API contract across all endpoints

## API Response Contract

All API endpoints now follow this contract:

```typescript
interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T | null;
  message?: string;  // Optional, for errors
}
```

This ensures that:
1. Frontend can reliably access `response.data.data`
2. Error handling is consistent
3. TanStack Query always receives valid data (never undefined)
