# Himinbjörg - SolidJS Frontend

Modern, reactive dashboard application built with **SolidJS** + **TypeScript** + **Vite** + **Tailwind CSS**.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server (Vite + Laravel)
npm run dev

# Visit http://localhost:8000
```

## 📦 Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| **Framework** | SolidJS | 1.x |
| **Language** | TypeScript | 5.9+ |
| **Build Tool** | Vite | 6.3+ |
| **Styling** | Tailwind CSS | 3.4+ |
| **State** | Solid Signals | built-in |
| **Routing** | @solidjs/router | latest |
| **Data Fetching** | @tanstack/solid-query | latest |
| **Drag & Drop** | @thisbeyond/solid-dnd | latest |
| **Storage** | @solid-primitives/storage | latest |

## 📁 Project Structure

```
resources/js/
├── app.tsx                      # Entry point
├── components/                  # UI components
│   ├── Button.tsx              # Reusable button
│   ├── ItemTile.tsx            # App tile
│   ├── ItemGrid.tsx            # Grid with DnD
│   ├── SearchBar.tsx           # Search component
│   └── TagList.tsx             # Tag filters
├── pages/                       # Page components
│   └── Dashboard.tsx           # Main dashboard
├── queries/                     # Data layer
│   ├── items.ts                # Item queries
│   └── tags.ts                 # Tag queries
├── store/                       # Global state
│   └── dashboard.ts            # Dashboard signals
├── api/                         # API client
│   ├── client.ts               # Axios instance
│   ├── items.ts                # Items API
│   ├── tags.ts                 # Tags API
│   └── applications.ts         # Apps API
├── types/                       # TypeScript types
│   └── index.ts                # Type definitions
└── lib/                         # Utilities
    └── utils.ts                # Helper functions
```

## 🎯 Features

### ✅ Implemented
- **Dashboard**: Tile-based app launcher
- **Search**: Local (tiles) + Web (Google, DDG, Bing)
- **Tags**: Filter apps by category
- **Edit Mode**: Reorder, pin, delete items
- **Drag & Drop**: Reorder tiles (edit mode)
- **Enhanced Apps**: Live stats from APIs
- **Responsive**: Mobile-friendly grid
- **Persistence**: Settings saved to localStorage

### 🚧 To-Do
- Item add/edit form
- Settings page
- Trash page (restore deleted items)
- User management
- Animations
- PWA support

## 🧩 Components

### Button
Reusable button with variants and loading state.

```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean

### ItemTile
Individual app tile with icon, title, stats, and actions.

```tsx
<ItemTile
  item={item}
  editMode={editMode()}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onRefresh={handleRefresh}
  onTogglePin={handleTogglePin}
/>
```

### ItemGrid
Sortable grid with drag-and-drop support.

```tsx
<ItemGrid
  items={items()}
  editMode={editMode()}
  onReorder={handleReorder}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onRefresh={handleRefresh}
  onTogglePin={handleTogglePin}
/>
```

### SearchBar
Search input with provider selection.

```tsx
<SearchBar class="mb-4" />
```

Supports:
- **Tiles**: Search local apps
- **Google**: Open Google search
- **DuckDuckGo**: Open DDG search
- **Bing**: Open Bing search

### TagList
Horizontal list of tag filters.

```tsx
<TagList tags={tags()} />
```

## 🗄️ State Management

### Global State (Signals)

```tsx
// store/dashboard.ts
import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';

// Simple signal
export const [editMode, setEditMode] = createSignal(false);

// Persisted signal (localStorage)
export const [selectedTag, setSelectedTag] = makePersisted(
  createSignal<number | 'all'>('all'),
  { name: 'himinbjorg-selected-tag' }
);

// Helper function
export const toggleEditMode = () => setEditMode(!editMode());
```

**Usage:**
```tsx
import { editMode, toggleEditMode } from '@/store/dashboard';

function MyComponent() {
  return (
    <div>
      <p>Edit mode: {editMode() ? 'ON' : 'OFF'}</p>
      <button onClick={toggleEditMode}>Toggle</button>
    </div>
  );
}
```

## 🔄 Data Fetching

### Queries (Read)

```tsx
// queries/items.ts
import { createQuery } from '@tanstack/solid-query';
import { itemsApi } from '@/api';

export function createItemsQuery() {
  return createQuery(() => ({
    queryKey: ['items'],
    queryFn: () => itemsApi.getAll(),
  }));
}
```

**Usage:**
```tsx
import { createItemsQuery } from '@/queries/items';

function Dashboard() {
  const itemsQuery = createItemsQuery();

  return (
    <Show when={!itemsQuery.isLoading} fallback={<Spinner />}>
      <For each={itemsQuery.data}>
        {(item) => <ItemTile item={item} />}
      </For>
    </Show>
  );
}
```

### Mutations (Write)

