# Frontend Development Guide

## Overview

Himinbjörg uses **SolidJS** for the frontend - a modern, reactive framework that compiles to highly optimized vanilla JavaScript.

## Why SolidJS?

- **⚡ Performance**: Fine-grained reactivity (no virtual DOM)
- **📦 Small Bundle**: ~7kb runtime
- **🎯 TypeScript**: First-class TypeScript support
- **🔄 React-like**: Familiar JSX syntax
- **🚀 Fast**: Outperforms React, Vue, Svelte in benchmarks

## Tech Stack

- **Framework**: SolidJS 1.9
- **Language**: TypeScript 5.9
- **Routing**: @solidjs/router
- **State Management**: TanStack Query (Solid)
- **Styling**: Tailwind CSS 3.4
- **Build Tool**: Vite 6
- **HTTP Client**: Axios

## Project Structure

```
resources/js/
├── api/                    # API clients
│   ├── client.ts          # Axios instance
│   ├── items.ts           # Items API
│   ├── tags.ts            # Tags API
│   ├── settings.ts        # Settings API
│   └── index.ts           # Exports
│
├── components/             # Reusable components
│   ├── Button.tsx         # Button component
│   ├── ItemCard.tsx       # Tile card
│   ├── ItemForm.tsx       # Add/edit form
│   ├── ItemGrid.tsx       # Grid with drag-drop
│   ├── SearchBar.tsx      # Search component
│   ├── TagList.tsx        # Tag navigation
│   └── settings/          # Settings components
│       ├── SettingField.tsx
│       ├── SettingGroup.tsx
│       ├── TextSetting.tsx
│       ├── SelectSetting.tsx
│       ├── BooleanSetting.tsx
│       ├── ImageSetting.tsx
│       └── TextareaSetting.tsx
│
├── lib/                    # Utilities
│   ├── i18n.ts            # Translation system
│   ├── colorExtractor.ts  # Color extraction
│   └── utils.ts           # Helper functions
│
├── pages/                  # Page components
│   ├── Dashboard.tsx      # Main dashboard
│   └── Settings.tsx       # Settings page
│
├── queries/                # TanStack Query hooks
│   ├── items.ts           # Item queries/mutations
│   ├── tags.ts            # Tag queries
│   └── settings.ts        # Settings queries
│
├── store/                  # Global state
│   └── dashboard.ts       # Dashboard state
│
├── types/                  # TypeScript types
│   └── index.ts           # Type definitions
│
└── app.tsx                 # App entry point
```

## Core Concepts

### Signals (Reactive State)

```typescript
import { createSignal } from 'solid-js';

// Create signal
const [count, setCount] = createSignal(0);

// Read value
console.log(count());  // 0

// Update value
setCount(1);
setCount(c => c + 1);

// In JSX (auto-subscribes)
<div>{count()}</div>  // Updates automatically
```

### Effects (Side Effects)

```typescript
import { createEffect } from 'solid-js';

createEffect(() => {
  console.log('Count is:', count());
  // Runs when count() changes
});
```

### Memos (Derived State)

```typescript
import { createMemo } from 'solid-js';

const doubled = createMemo(() => count() * 2);

// Only recomputes when count() changes
<div>{doubled()}</div>
```

### Show Component (Conditional Rendering)

```typescript
import { Show } from 'solid-js';

<Show
  when={user()}
  fallback={<div>Loading...</div>}
>
  <div>Hello, {user()!.name}</div>
</Show>
```

### For Component (Lists)

```typescript
import { For } from 'solid-js';

<For each={items()}>
  {(item) => <ItemCard item={item} />}
</For>
```

## State Management

### Local State (Signals)

For component-local state:

```typescript
export default function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count()}
    </button>
  );
}
```

### Global State (Store)

For shared state across components:

```typescript
// store/dashboard.ts
import { createSignal } from 'solid-js';

export const [editMode, setEditMode] = createSignal(false);
export const toggleEditMode = () => setEditMode(!editMode());

// In component
import { editMode, toggleEditMode } from '@/store/dashboard';

<button onClick={toggleEditMode}>
  {editMode() ? 'Done' : 'Edit'}
</button>
```

