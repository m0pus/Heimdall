# Enhanced Apps Architecture - Heimdall Compatibility

## Overview

Heimdall's Enhanced Apps system allows tiles to display live statistics from the applications they link to (e.g., Plex showing number of streams, Sonarr showing missing episodes). This document explains how the system works and how we need to implement it in the new SolidJS frontend.

## Key Concepts

### 1. **Enhanced Apps vs Regular Apps**

- **Regular App**: Just a link with an icon and color
- **Enhanced App**: Has API integration that can display live stats on the tile

### 2. **How Enhanced Apps are Identified**

Enhanced apps implement the `EnhancedApps` interface:

```php
interface EnhancedApps
{
    public function test();      // Test API connection
    public function livestats(); // Fetch current stats
    public function url($endpoint); // Build API URLs
}
```

### 3. **Configuration Storage**

Enhanced app configuration is stored as **JSON in the `description` field** of the `items` table:

```json
{
  "enabled": true,
  "url": "https://plex.example.com",
  "override_url": null,
  "apikey": "abc123...",
  "username": "admin",
  "password": "secret"
}
```

**Important Fields:**
- `enabled`: Whether to show live stats
- `url`: The app's URL (can be overridden)
- `override_url`: Alternative URL for API calls
- `apikey`: API key for authentication
- Custom fields per app (username, password, etc.)

### 4. **Application Repository**

