# Heimdall Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│  (Blade Templates + jQuery + Bootstrap 3 + SortableJS)      │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/AJAX
┌──────────────────────▼──────────────────────────────────────┐
│                   Laravel Router                             │
│                    (routes/web.php)                          │
└──────────┬───────────────────────┬──────────────────────────┘
           │                       │
┌──────────▼──────────┐  ┌────────▼───────────────────────────┐
│   Controllers       │  │    Middleware                       │
│  - ItemController   │  │  - Auth                             │
│  - TagController    │  │  - CheckAllowed (RBAC)              │
│  - SettingsCtrl     │  │  - TrustProxies                     │
│  - SearchCtrl       │  │  - CSRF                             │
└──────────┬──────────┘  └────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                      Models (Eloquent ORM)                   │
│  - Item (apps/tags)                                          │
│  - Application (supported apps repository)                   │
│  - Setting (system/user preferences)                         │
│  - User (authentication)                                     │
│  - ItemTag (pivot)                                           │
└──────────┬──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                      Database Layer                          │
│  - SQLite (default)                                          │
│  - MySQL/PostgreSQL (optional)                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   External Integrations                       │
│  - Enhanced Apps APIs (Guzzle HTTP)                          │
│  - Apps Repository (https://appslist.heimdall.site/)         │
│  - Search Providers (Google, DDG, Bing)                      │
└──────────────────────────────────────────────────────────────┘
```

## Request Flow

### Standard Page Request
```
User Browser
    │
    ├─▶ GET /
    │
    ├─▶ Laravel Router (routes/web.php)
    │
    ├─▶ ItemController@dash
    │       │
    │       ├─▶ Check user authentication
    │       ├─▶ Fetch user settings (treat_tags_as)
    │       ├─▶ Query items based on view mode:
    │       │     - Categories: Items with children
    │       │     - Tags: All items with tag relationships
    │       │     - Default: Flat list with dashboard tag
    │       ├─▶ Apply role-based filtering (if enabled)
    │       └─▶ Return view with data
    │
    └─▶ Blade Template (welcome.blade.php)
            │
            ├─▶ Layout (layouts/app.blade.php)
            ├─▶ Partials:
            │     - taglist.blade.php (category/tag navigation)
            │     - search.blade.php (search bar)
            │     - sortable.blade.php (tile grid)
            ├─▶ JavaScript initialization:
            │     - Sortable.create() for drag-drop
            │     - Event handlers for search, config mode
            │     - Live stats polling (if enhanced apps)
            └─▶ Rendered HTML
```

### AJAX Request (Enhanced App Stats)
```
JavaScript Timer (liveStatRefresh.js)
    │
    ├─▶ GET /get_stats/{item_id}
    │
    ├─▶ ItemController@getStats
    │       │
    │       ├─▶ Load Item from DB
    │       ├─▶ Get config (API URL, credentials)
    │       ├─▶ Instantiate Enhanced App class
    │       ├─▶ Call app->livestats()
    │       │       │
    │       │       ├─▶ HTTP request to external API (Guzzle)
    │       │       ├─▶ Parse API response
    │       │       └─▶ Render stats blade template
    │       │
    │       └─▶ Return JSON { status, html }
    │
    └─▶ Update tile DOM with stats HTML
```

### Drag-Drop Reordering
```
User drags tile
    │
    ├─▶ Sortable.js onEnd event
    │
    ├─▶ POST /order
    │       {
    │         order: [23, 45, 12, 67, ...]  // item IDs in new order
    │       }
    │
    ├─▶ ItemController@setOrder
    │       │
    │       └─▶ Loop through IDs, update each item.order
    │
    └─▶ Success (no UI update needed, already moved)
```

## Data Models

### Item Model (Central Entity)

```php
Item {
    id: int
    title: string
    url: string
    colour: string|null         // Hex color for tile background
    icon: string|null           // Path to icon or URL
    description: text|null      // JSON config for enhanced apps
    pinned: boolean             // Show on dashboard
    order: int                  // Sort order
    type: int                   // 0=item, 1=tag
    user_id: int                // 0=shared, >0=user-specific
    appid: string|null          // Reference to Application
    class: string|null          // PHP class for enhanced app
    role: string|null           // Required role (if RBAC enabled)
    deleted_at: timestamp|null  // Soft delete
    created_at: timestamp
    updated_at: timestamp

    // Relationships
    tags() -> Collection<Item>          // Tags this item belongs to
    parents() -> BelongsToMany<Item>    // Via item_tag pivot
    children() -> BelongsToMany<Item>   // Items within this tag
    user() -> BelongsTo<User>

    // Scopes
    scopePinned() -> only pinned items
    scopeOfType($type) -> items or tags

    // Accessors
    link -> computed URL (tag links vs external links)
    linkTarget -> _blank or current window
    droppable -> CSS class for drag-drop

    // Methods
    enhanced() -> bool              // Has config for enhanced app
    enabled() -> bool               // Enhanced app is configured
    getconfig() -> object           // Parse JSON description
    getTagClass() -> string         // CSS classes for filtering
}
```

### Application Model (App Repository)

```php
Application {
    appid: string (primary key)    // Unique identifier
    name: string                    // Display name
    sha: string|null                // Git SHA for versioning
    icon: string|null               // Icon filename
    website: string|null            // Official website
    license: string|null            // License type
    description: string|null        // App description
    enhanced: boolean               // Has API integration
    tile_background: string         // 'light' or 'dark'
    class: string|null              // PHP class name
    created_at: timestamp
    updated_at: timestamp

    // Methods
    icon() -> string                        // Copy icon to storage, return path
    iconView() -> string                    // Asset URL for icon
    defaultColour() -> string               // #fafbfc or #161b1f
    class() -> string                       // Full namespaced class
    static apps() -> Collection             // Load from supportedapps.json
    static single($appid) -> object         // Get single app details
    static getApp($appid) -> Application    // Download/update app files
}
```

### Setting Model (Configuration)

```php
Setting {
    id: int
    group_id: int                   // SettingGroup FK
    key: string                     // Unique identifier
    type: string                    // text, boolean, select, image, textarea
    options: string|null            // JSON for select options
    label: string                   // Display name
    value: string|null              // Default value
    order: int                      // Display order
    system: boolean                 // Global vs user-specific

    // Relationships
    group() -> BelongsTo<SettingGroup>
    users() -> BelongsToMany<User>  // User overrides

    // Methods
    static fetch($key) -> mixed         // Get for current user
    getListValueAttribute -> string     // Formatted for display
    getEditValueAttribute -> string     // HTML form field
}
```

### User Model

```php
User {
    id: int
    username: string
    email: string
    password: string (hashed)
    autologin_token: string|null    // UUID for passwordless login
    created_at: timestamp
    updated_at: timestamp

    // Relationships
    items() -> HasMany<Item>
    settings() -> BelongsToMany<Setting>

    // Methods
    static currentUser() -> User    // From session or guest
    getId() -> int                  // 0 for guest
}
```

## Enhanced Apps System

### Architecture

```
Enhanced App Flow:
1. User creates item, selects app from dropdown
2. JavaScript loads app details via /appload AJAX
3. If enhanced, config form is injected (blade template)
4. User fills config (API URL, key, etc.)
5. Optional: Test Config button validates connection
6. Config saved as JSON in item.description
7. On dashboard, JavaScript polls /get_stats/{id}
8. Backend instantiates app class, calls livestats()
9. App makes API request, parses response
10. Stats rendered via app's livestats.blade.php
11. HTML injected into tile
```

### Enhanced App Class Structure

```php
namespace App\SupportedApps\{AppName};

use App\SupportedApps;
use GuzzleHttp\Exception\GuzzleException;

class {AppName} extends SupportedApps implements \App\EnhancedApps {
    public $config;  // Injected from item.description

    // Test API connection
    public function test() {
        $url = $this->config->url . 'api/endpoint';
        $attrs = ['headers' => ['X-Api-Key' => $this->config->apikey]];
        return $this->appTest($url, $attrs);
    }

    // Get live stats
    public function livestats() {
        $status = 'inactive';
        $data = [];

        try {
            $url = $this->config->url . 'api/stats';
            $attrs = ['headers' => ['X-Api-Key' => $this->config->apikey]];
            $response = $this->execute($url, $attrs);

            if ($response && $response->getStatusCode() === 200) {
                $json = json_decode($response->getBody());
                $status = 'active';
                $data = [
                    'stat1' => $json->value1,
                    'stat2' => $json->value2,
                    // ... extract relevant data
                ];
            }
        } catch (GuzzleException $e) {
            // Log error, return inactive
        }

        return $this->getLiveStats($status, $data);
    }
}
```

### App Installation Flow

```
1. User selects app from autocomplete
2. ItemController@appload() called
3. Application::single($appid) loads from JSON cache
4. Application::getApp($appid) checks:
   a. Does app folder exist locally?
   b. Is app in database?
   c. Does SHA match cached version?
5. If missing or outdated:
   a. Download ZIP from {APP_SOURCE}files/{sha}.zip
   b. Extract to app/SupportedApps/{AppName}/
   c. Save to applications table
6. Return app details to frontend (icon, color, config form)
```

## Frontend Architecture

### JavaScript Structure

```javascript
// app.js (main entry point)
- Sortable initialization
- Event delegation for dynamic content
- Search filtering
- Config mode toggle
- Test config AJAX
- Form handling

// keyBindings.js
- Keyboard shortcuts (ESC, Enter, etc.)

// liveStatRefresh.js
- Polling mechanism for enhanced apps
- Variable interval (slower when idle)
- Error handling and retry logic

// itemExport.js / itemImport.js
- JSON backup/restore functionality
```

### Component Hierarchy (Blade)

```
layouts/app.blade.php
├─ partials/head.blade.php (meta, CSS)
├─ partials/header.blade.php (logo, config button)
├─ @yield('content')
│   ├─ welcome.blade.php (dashboard)
│   │   ├─ partials/taglist.blade.php (category nav)
│   │   ├─ partials/search.blade.php (search bar)
│   │   └─ sortable.blade.php (tile grid)
│   │       └─ item.blade.php (single tile)
│   ├─ items/list.blade.php (items management)
│   ├─ items/create.blade.php (add item form)
│   ├─ items/edit.blade.php (edit item form)
│   └─ settings/index.blade.php (settings list)
└─ partials/footer.blade.php (scripts)
```

### State Management

Currently relies on:
- **DOM state**: CSS classes for filtering, visibility
- **jQuery data attributes**: Store IDs, tags
- **Session storage**: Search provider selection
- **AJAX polling**: Live stats refresh
- **Server sessions**: User authentication, settings

No centralized state management (no Redux/Vuex equivalent).

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │───┐
│ username        │   │
│ email           │   │
│ password        │   │
│ autologin_token │   │
└─────────────────┘   │
                      │
                      │ user_id (FK)
                      │
┌─────────────────┐   │      ┌─────────────────┐
│  applications   │   │      │     items       │
│─────────────────│   │      │─────────────────│
│ appid (PK)      │───┼─────▶│ id (PK)         │◀───┐
│ name            │   │      │ title           │    │
│ sha             │   │      │ url             │    │
│ icon            │   │      │ colour          │    │
│ enhanced        │   │      │ icon            │    │
│ tile_background │   │      │ description     │    │ item_id (FK)
│ class           │   │      │ pinned          │    │
└─────────────────┘   │      │ order           │    │
                      │      │ type            │    │
                      └─────▶│ user_id (FK)    │    │
                             │ appid (FK)      │    │
                             │ class           │    │
                             │ role            │    │
                             │ deleted_at      │    │
                             └─────────────────┘    │
                                    ▲               │
                                    │               │
                                    │ tag_id (FK)   │
                                    │               │
                             ┌──────┴──────────┐    │
                             │   item_tag      │────┘
                             │─────────────────│
                             │ item_id (FK)    │
                             │ tag_id (FK)     │
                             └─────────────────┘

┌─────────────────┐        ┌─────────────────┐
│ setting_groups  │        │    settings     │
│─────────────────│        │─────────────────│
│ id (PK)         │◀───────│ id (PK)         │◀───┐
│ name            │        │ group_id (FK)   │    │
│ icon            │        │ key             │    │
│ order           │        │ type            │    │
└─────────────────┘        │ options         │    │
                           │ label           │    │
                           │ value           │    │
                           │ order           │    │ setting_id (FK)
                           │ system          │    │
                           └─────────────────┘    │
                                                  │
                           ┌──────────────────────┘
                           │   setting_user
                           │──────────────────
                           │ setting_id (FK)
                           │ user_id (FK)
                           │ uservalue
                           └──────────────────
```

### Key Indexes

```sql
-- items table
PRIMARY KEY (id)
INDEX (user_id)
INDEX (appid)
INDEX (type)
INDEX (pinned)
INDEX (order)
INDEX (deleted_at)  -- for soft deletes

-- item_tag pivot
PRIMARY KEY (item_id, tag_id)
INDEX (tag_id)

-- applications table
PRIMARY KEY (appid)
INDEX (name)
INDEX (enhanced)

-- settings table
PRIMARY KEY (id)
UNIQUE (key)
INDEX (group_id)

-- users table
PRIMARY KEY (id)
UNIQUE (email)
UNIQUE (username)
INDEX (autologin_token)
```

## Security Architecture

### Authentication

- **Session-based**: Laravel's default session driver
- **Cookie**: XSRF-TOKEN for CSRF protection
- **Auto-login**: UUID token in database
- **Guest access**: user_id = 0 for shared items

### Authorization

```php
// Global scope on Item model
static::addGlobalScope('user_id', function (Builder $builder) {
    $current_user = User::currentUser();
    if ($current_user) {
        $builder->where('user_id', $current_user->getId())
                ->orWhere('user_id', 0);  // Include shared
    } else {
        $builder->where('user_id', 0);  // Guest: only shared
    }
});

// Middleware: CheckAllowed
// - Checks if user is admin (role-based)
// - Used on admin routes (users, settings)

// Role-based Item Filtering (optional)
// - HTTP header contains user roles
// - Filter items by item.role field
```

### SSRF Protection

```php
// ItemController@execute()
$host = parse_url($url, PHP_URL_HOST);
$ip = gethostbyname($host);

$allowInternalIps = env('ALLOW_INTERNAL_REQUESTS', false);
if (!$allowInternalIps &&
    filter_var($ip, FILTER_VALIDATE_IP,
              FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
    abort(403, 'Access to private or reserved IPs is not allowed.');
}
```

### Input Validation

- **Form requests**: Laravel validation rules
- **SVG sanitization**: `enshrined/svg-sanitize` library
- **Image validation**: `getimagesize()` checks
- **SQL injection**: Eloquent ORM (parameterized queries)
- **XSS**: Blade `{{ }}` auto-escaping

## Deployment Architecture

### Docker Container Structure

```
┌─────────────────────────────────────────┐
│  LinuxServer.io Heimdall Container      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  Nginx (web server)               │ │
│  │  - Serves static assets           │ │
│  │  - Reverse proxy to PHP-FPM       │ │
│  └───────────┬───────────────────────┘ │
│              │                          │
│  ┌───────────▼───────────────────────┐ │
│  │  PHP-FPM 8.2                      │ │
│  │  - Executes Laravel application   │ │
│  │  - Extensions: gd, sqlite, curl   │ │
│  └───────────┬───────────────────────┘ │
│              │                          │
│  ┌───────────▼───────────────────────┐ │
│  │  Laravel Application              │ │
│  │  - /app (code)                    │ │
│  │  - /config (mapped volume)        │ │
│  │  - /storage (mapped volume)       │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │  Persistent Volumes     │
    │  - SQLite database      │
    │  - Uploaded icons       │
    │  - Settings/cache       │
    └─────────────────────────┘
```

### Reverse Proxy Setup

```nginx
# Nginx reverse proxy config
location / {
    proxy_pass http://heimdall:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Important: Set APP_URL in .env to match external URL
# This ensures asset URLs and redirects work correctly
```

## Performance Considerations

### Current Bottlenecks

1. **N+1 Queries**: Some views don't eager load relationships
2. **No caching**: Settings fetched per request
3. **Synchronous API calls**: Enhanced app stats block rendering
4. **No CDN**: Assets served from app
5. **SQLite limits**: Single write at a time

### Optimization Opportunities

1. **Database**: Add indexes, eager loading, query optimization
2. **Caching**: Redis for sessions, settings, app list
3. **Queue**: Background jobs for app downloads, stats polling
4. **CDN**: CloudFlare or similar for static assets
5. **HTTP/2**: Server push for critical assets
6. **Database**: PostgreSQL for better concurrency

---

This architecture is solid for a homelab/small team application but would need significant enhancements for high-traffic or enterprise use cases.