### Server State (TanStack Query)

For API data:

```typescript
// queries/items.ts
import { createQuery } from '@tanstack/solid-query';
import { itemsApi } from '@/api';

export function createItemsQuery() {
  return createQuery(() => ({
    queryKey: ['items'],
    queryFn: () => itemsApi.getAll(),
    staleTime: 1000 * 60 * 5,  // 5 minutes
  }));
}

// In component
const itemsQuery = createItemsQuery();

<Show when={!itemsQuery.isLoading}>
  <For each={itemsQuery.data}>
    {(item) => <ItemCard item={item} />}
  </For>
</Show>
```

## API Integration

### API Client Setup

```typescript
// api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
});

// Add CSRF token
const token = document.querySelector('meta[name="csrf-token"]');
if (token) {
  apiClient.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
}

export default apiClient;
```

### API Methods

```typescript
// api/items.ts
import apiClient from './client';
import type { Item, ApiResponse } from '@/types';

export const itemsApi = {
  getAll: async (): Promise<Item[]> => {
    const response = await apiClient.get<ApiResponse<Item[]>>('/api/items');
    return response.data.data;
  },

  create: async (data: Partial<Item>): Promise<Item> => {
    const response = await apiClient.post<ApiResponse<Item>>('/api/items', data);
    return response.data.data;
  },

  update: async (id: number, data: Partial<Item>): Promise<Item> => {
    const response = await apiClient.put<ApiResponse<Item>>(`/api/items/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/items/${id}`);
  },
};
```

### Query Hooks

```typescript
// queries/items.ts
import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { itemsApi } from '@/api';

export function createItemsQuery() {
  return createQuery(() => ({
    queryKey: ['items'],
    queryFn: () => itemsApi.getAll(),
  }));
}

export function createCreateItemMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (data: Partial<Item>) => itemsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  }));
}
```

## Component Patterns

### Basic Component

```typescript
interface ButtonProps {
  children: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export default function Button(props: ButtonProps) {
  return (
    <button
      onClick={props.onClick}
      class={props.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
    >
      {props.children}
    </button>
  );
}
```

### Component with State

```typescript
export default function ItemForm() {
  const [title, setTitle] = createSignal('');
  const [url, setUrl] = createSignal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log({ title: title(), url: url() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title()}
        onInput={(e) => setTitle(e.currentTarget.value)}
      />
      <input
        type="url"
        value={url()}
        onInput={(e) => setUrl(e.currentTarget.value)}
      />
      <button type="submit">Save</button>
    </form>
  );
}
```

### Component with Query

```typescript
import { Show, For } from 'solid-js';
import { createItemsQuery } from '@/queries/items';
import ItemCard from '@/components/ItemCard';

export default function ItemGrid() {
  const itemsQuery = createItemsQuery();

  return (
    <Show
      when={!itemsQuery.isLoading}
      fallback={<div>Loading...</div>}
    >
      <Show when={itemsQuery.isError}>
        <div>Error: {itemsQuery.error?.message}</div>
      </Show>

      <Show when={itemsQuery.data}>
        <div class="grid grid-cols-4 gap-4">
          <For each={itemsQuery.data}>
            {(item) => <ItemCard item={item} />}
          </For>
        </div>
      </Show>
    </Show>
  );
}
```

## Styling

### Tailwind CSS

```typescript
// Static classes
<div class="bg-white rounded-lg shadow-md p-4">
  <h2 class="text-xl font-bold">Title</h2>
</div>

// Dynamic classes with classList
<button
  classList={{
    'bg-blue-500': !props.disabled,
    'bg-gray-300': props.disabled,
    'hover:bg-blue-600': !props.disabled,
  }}
>
  Click me
</button>

// With clsx utility
import { clsx } from 'clsx';

<div class={clsx(
  'btn',
  props.variant === 'primary' && 'btn-primary',
  props.variant === 'secondary' && 'btn-secondary',
  props.disabled && 'opacity-50'
)}>
  Button
</div>
```

