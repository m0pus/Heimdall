# SolidJS Quick Start Guide

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

This runs both:
- **Vite** (port 5173) - Frontend dev server with HMR
- **Laravel** (port 8000) - Backend API server

Visit **http://localhost:8000** to see your app.

### 3. Build for Production
```bash
npm run build
```

## Project Structure

```
resources/js/
├── app.tsx              # Entry point
├── components/          # Reusable UI components
├── pages/              # Page components
├── queries/            # Data fetching (SolidJS Query)
├── store/              # Global state (Signals)
├── api/                # API client functions
├── types/              # TypeScript types
└── lib/                # Utility functions
```

## Core Concepts

### Signals (State Management)

```tsx
import { createSignal } from 'solid-js';

// Create a signal
const [count, setCount] = createSignal(0);

// Read value (must call as function)
console.log(count()); // 0

// Update value
setCount(count() + 1);
setCount(5); // Set to specific value
```

### Reactive Computations

```tsx
import { createMemo, createEffect } from 'solid-js';

const [count, setCount] = createSignal(0);

// Derived state (memoized)
const doubled = createMemo(() => count() * 2);

// Side effects
createEffect(() => {
  console.log('Count changed:', count());
});
```

### Components

```tsx
import { JSX } from 'solid-js';

interface ButtonProps {
  onClick: () => void;
  children: JSX.Element;
}

export default function Button(props: ButtonProps) {
  return (
    <button onClick={props.onClick}>
      {props.children}
    </button>
  );
}
```

### Conditional Rendering

```tsx
import { Show } from 'solid-js';

<Show
  when={isLoggedIn()}
  fallback={<Login />}
>
  <Dashboard />
</Show>
```

### List Rendering

```tsx
import { For } from 'solid-js';

<For each={items()}>
  {(item) => <div>{item.name}</div>}
</For>
```

### Data Fetching

```tsx
import { createQuery } from '@tanstack/solid-query';

function MyComponent() {
  const query = createQuery(() => ({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await fetch('/api/items');
      return res.json();
    },
  }));

  return (
    <Show when={!query.isLoading} fallback={<div>Loading...</div>}>
      <For each={query.data}>
        {(item) => <div>{item.name}</div>}
      </For>
    </Show>
  );
}
```

## Common Patterns

### Props Destructuring

```tsx
import { splitProps } from 'solid-js';

function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, ['variant', 'class']);

  return <button class={local.class} {...others} />;
}
```

### Event Handlers

```tsx
// Standard event handler
<button onClick={(e) => handleClick(e)}>Click</button>

// Delegated event (more performant)
<button on:click={handleClick}>Click</button>
```

### Class Names

```tsx
// Dynamic classes
<div class={isActive() ? 'active' : 'inactive'} />

// classList helper
<div classList={{ active: isActive(), disabled: isDisabled() }} />
```

### Styles

```tsx
// Inline styles
<div style={{ color: color(), "font-size": "16px" }} />

// CSS properties
<div style={{
  "background-color": bgColor(),
  opacity: 0.5
}} />
```

## Global Store Pattern

```tsx
// store/counter.ts
import { createSignal } from 'solid-js';

export const [count, setCount] = createSignal(0);
export const increment = () => setCount(count() + 1);

// Component A
import { count, increment } from '@/store/counter';
<button onClick={increment}>Count: {count()}</button>

// Component B (automatically synced!)
import { count } from '@/store/counter';
<div>Count is: {count()}</div>
```

## API Integration

