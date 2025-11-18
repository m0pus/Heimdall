# Himinbjörg Development Guide

## 🚀 Getting Started

This guide will help you set up Himinbjörg for local development.

### Prerequisites

Ensure you have these installed:
- **PHP** >= 8.2
- **Composer** (latest)
- **Node.js** >= 18
- **npm** >= 9 (or yarn)
- **SQLite** (or MySQL/PostgreSQL)

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/himinbjorg.git
cd himinbjorg

# 2. Install PHP dependencies
composer install

# 3. Install JavaScript dependencies
npm install

# 4. Create environment file
cp .env.example .env

# 5. Generate application key
php artisan key:generate

# 6. Create database (SQLite example)
touch database/database.sqlite

# 7. Run migrations
php artisan migrate

# 8. (Optional) Seed demo data
php artisan db:seed

# 9. Start development servers
npm run dev
```

That's it! Visit **http://localhost:8000** in your browser.

## 🛠️ Development Workflow

### Running the Development Server

Himinbjörg requires **two servers** to run during development:
1. **Vite dev server** (port 5173) - For React hot module replacement
2. **Laravel server** (port 8000) - For backend API and serving the app

**Option 1: One Command (Recommended)**

```bash
npm run dev
```

This automatically starts both servers using `concurrently`. You'll see output from both:
- `[vite]` messages in cyan
- `[laravel]` messages in green

**Option 2: Separate Terminals**

If you prefer more control:

```bash
# Terminal 1
npm run dev:vite

# Terminal 2
npm run dev:laravel
# or
php artisan serve
```

**Option 3: Shell Script**

We provide a setup script that checks dependencies and starts everything:

```bash
./dev.sh
```

This script will:
- Check for `.env` and create it if missing
- Install dependencies if `node_modules` or `vendor` are missing
- Create database if it doesn't exist
- Start both servers

### Hot Module Replacement (HMR)

When running `npm run dev`, Vite watches your React files and automatically updates the browser when you save changes. No manual refresh needed!

**HMR works for:**
- React components (`.tsx`, `.jsx`)
- TypeScript files (`.ts`)
- CSS files (`.css`)
- Tailwind classes

**Changes requiring manual refresh:**
- PHP backend code
- Laravel routes
- Environment variables
- Blade templates

To see backend changes, just refresh the browser manually.

## 📂 Project Structure

```
himinbjorg/
├── app/                        # Laravel backend
│   ├── Http/Controllers/      # API endpoints
│   ├── Models/                # Database models
│   └── ...
├── database/
│   ├── migrations/            # Database schema
│   └── database.sqlite        # SQLite database (created by you)
├── resources/
│   ├── js/                    # React application (NEW!)
│   │   ├── app.tsx           # Entry point
│   │   ├── components/       # UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # React hooks
│   │   ├── api/              # API client
│   │   ├── store/            # State management
│   │   ├── lib/              # Utilities
│   │   └── types/            # TypeScript types
│   ├── css/
│   │   └── app.css           # Tailwind CSS (NEW!)
│   ├── assets/               # Legacy jQuery (preserved)
│   └── views/
│       ├── react.blade.php   # React SPA view (NEW!)
│       └── layouts/
│           └── react.blade.php
├── routes/
│   ├── web.php               # Web routes (updated for React)
│   └── api.php               # API routes (enhanced)
├── public/
│   └── build/                # Built assets (created by Vite)
├── vite.config.ts            # Vite configuration (NEW!)
├── tailwind.config.js        # Tailwind configuration (NEW!)
├── tsconfig.json             # TypeScript configuration (NEW!)
├── package.json              # NPM dependencies
├── composer.json             # PHP dependencies
└── dev.sh                    # Development startup script (NEW!)
```

## 🔨 Common Development Tasks

### Making Changes to React Components

```bash
# 1. Edit files in resources/js/
vim resources/js/components/ItemTile.tsx

# 2. Save the file
# 3. HMR automatically updates the browser!
```

### Adding a New React Component

```bash
# 1. Create component file
cat > resources/js/components/MyComponent.tsx << 'EOF'
import React from 'react';

interface MyComponentProps {
  title: string;
}

export default function MyComponent({ title }: MyComponentProps) {
  return <div className="p-4">{title}</div>;
}
EOF

