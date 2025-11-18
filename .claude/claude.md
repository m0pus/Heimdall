# Himinbjörg - Modern Application Dashboard - Project Context

## Project Overview

**Himinbjörg** is a modern fork of the Heimdall Application Dashboard. It's a self-hosted application dashboard built with Laravel and SolidJS that provides an elegant, tile-based interface for organizing and accessing web applications.

> **Himinbjörg** (Old Norse: "Heaven's Castle") - Like its namesake, the celestial fortress guarding Bifröst in Norse mythology, Himinbjörg serves as your gateway to all your applications.

**Based on**: Heimdall 2.7.7
**Branch**: 2.x (modernized)
**License**: MIT
**Frontend**: SolidJS + TypeScript + Vite
**Backend**: Laravel 11

## 🎯 CRITICAL: Backward Compatibility Requirement

**This application is designed as a drop-in Heimdall replacement and MUST maintain 100% backward compatibility.**

### Non-Negotiable Requirements:
- ✅ **Database Schema**: All existing Heimdall tables, columns, and relationships MUST remain unchanged
- ✅ **API Contracts**: Existing API endpoints must return data in the same format (wrapped in `{status, data}`)
- ✅ **Data Migration**: Users should be able to upgrade from Heimdall without data loss or migration scripts
- ✅ **Settings Preservation**: All existing settings must work identically
- ✅ **Enhanced Apps**: Full compatibility with Heimdall's enhanced apps system (config in `description` field)
- ✅ **Import/Export**: Existing Heimdall backups must be importable
- ✅ **Configuration**: Existing .env and config files must work without modification
- ✅ **Item Storage**: Config JSON in `description` field, class names, appid linking - all preserved

### Implementation Guidelines:
- **DO NOT** rename database columns or tables
- **DO NOT** change API response formats in breaking ways
- **DO NOT** remove existing features or endpoints
- **DO NOT** change how enhanced apps store configuration
- **DO NOT** modify files in `app/SupportedApps/` - these come from upstream repository and must not be touched
- **DO** add new features as extensions, not replacements
- **DO** test with existing Heimdall databases regularly
- **DO** maintain the same file storage structure
- **DO** support the same enhanced apps repository format
- **DO** document any new features separately from core Heimdall features

### Testing Checklist:
- [ ] Import existing Heimdall database without modifications
- [ ] All tiles display correctly with icons
- [ ] Enhanced apps maintain their configuration
- [ ] Settings persist and work identically
- [ ] Tags/categories work the same way
- [ ] User permissions and authentication work
- [ ] Enhanced app stats display correctly
- [ ] Existing backups can be restored

## Purpose

This application serves as a centralized dashboard for:
- Quick access to self-hosted services (homelab)
- Internal company tools and applications
- Personal homepage/browser start page
- Development environment tool hub

## Key Features

### 1. Tile-Based Interface
- Drag-and-drop reordering
- Custom icons (upload or URL)
- Custom colors per tile
- Pin/unpin functionality
- Soft deletion with restore

### 2. Enhanced Applications System
- Live statistics displayed on tiles
- API integration with popular apps (Plex, Sonarr, Radarr, etc.)
- 50+ enhanced apps available
- 100+ foundation apps (basic icons/links)
- Auto-download from central repository

### 3. Organization System
- Tags/Categories for grouping apps
- Three modes: categories, tags, or flat list
- Many-to-many relationships between items and tags

### 4. Multi-User Support
- Per-user settings and customization
- Shared items (visible to all)
- User-specific items
- Optional role-based access control (RBAC)
- Auto-login via UUID

### 5. Search
- Search your own tiles
- Multiple providers (Google, DuckDuckGo, Bing)
- Customizable via YAML config
- Live filtering

### 6. Customization
- Background images or geometric patterns
- Color schemes (light/dark tiles)
- 20+ language translations
- Per-user preferences

## Technology Stack

### Backend
- **Framework**: Laravel 11
- **PHP**: 8.2+
- **Database**: SQLite (default), MySQL, PostgreSQL
- **Key Libraries**:
  - Guzzle (HTTP client)
  - SVG Sanitizer
  - Symfony YAML
  - Laravel UI

### Frontend (Modern - Himinbjörg)
- **Framework**: React 18
- **Language**: TypeScript 5.9
- **Build Tool**: Vite 6.3 (formerly Laravel Mix/Webpack)
- **CSS**: Tailwind CSS 4 (formerly Bootstrap 3)
- **State Management**:
  - React Query (@tanstack/react-query) - Server state
  - Zustand - Client state
- **Routing**: React Router 6
- **UI Libraries**:
  - @dnd-kit (drag-drop, formerly SortableJS)
  - React Hook Form (forms)
- **Icons**: FontAwesome 5
- **HTTP Client**: Axios

### Frontend (Legacy - Preserved for compatibility)
- **Build**: Laravel Mix (Webpack)
- **CSS**: SASS/SCSS + Bootstrap 3
- **JavaScript**: jQuery 3.6+
- **Libraries**: SortableJS, jQuery UI, Huebee, Select2

### Deployment
- Docker (multi-arch)
- Apache/.htaccess
- Nginx
- Reverse proxy support

## Architecture

### Core Models
- **Item**: Main model for apps and tags (polymorphic)
- **Application**: Repository of supported/enhanced apps
- **Setting**: System and user preferences
- **User**: Authentication and authorization
- **ItemTag**: Pivot for many-to-many relationships

### Database Schema
```
items (id, title, url, colour, icon, description, pinned, order, type, user_id, appid, class, role)
applications (appid, name, sha, icon, website, license, description, enhanced, tile_background, class)
item_tag (item_id, tag_id)
settings (id, group_id, key, type, options, label, value, order, system)
setting_user (setting_id, user_id, uservalue)
users (id, username, email, password, autologin_token)
```