```tsx
// api/items.ts
import { apiClient } from './client';

export const itemsApi = {
  getAll: () => apiClient.get('/api/items'),
  getOne: (id: number) => apiClient.get(`/api/items/${id}`),
  create: (data: ItemFormData) => apiClient.post('/api/items', data),
  update: (id: number, data: Partial<ItemFormData>) =>
    apiClient.put(`/api/items/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/items/${id}`),
};

// queries/items.ts
import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { itemsApi } from '@/api/items';

export function createItemsQuery() {
  return createQuery(() => ({
    queryKey: ['items'],
    queryFn: itemsApi.getAll,
  }));
}

export function createDeleteItemMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: itemsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  }));
}

// pages/Dashboard.tsx
import { createItemsQuery, createDeleteItemMutation } from '@/queries/items';

export default function Dashboard() {
  const itemsQuery = createItemsQuery();
  const deleteItem = createDeleteItemMutation();

  const handleDelete = (id: number) => {
    if (confirm('Delete?')) {
      deleteItem.mutate(id);
    }
  };

  return (
    <For each={itemsQuery.data}>
      {(item) => (
        <div>
          {item.name}
          <button onClick={() => handleDelete(item.id)}>Delete</button>
        </div>
      )}
    </For>
  );
}
```

## Routing

```tsx
import { Router, Route } from '@solidjs/router';

<Router>
  <Route path="/" component={Dashboard} />
  <Route path="/settings" component={Settings} />
  <Route path="/items/:id" component={ItemDetail} />
</Router>

// Access route params
import { useParams } from '@solidjs/router';

function ItemDetail() {
  const params = useParams();
  return <div>Item ID: {params.id}</div>;
}
```

## TypeScript Tips

```tsx
import type { Component, JSX } from 'solid-js';

// Component with props
type ButtonProps = {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: JSX.Element;
};

const Button: Component<ButtonProps> = (props) => {
  return <button onClick={props.onClick}>{props.children}</button>;
};

// Signal types
const [count, setCount] = createSignal<number>(0);
const [user, setUser] = createSignal<User | null>(null);
```

## Performance Tips

1. **Use `createMemo` for expensive computations**
   ```tsx
   const filtered = createMemo(() => {
     return items().filter(item => item.active);
   });
   ```

2. **Use `<For>` instead of `.map()`**
   ```tsx
   // ❌ Bad (re-renders entire list)
   {items().map(item => <Item item={item} />)}

   // ✅ Good (only updates changed items)
   <For each={items()}>
     {(item) => <Item item={item} />}
   </For>
   ```

3. **Batch updates with `batch()`**
   ```tsx
   import { batch } from 'solid-js';

   batch(() => {
     setName('John');
     setAge(30);
     setEmail('john@example.com');
   });
   ```

4. **Use event delegation for lists**
   ```tsx
   <div on:click={(e) => {
     const id = e.target.dataset.id;
     handleClick(id);
   }}>
     <For each={items()}>
       {(item) => <button data-id={item.id}>Click</button>}
     </For>
   </div>
   ```

## Debugging

### Use Dev Tools
```tsx
// Enable Solid DevTools
import { attachDevtoolsOverlay } from '@solid-devtools/overlay';

if (import.meta.env.DEV) {
  attachDevtoolsOverlay();
}
```

### Log Signal Changes
```tsx
import { createEffect } from 'solid-js';

createEffect(() => {
  console.log('Count changed:', count());
});
```

## Common Gotchas

### ❌ Don't destructure props
```tsx
// Bad - loses reactivity
const { name } = props;
return <div>{name}</div>;

// Good - keeps reactivity
return <div>{props.name}</div>;
```

### ❌ Don't forget to call signals
```tsx
// Bad - logs function, not value
console.log(count);

// Good - logs actual value
console.log(count());
```

### ❌ Don't use hooks in conditionals
```tsx
// Bad - breaks reactivity
if (condition) {
  const query = createQuery(...);
}

// Good - use <Show> instead
<Show when={condition}>
  {() => {
    const query = createQuery(...);
    return <div>...</div>;
  }}
</Show>
```

## Resources

- [Official Docs](https://www.solidjs.com/)
- [Tutorial](https://www.solidjs.com/tutorial)
- [Playground](https://playground.solidjs.com/)
- [Examples](https://github.com/solidjs/solid/tree/main/examples)
- [Discord](https://discord.com/invite/solidjs)

---

Happy coding with SolidJS! 🚀
