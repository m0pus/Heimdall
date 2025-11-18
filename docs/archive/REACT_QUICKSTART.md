# Himinbjörg - React Frontend Quick Start Guide

> **Himinbjörg** - A modern React-powered fork of Heimdall Application Dashboard

## 🚀 Quick Start

### 1. Install Dependencies

```bash
composer install  # PHP dependencies
npm install       # JavaScript dependencies
```

### 2. Setup Environment

```bash
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
```

### 3. Start Development Server

**One Command (Easiest):**
```bash
npm run dev  # Starts both Vite + Laravel automatically!
```

**Or Separately:**
```bash
# Terminal 1: Vite dev server (for HMR)
npm run dev:vite

# Terminal 2: Laravel
npm run dev:laravel
```

### 4. Access the Application

Open your browser to **http://localhost:8000**

The React app is automatically running with:
- ⚡ Hot Module Replacement (HMR) - changes appear instantly
- 🔄 Vite dev server on port 5173 (proxied through Laravel)
- 🚀 Laravel API on port 8000

## 📁 Project Structure

```
resources/js/
├── app.tsx              # React entry point
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── ItemTile.tsx
│   ├── ItemGrid.tsx
│   ├── SearchBar.tsx
│   └── TagList.tsx
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── Settings.tsx
│   └── Trash.tsx
├── hooks/              # React Query hooks
│   ├── useItems.ts
│   └── useTags.ts
├── api/                # API client
│   ├── client.ts
│   ├── items.ts
│   ├── tags.ts
│   └── applications.ts
├── store/              # Zustand state
│   └── dashboard.ts
├── lib/                # Utilities
│   └── utils.ts
└── types/              # TypeScript types
    └── index.ts
```

## 🔧 Setting Up a React Route

To use the React frontend for a specific route:

### Option 1: Update Existing Route

In `routes/web.php`, change an existing route to use the React view:

```php
Route::get('/', function () {
    return view('react');
});
```

### Option 2: Create New Route

```php
Route::get('/react-dashboard', function () {
    return view('react');
})->name('react.dashboard');
```

## 🎨 Development Workflow

### Adding a New Component

1. Create component file in `resources/js/components/`:

```tsx
// MyComponent.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  title: string;
  className?: string;
}

export default function MyComponent({ title, className }: MyComponentProps) {
  return (
    <div className={cn('p-4 bg-white rounded-lg', className)}>
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
  );
}
```

2. Import and use in your page:

```tsx
import MyComponent from '@/components/MyComponent';

export default function MyPage() {
  return <MyComponent title="Hello" />;
}
```

### Adding a New Page

1. Create page component in `resources/js/pages/`:

```tsx
// MyPage.tsx
import React from 'react';

export default function MyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <h1>My Page</h1>
    </div>
  );
}
```

2. Add route in `resources/js/app.tsx`:

```tsx
import MyPage from './pages/MyPage';

<Routes>
  <Route path="/my-page" element={<MyPage />} />
  {/* ... other routes */}
</Routes>
```

### Adding API Endpoints

1. Create API functions in `resources/js/api/`:

```typescript
// myApi.ts
import apiClient from './client';

export const myApi = {
  getData: async () => {
    const response = await apiClient.get('/api/my-data');
    return response.data;
  },
};
```

2. Create React Query hook in `resources/js/hooks/`:

```typescript
// useMyData.ts
import { useQuery } from '@tanstack/react-query';
import { myApi } from '@/api/myApi';

export function useMyData() {
  return useQuery({
    queryKey: ['myData'],
    queryFn: () => myApi.getData(),
  });
}
```

3. Use in component:

```tsx
import { useMyData } from '@/hooks/useMyData';

export default function MyComponent() {
  const { data, isLoading } = useMyData();

  if (isLoading) return <div>Loading...</div>;

  return <div>{/* render data */}</div>;
}
```

## 🎨 Styling with Tailwind

### Using Utility Classes

```tsx
<div className="bg-white p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow">
  <h2 className="text-xl font-bold text-gray-900">Title</h2>
  <p className="mt-2 text-gray-600">Description</p>
</div>
```

### Custom Classes

Define in `resources/css/app.css`:

```css
@layer components {
  .my-custom-class {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg;
  }
}
```

Use in component:

```tsx
<button className="my-custom-class">Click Me</button>
```

## 🔍 Common Tasks

### Fetching Data

```tsx
import { useItems } from '@/hooks/useItems';

function MyComponent() {
  const { data: items, isLoading, error } = useItems();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
}
```

### Mutating Data

```tsx
import { useCreateItem } from '@/hooks/useItems';

function MyComponent() {
  const createItem = useCreateItem();

  const handleCreate = () => {
    createItem.mutate({
      title: 'New Item',
      url: 'https://example.com',
      // ... other fields
    });
  };

  return (
    <button onClick={handleCreate} disabled={createItem.isPending}>
      {createItem.isPending ? 'Creating...' : 'Create Item'}
    </button>
  );
}
```

### Managing Local State

```tsx
import { useDashboardStore } from '@/store/dashboard';

function MyComponent() {
  const { editMode, toggleEditMode } = useDashboardStore();

  return (
    <button onClick={toggleEditMode}>
      {editMode ? 'Done' : 'Edit'}
    </button>
  );
}
```

## 🏗️ Building for Production

```bash
npm run build
```

This creates optimized bundles in `public/build/`.

## 🐛 Troubleshooting

### Module Not Found

Check import paths match the configured aliases in `tsconfig.json` and `vite.config.ts`:

```typescript
// These should work:
import { Button } from '@/components/Button';
import { useItems } from '@/hooks/useItems';
import { cn } from '@/lib/utils';
```

### TypeScript Errors

Run TypeScript check:

```bash
npx tsc --noEmit
```

### Vite HMR Not Working

1. Ensure dev server is running: `npm run dev`
2. Check `@vite` directive is in Blade template
3. Clear browser cache
4. Restart Vite dev server

### API Requests Failing

1. Check CSRF token in Blade layout:
   ```html
   <meta name="csrf-token" content="{{ csrf_token() }}">
   ```

2. Verify API routes exist in `routes/api.php`

3. Check Laravel logs: `storage/logs/laravel.log`

## 📚 Next Steps

1. **Explore Components** - Check out `resources/js/components/` for reusable components
2. **Review Types** - See `resources/js/types/index.ts` for data structures
3. **Read Full Docs** - See `FRONTEND_MODERNIZATION.md` for complete documentation
4. **Add Features** - Build on top of the existing foundation

## 💡 Tips

- Use the React DevTools browser extension for debugging
- Install the React Query DevTools (already included in dev mode)
- Use TypeScript's autocomplete for better DX
- Check the console for errors and warnings
- Use `console.log()` liberally while developing

## 🆘 Getting Help

1. Check `FRONTEND_MODERNIZATION.md` for detailed documentation
2. Review existing components for patterns
3. Consult React/TypeScript documentation
4. Open an issue on GitHub

---

Happy coding! 🎉