```tsx
// queries/items.ts
import { createMutation, useQueryClient } from '@tanstack/solid-query';
import { itemsApi } from '@/api';

export function createDeleteItemMutation() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: number) => itemsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  }));
}
```

**Usage:**
```tsx
function Dashboard() {
  const deleteItem = createDeleteItemMutation();

  const handleDelete = (id: number) => {
    if (confirm('Delete item?')) {
      deleteItem.mutate(id);
    }
  };

  return <button onClick={() => handleDelete(item.id)}>Delete</button>;
}
```

## 🎨 Styling

### Tailwind CSS

```tsx
// Static classes
<div class="flex items-center gap-2 p-4 bg-white rounded-lg" />

// Dynamic classes
<div class={isActive() ? 'bg-blue-500' : 'bg-gray-500'} />

// classList helper
<div classList={{
  'bg-blue-500': isActive(),
  'bg-gray-500': !isActive(),
  'opacity-50': isDisabled()
}} />
```

### Custom Utilities

```tsx
import { cn } from '@/lib/utils';

<div class={cn('base-class', isActive() && 'active-class', props.class)} />
```

## 🏗️ Building

### Development
```bash
npm run dev        # Vite (5173) + Laravel (8000)
npm run dev:vite   # Vite only
npm run dev:laravel # Laravel only
```

### Production
```bash
npm run build      # Build to public/build/
npm run preview    # Preview production build
```

### Type Checking
```bash
npx tsc --noEmit   # Check TypeScript errors
```

## 📝 Code Patterns

### Component Template

```tsx
import { JSX, splitProps, Show, For } from 'solid-js';

interface MyComponentProps {
  title: string;
  items: Item[];
  onClick?: () => void;
}

export default function MyComponent(props: MyComponentProps) {
  const [local, others] = splitProps(props, ['title', 'items']);

  return (
    <div {...others}>
      <h2>{local.title}</h2>
      <For each={local.items}>
        {(item) => <div>{item.name}</div>}
      </For>
    </div>
  );
}
```

### Conditional Rendering

```tsx
// Simple boolean
<Show when={isVisible()}>
  <div>Content</div>
</Show>

// With fallback
<Show when={!isLoading()} fallback={<Spinner />}>
  <Content />
</Show>

// Truthy value
<Show when={user()}>
  {(u) => <div>Hello, {u().name}</div>}
</Show>
```

### List Rendering

```tsx
// Basic
<For each={items()}>
  {(item) => <div>{item.name}</div>}
</For>

// With index
<For each={items()}>
  {(item, index) => <div>{index()}: {item.name}</div>}
</For>

// Conditional list
<Show when={items().length > 0} fallback={<EmptyState />}>
  <For each={items()}>
    {(item) => <Item data={item} />}
  </For>
</Show>
```

## 🐛 Debugging

### Console Logging

```tsx
import { createEffect } from 'solid-js';

// Log when signal changes
createEffect(() => {
  console.log('Count:', count());
});

// One-time log
console.log('Initial count:', count());
```

### Error Boundaries

```tsx
import { ErrorBoundary } from 'solid-js';

<ErrorBoundary fallback={(err) => <div>Error: {err.message}</div>}>
  <MyComponent />
</ErrorBoundary>
```

## 🧪 Testing

Not yet implemented. Recommended tools:

- **Unit Tests**: @solidjs/testing-library + Vitest
- **E2E Tests**: Playwright
- **Type Tests**: tsd

## 📚 Resources

### Official Docs
- [SolidJS](https://www.solidjs.com/) - Framework docs
- [Solid Tutorial](https://www.solidjs.com/tutorial) - Interactive tutorial
- [Solid Router](https://docs.solidjs.com/solid-router) - Routing
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/solid/overview) - Data fetching

### Community
- [Discord](https://discord.com/invite/solidjs) - Official Discord
- [GitHub](https://github.com/solidjs/solid) - Source code
- [Examples](https://github.com/solidjs/solid/tree/main/examples) - Code examples

### Tools
- [Playground](https://playground.solidjs.com/) - Online editor
- [DevTools](https://github.com/thetarnav/solid-devtools) - Browser extension
- [Primitives](https://primitives.solidjs.community/) - Utility library

## 🤝 Contributing

### Code Style
- Use TypeScript strict mode
- Follow Solid best practices (no prop destructuring!)
- Use Tailwind for styling
- Use `class` not `className`
- Use `<For>` not `.map()`
- Use `<Show>` not ternaries

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes
git add .
git commit -m "Add my feature"

# Push and create PR
git push origin feature/my-feature
```

## 📄 License

MIT - Same as original Heimdall project

## 🙏 Acknowledgments

- **Original Heimdall**: [GitHub](https://github.com/linuxserver/Heimdall)
- **SolidJS Team**: For the amazing framework
- **Community**: For all the great libraries

---

Built with ❤️ using [SolidJS](https://www.solidjs.com/)