### Key Controllers
- **ItemController**: CRUD for items, ordering, pinning
- **TagController**: Tag/category management
- **SettingsController**: User and system settings
- **SearchController**: Search functionality
- **ItemRestController**: REST API

### Enhanced Apps System
- Base class: `SupportedApps`
- Interface: `EnhancedApps`
- Apps downloaded from remote repository
- SHA-based versioning
- Config stored as JSON in item.description
- Live stats via API polling

**⚠️ CRITICAL: DO NOT MODIFY SUPPORTEDAPPS IMPLEMENTATIONS**
- Files in `app/SupportedApps/` are downloaded from upstream repository
- Any modifications will be overwritten when apps are updated
- These files are managed by the remote app repository system
- If there are bugs or issues with an enhanced app:
  - Fix them in the base `app/SupportedApps.php` class if possible
  - Fix them in the polling job `app/Jobs/PollEnhancedApps.php`
  - Add error handling in the API routes
  - Handle edge cases gracefully in the base infrastructure
  - Report bugs to the upstream app repository
- Never commit changes to files in `app/SupportedApps/` directory

## File Structure

```
app/
├── Application.php           # App repository model
├── Item.php                  # Main item/tile model
├── SupportedApps.php         # Base class for enhanced apps
├── EnhancedApps.php          # Interface marker
├── Setting.php               # Settings management
├── User.php                  # User model
├── Helper.php                # Global helper functions
├── Http/Controllers/         # Request handlers
├── Jobs/                     # Queue jobs (ProcessApps)
└── SupportedApps/            # Enhanced app implementations (dynamically loaded)

database/migrations/          # 17 migration files
resources/
├── assets/
│   ├── js/                   # JavaScript (jQuery-based)
│   └── sass/                 # SCSS styles
├── views/                    # 38 Blade templates
└── lang/                     # 20+ translations

routes/
├── web.php                   # Main web routes
└── api.php                   # REST API routes

storage/app/
├── supportedapps.json        # Cached app repository
└── searchproviders.yaml      # Search provider config
```

## Configuration

### Environment Variables
- `APP_URL`: Base URL (important for reverse proxy)
- `APP_SOURCE`: Custom app repository URL (default: https://appslist.heimdall.site/)
- `ALLOW_INTERNAL_REQUESTS`: Enable/disable access to private IPs (default: false)
- `AUTH_ROLES_ENABLE`: Enable role-based access (default: false)
- `AUTH_ROLES_HEADER`: HTTP header for roles (default: remote-groups)
- `AUTH_ROLES_DELIMITER`: Role separator (default: ,)

### Settings System
- System settings: Global configuration
- User settings: Per-user overrides
- Stored in database with caching
- Editable via web UI

## Security Features

### Built-in
- SSRF protection (IP validation)
- SVG sanitization (XSS prevention)
- CSRF tokens (Laravel)
- SQL injection protection (Eloquent ORM)
- Password field masking in enhanced apps

### Considerations
- Remote code fetching from app repository
- Dynamic class loading for enhanced apps
- SSL verification disabled in some clients
- File upload permissions

## API Integration

### Enhanced Apps
- HTTP client via Guzzle
- Configurable timeout (15s)
- Cookie jar support
- Custom headers/auth
- Test config before save

### REST API
- `/api/item` - CRUD operations
- Authentication required
- JSON responses

## Docker Deployment

- Official LinuxServer.io images
- Multi-arch: x86-64, armhf, arm64
- Persistent volumes: `/config`
- Custom PHP settings: `/config/php/php-local.ini`
- Docker networking for enhanced apps

## Development

### Build Commands
```bash
# Install dependencies
composer install
npm install

# Setup
cp .env.example .env
php artisan key:generate

# Build assets
npm run dev      # Development
npm run watch    # Watch mode
npm run prod     # Production

# Database
php artisan migrate

# Run locally
php artisan serve
```

### Testing
```bash
# Run tests
./vendor/bin/phpunit

# Code style
./vendor/bin/phpcs
```

## Community

- **Discord**: Active community support
- **GitHub**: Issue tracking, discussions
- **LinuxServer.io**: Official Docker images
- **App Repository**: Community-contributed enhanced apps

## Known Limitations

1. jQuery/Bootstrap 3 (dated frontend)
2. No real-time updates (polling only)
3. Limited mobile optimization
4. No built-in monitoring/health checks
5. Basic permission system
6. Single theme (no dark mode toggle)
7. No PWA support
8. Limited API documentation

## Modernization - Himinbjörg Implementation

Himinbjörg has implemented many modern features:

### ✅ Completed
1. ✅ React 18 frontend with TypeScript
2. ✅ Vite build system (15x faster builds, <100ms HMR)
3. ✅ Tailwind CSS (beautiful, customizable)
4. ✅ Modern drag-and-drop (@dnd-kit)
5. ✅ Enhanced REST API endpoints
6. ✅ Mobile-first responsive design
7. ✅ Type-safe development with TypeScript
8. ✅ React Query for efficient data fetching
9. ✅ Zustand for state management

### 🚧 In Progress
- React Hook Form integration for all forms
- Dark mode toggle
- Enhanced accessibility features

### 📋 Planned
- WebSocket real-time updates
- Full OpenAPI documentation
- PWA capabilities (offline mode, install prompt)
- Advanced RBAC
- Theme marketplace
- Built-in monitoring dashboard
- Mobile app (React Native)

## Important Notes

- Enhanced apps are dynamically loaded from remote repository
- SHA versioning ensures app updates are tracked
- User settings override system settings
- Items with `user_id=0` are shared globally
- Type field: 0=item, 1=tag
- Soft deletes allow restoration
- Search providers are YAML-based and customizable