## Translations

```typescript
import { t } from '@/lib/i18n';

// Simple translation
<h1>{t('app.dashboard')}</h1>

// With fallback
<span>{t('some.key') || 'Default Text'}</span>

// Dynamic (reactive)
import { useTranslation } from '@/lib/i18n';

const title = useTranslation('app.settings.system');
<h1>{title()}</h1>  // Auto-updates on locale change
```

## Routing

```typescript
import { Router, Route, A } from '@solidjs/router';

// Setup routes
<Router>
  <Route path="/" component={Dashboard} />
  <Route path="/settings" component={Settings} />
</Router>

// Navigation
<A href="/settings">Settings</A>

// Programmatic navigation
import { useNavigate } from '@solidjs/router';

const navigate = useNavigate();
navigate('/settings');
```

## TypeScript

### Type Definitions

```typescript
// types/index.ts
export interface Item {
  id: number;
  title: string;
  url: string;
  colour: string | null;
  icon: string | null;
  pinned: number;
  order: number;
  type: number;
  tags?: Tag[];
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  message?: string;
}
```

### Component Props

```typescript
interface ItemCardProps {
  item: Item;
  onEdit?: (item: Item) => void;
  onDelete?: (id: number) => void;
}

export default function ItemCard(props: ItemCardProps) {
  // TypeScript ensures type safety
  return <div>{props.item.title}</div>;
}
```

## Development Workflow

### Start Dev Server

```bash
npm run dev
```

- Vite: http://localhost:5173 (HMR)
- Laravel: http://localhost:8000 (app)

### Hot Module Replacement

Changes to `.tsx` files auto-reload in browser. No manual refresh needed!

### Build for Production

```bash
npm run build
```

Output: `public/build/assets/`

### Linting

```bash
npm run lint:ts
```

## Best Practices

### 1. Use Memos for Expensive Computations

```typescript
// Bad - recalculates on every render
const filtered = items().filter(item => item.pinned);

// Good - only recalculates when items() changes
const filtered = createMemo(() =>
  items().filter(item => item.pinned)
);
```

### 2. Avoid Destructuring Props

```typescript
// Bad - breaks reactivity
const { item } = props;

// Good - keeps reactivity
props.item
```

### 3. Use Show for Conditionals

```typescript
// Bad - always evaluates both branches
{condition() ? <ComponentA /> : <ComponentB />}

// Good - only renders active branch
<Show when={condition()} fallback={<ComponentB />}>
  <ComponentA />
</Show>
```

### 4. Batch Updates

```typescript
import { batch } from 'solid-js';

// Bad - triggers 3 renders
setName('John');
setAge(30);
setEmail('john@example.com');

// Good - triggers 1 render
batch(() => {
  setName('John');
  setAge(30);
  setEmail('john@example.com');
});
```

## Common Patterns

### Loading States

```typescript
<Show
  when={!query.isLoading}
  fallback={<LoadingSpinner />}
>
  <Content data={query.data} />
</Show>
```

### Error Handling

```typescript
<Show when={query.isError}>
  <ErrorMessage error={query.error} />
</Show>
```

### Form Handling

```typescript
const handleSubmit = async (e: Event) => {
  e.preventDefault();
  try {
    await mutation.mutateAsync(formData());
    toast.success('Saved!');
  } catch (error) {
    toast.error('Failed to save');
  }
};
```

## Performance Tips

1. **Use `createMemo`** for derived state
2. **Avoid** destructuring props
3. **Use `Show`** instead of ternaries
4. **Use `For`** with keyed iteration
5. **Batch** related updates
6. **Lazy load** heavy components
7. **Use `Suspense`** for code splitting

## Resources

- **SolidJS Docs**: https://www.solidjs.com/docs
- **TanStack Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

**Happy coding with SolidJS! ⚡**