Apps are downloaded from a central repository (default: https://appslist.heimdall.site/):

**Supported Apps JSON** (`storage/app/supportedapps.json`):
```json
{
  "appcount": 491,
  "apps": [
    {
      "appid": "085f0b437f9bf9c98bb68b745c8dcf323a7e0499",
      "name": "Bazarr",
      "website": "https://github.com/morpheus65535/bazarr",
      "license": "GNU General Public License v3.0 only",
      "description": "Bazarr manages and downloads subtitles...",
      "enhanced": true,
      "tile_background": "dark",
      "icon": "bazarr.png",
      "config": {
        "type": "apikey",
        "stat1": {
          "name": "missing series",
          "url": ":url:/api/episodes/wanted?apikey=:apikey:",
          "key": "total",
          "filter": "none",
          "updateOnChange": "No"
        },
        "stat2": {
          "name": "missing movies",
          "url": ":url:/api/movies/wanted?apikey=:apikey:",
          "key": "total",
          "filter": "none",
          "updateOnChange": "No"
        }
      },
      "sha": "a148eaae15f095c0cba8ca14c14927cf847be182"
    }
  ]
}
```

### 5. **Dynamic Configuration UI**

Each enhanced app has a Blade template for its config form:

**File**: `resources/views/SupportedApps/{AppName}/config.blade.php`

Example (Bazarr):
```blade
<h2>{{ __('app.apps.config') }} ({{ __('app.optional') }})</h2>
<div class="items">
    <div class="input">
        <label>{{ strtoupper(__('app.url')) }}</label>
        {!! Form::text('config[override_url]', null, ['placeholder' => __('app.apps.override'), 'class' => 'form-control']) !!}
    </div>
    <div class="input">
        <label>API Key</label>
        {!! Form::text('config[apikey]', null, ['placeholder' => 'API Key', 'class' => 'form-control config-item', 'data-config' => 'apikey']) !!}
    </div>
    <div class="input">
        <button style="margin-top: 32px;" class="btn test" id="test_config">Test</button>
    </div>
</div>
```

### 6. **Item Creation Flow with Enhanced Apps**

1. User selects an enhanced app from dropdown
2. Frontend calls `/appload` with app ID
3. Backend returns app details + config template path
4. Frontend loads config template via AJAX
5. User fills in config (API key, etc.)
6. User clicks "Test" to validate config
7. Frontend calls `/testConfig` endpoint
8. Enhanced app class tests the connection
9. User saves item with config JSON in description

### 7. **Live Stats Display**

When an item has enhanced stats enabled:

1. Tile displays with special CSS class
2. JavaScript polls `/livestats/{item_id}` endpoint
3. Backend instantiates the enhanced app class
4. App fetches stats from its API
5. App renders stats using its livestats template
6. Frontend displays stats on tile

**Example Stats Template** (`resources/views/SupportedApps/Plex/livestats.blade.php`):
```blade
<ul class="livestats">
    <li>
        <span class="title">Streams</span>
        <strong>{{ $streams ?? '0' }}</strong>
    </li>
    <li>
        <span class="title">Movies</span>
        <strong>{{ $movies ?? '0' }}</strong>
    </li>
</ul>
```

## Database Schema

### Items Table

```sql
CREATE TABLE items (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    colour VARCHAR(20),
    icon VARCHAR(255),
    description TEXT,              -- JSON config for enhanced apps!
    pinned BOOLEAN DEFAULT 0,
    order INTEGER DEFAULT 0,
    type INTEGER DEFAULT 0,        -- 0=item, 1=tag
    user_id INTEGER DEFAULT 0,
    appid VARCHAR(255),            -- Links to applications.appid
    class VARCHAR(255),            -- PHP class name (e.g., "App\SupportedApps\Plex")
    appdescription TEXT,           -- Human-readable description
    role VARCHAR(255),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Applications Table

```sql
CREATE TABLE applications (
    id INTEGER PRIMARY KEY,
    appid VARCHAR(255) UNIQUE,     -- Unique identifier from repository
    name VARCHAR(255),
    sha VARCHAR(255),              -- Version hash
    icon VARCHAR(255),
    website VARCHAR(255),
    license VARCHAR(255),
    description TEXT,
    enhanced BOOLEAN DEFAULT 0,    -- Is this an enhanced app?
    tile_background VARCHAR(20),   -- "light" or "dark"
    class VARCHAR(255),            -- PHP class path
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Key Backend Endpoints

### 1. Load App Details
```
POST /appload
Body: { app: "appid", item_id: 123 }
Response: {
    "name": "Bazarr",
    "appid": "085f0b437...",
    "iconview": "https://.../icons/bazarr.png",
    "colour": "#161b1f",
    "description": "Bazarr manages...",
    "custom": "Bazarr.config",     // Config template to load
    "appvalue": "{\"enabled\":true,\"apikey\":\"...\"}"  // Existing config
}
```

### 2. Test Configuration
```
POST /testConfig
Body: {
    data: {
        type: "appid",
        url: "https://bazarr.example.com",
        apikey: "abc123",
        id: 123  // item id (optional, for edit mode)
    }
}
Response: {
    "code": 200,
    "status": "Successfully communicated with the API",
    "response": "..."
}
```

### 3. Get Live Stats
```
GET /livestats/{item_id}
Response: {
    "status": "success",
    "html": "<ul class='livestats'>...</ul>"
}
```

### 4. Refresh Stats
```
POST /items/{item_id}/refresh
Response: {
    "status": "success",
    "html": "<ul class='livestats'>...</ul>"
}
```

## Item Model Key Methods

### `enhanced(): bool`
```php
public function enhanced(): bool
{
    return $this->description !== null;
}
```

### `enabled(): bool`
```php
public function enabled(): bool
{
    if ($this->enhanced()) {
        $config = $this->getconfig();
        if ($config) {
            return (bool) $config->enabled;
        }
    }
    return false;
}
```

### `getconfig(): object`
```php
public function getconfig()
{
    if (!isset($this->description) || empty($this->description)) {
        $config = new stdClass;
        $config->enabled = false;
        $config->override_url = null;
        $config->apikey = null;
        return $config;
    }

    $config = json_decode($this->description);
    $config->url = $this->url;

    if (isset($config->override_url) && !empty($config->override_url)) {
        $config->url = $config->override_url;
    } else {
        $config->override_url = null;
    }

    return $config;
}
```

## Frontend Implementation Requirements

### 1. Enhanced ItemForm Component

The ItemForm needs to:

- Display enhanced app config fields when an enhanced app is selected
- Load config template from backend
- Populate fields with existing config values (edit mode)
- Provide "Test" button to validate config
- Store config as JSON in the description field

### 2. Enhanced ItemTile Component

The ItemTile needs to:

- Check if item has `enhanced` flag and `enabled` in config
- Poll live stats endpoint periodically
- Display stats overlay on tile
- Handle loading/error states
- Support manual refresh button

### 3. New API Endpoints Needed

```typescript
// resources/js/api/applications.ts
export const applicationsApi = {
  // ... existing methods ...

  // Load app details for form
  loadApp: async (appid: string, itemId?: number) => {
    const response = await apiClient.post('/appload', { app: appid, item_id: itemId });
    return response.data;
  },

  // Test enhanced app config
  testConfig: async (data: any) => {
    const response = await apiClient.post('/testConfig', { data });
    return response.data;
  },
};

// resources/js/api/items.ts
export const itemsApi = {
  // ... existing methods ...

  // Get live stats for enhanced item
  getLiveStats: async (id: number) => {
    const response = await apiClient.get(`/livestats/${id}`);
    return response.data;
  },

  // Refresh stats
  refreshStats: async (id: number) => {
    const response = await apiClient.post(`/items/${id}/refresh`);
    return response.data;
  },
};
```

### 4. Enhanced App Config Form Structure

```tsx
// When enhanced app is selected, show:
<Show when={selectedApp()?.enhanced}>
  <div class="enhanced-config">
    <h3>Enhanced App Configuration</h3>

    {/* Override URL */}
    <div class="input">
      <label>Override URL (Optional)</label>
      <input
        type="url"
        value={config().override_url || ''}
        onInput={(e) => setConfig({ ...config(), override_url: e.currentTarget.value })}
        placeholder="Leave empty to use main URL"
      />
    </div>

    {/* Dynamic fields based on app type */}
    <Show when={selectedApp()?.config?.type === 'apikey'}>
      <div class="input">
        <label>API Key</label>
        <input
          type="text"
          value={config().apikey || ''}
          onInput={(e) => setConfig({ ...config(), apikey: e.currentTarget.value })}
          required
        />
      </div>
    </Show>

    <Show when={selectedApp()?.config?.type === 'password'}>
      <div class="input">
        <label>Username</label>
        <input
          type="text"
          value={config().username || ''}
          onInput={(e) => setConfig({ ...config(), username: e.currentTarget.value })}
        />
      </div>
      <div class="input">
        <label>Password</label>
        <input
          type="password"
          value={config().password || ''}
          onInput={(e) => setConfig({ ...config(), password: e.currentTarget.value })}
          placeholder={editingItem() ? "Leave blank to keep current" : ""}
        />
      </div>
    </Show>

    {/* Enable stats toggle */}
    <div class="input">
      <label>
        <input
          type="checkbox"
          checked={config().enabled || false}
          onChange={(e) => setConfig({ ...config(), enabled: e.currentTarget.checked })}
        />
        Enable live stats
      </label>
    </div>

    {/* Test button */}
    <Button
      type="button"
      onClick={testConfig}
      isLoading={testingConfig()}
    >
      Test Configuration
    </Button>
  </div>
</Show>
```

### 5. Live Stats Polling

```tsx
// In ItemTile component
const [stats, setStats] = createSignal<string | null>(null);

// Poll every 60 seconds if enabled
createEffect(() => {
  if (!props.item.enabled()) return;

  const interval = setInterval(async () => {
    try {
      const result = await itemsApi.getLiveStats(props.item.id);
      setStats(result.html);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, 60000);

  // Fetch immediately
  itemsApi.getLiveStats(props.item.id)
    .then(result => setStats(result.html))
    .catch(console.error);

  onCleanup(() => clearInterval(interval));
});

// Display stats
<Show when={stats()}>
  <div class="stats-overlay" innerHTML={stats()!} />
</Show>
```

## Security Considerations

1. **Password Handling**: Passwords are stored in JSON but should not be sent back to frontend when editing
2. **SSRF Protection**: Backend validates URLs to prevent internal network access
3. **API Key Exposure**: Never log or expose API keys in responses
4. **SVG Sanitization**: Icons are sanitized to prevent XSS

## Backward Compatibility

To ensure backward compatibility with existing Heimdall installations:

1. **Keep `description` field as JSON storage**
2. **Preserve `class` field** (PHP class name)
3. **Maintain `appid` linking** to applications table
4. **Support same config structure**
5. **Use same API endpoints** (or create compatible ones)
6. **Respect `enabled` flag** in config

## Next Steps for Implementation

1. ✅ Understand architecture (this document)
2. 🔲 Add config fields to ItemForm component
3. 🔲 Create `/appload` API endpoint
4. 🔲 Create `/testConfig` API endpoint
5. 🔲 Add live stats polling to ItemTile
6. 🔲 Test with common enhanced apps (Plex, Sonarr, etc.)
7. 🔲 Document any deviations from Heimdall