# 2. Import and use it
# No restart needed - HMR handles it!
```

### Updating API Endpoints

```bash
# 1. Edit PHP controller
vim app/Http/Controllers/ItemController.php

# 2. Or edit routes
vim routes/api.php

# 3. Refresh browser to see changes
```

### Database Migrations

```bash
# Create a new migration
php artisan make:migration create_my_table

# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Fresh migration (WARNING: deletes all data)
php artisan migrate:fresh
```

### TypeScript Type Checking

```bash
# Check for type errors
npx tsc --noEmit

# Watch mode
npx tsc --noEmit --watch
```

### Linting

```bash
# Lint TypeScript files
npm run lint:ts

# Lint legacy JavaScript
npm run lint
```

## 🏗️ Building for Production

### Development Build

```bash
npm run dev
```

Creates unoptimized bundles with source maps for debugging.

### Production Build

```bash
npm run build
```

Creates optimized, minified bundles in `public/build/`:
- Tree-shaking to remove unused code
- Code splitting for better caching
- Minification
- Asset optimization

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally for testing.

## 🐛 Troubleshooting

### Port Already in Use

If port 8000 or 5173 is already in use:

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
php artisan serve --port=8001
```

Update Vite config if needed:
```typescript
// vite.config.ts
server: {
  port: 5174,  // Different port
}
```

### HMR Not Working

1. **Check Vite is running**: You should see `[vite] ` messages
2. **Check browser console**: Look for WebSocket connection errors
3. **Restart dev server**: `Ctrl+C` and `npm run dev` again
4. **Clear browser cache**: Hard refresh with `Cmd/Ctrl + Shift + R`

### Database Locked

If you get "database is locked" errors:

```bash
# Close all connections and reset
php artisan db:wipe
php artisan migrate:fresh
```

### Module Not Found

If you see "Cannot find module '@/components/...'" errors:

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check tsconfig.json paths are correct
cat tsconfig.json | grep paths -A 10
```

### CSRF Token Mismatch

Ensure your Blade template includes:

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
```

### API 404 Errors

1. Check route exists in `routes/api.php`
2. Check API client base URL in `resources/js/api/client.ts`
3. Check Laravel logs: `tail -f storage/logs/laravel.log`

## 🧪 Testing

### Frontend Tests (Coming Soon)

```bash
# Run Vitest
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Backend Tests

```bash
# Run PHPUnit
./vendor/bin/phpunit

# Run specific test
./vendor/bin/phpunit --filter=ItemControllerTest
```

## 📝 Code Style

### TypeScript/React

We follow these conventions:
- Functional components with hooks
- TypeScript for all new code
- Tailwind CSS for styling
- Props interfaces for all components
- Named exports for components

Example:
```tsx
interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export default function MyComponent({ title, onClick }: MyComponentProps) {
  return (
    <button onClick={onClick} className="btn-primary">
      {title}
    </button>
  );
}
```

### PHP/Laravel

We follow Laravel conventions:
- PSR-12 coding standard
- Type hints for parameters and returns
- Resource controllers for CRUD
- API responses with consistent format

Example:
```php
public function index(): JsonResponse
{
    $items = Item::all();

    return response()->json([
        'status' => 'success',
        'data' => $items,
    ]);
}
```

## 🔧 Environment Variables

### Required

```env
APP_NAME=Himinbjörg
APP_ENV=local
APP_KEY=base64:...    # Generated by php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
```

### Optional

```env
# Allow internal IP requests (for homelab apps)
ALLOW_INTERNAL_REQUESTS=true

# Custom app repository
APP_SOURCE=https://appslist.heimdall.site/

# Database (if using MySQL/PostgreSQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=himinbjorg
DB_USERNAME=root
DB_PASSWORD=
```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Laravel Documentation](https://laravel.com/docs)
- [React Query](https://tanstack.com/query/latest)

## 🆘 Getting Help

1. Check this documentation
2. Review [FRONTEND_MODERNIZATION.md](FRONTEND_MODERNIZATION.md)
3. Check [REACT_QUICKSTART.md](REACT_QUICKSTART.md)
4. Search existing GitHub issues
5. Open a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/OS/Node/PHP versions
   - Error messages/screenshots

---

Happy coding! 🎉
