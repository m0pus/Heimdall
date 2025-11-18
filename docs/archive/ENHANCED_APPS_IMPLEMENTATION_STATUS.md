# Enhanced Apps Implementation Status

## Overview

This document tracks the implementation of Heimdall's Enhanced Apps system in the new SolidJS frontend to maintain backward compatibility with the original Heimdall application.

## ✅ Completed

### 1. **Architecture Analysis**
- ✅ Documented complete enhanced apps system in [ENHANCED_APPS_ARCHITECTURE.md](ENHANCED_APPS_ARCHITECTURE.md)
- ✅ Understood how config is stored (JSON in `description` field)
- ✅ Identified key endpoints and data flow
- ✅ Mapped out database schema requirements

### 2. **Backend API Endpoints**

#### Updated `/api/applications` endpoint
**File**: [routes/api.php](routes/api.php#L126-L153)

**What it does**: Merges database applications with JSON file data to include `config` field for enhanced apps

**Before**:
```php
Route::get('/applications', function () {
    $applications = \App\Application::all();
    return response()->json(['status' => 'success', 'data' => $applications]);
});
```

**After**:
```php
Route::get('/applications', function () {
    $dbApps = \App\Application::all()->keyBy('appid');
    $jsonApps = \App\Application::apps();

    // Merge to include config field from JSON
    $applications = $jsonApps->map(function($jsonApp) use ($dbApps) {
        $dbApp = $dbApps->get($jsonApp->appid);
        return (object) array_merge(
            (array) $jsonApp,
            $dbApp ? ['class' => $dbApp->class] : []
        );
    })->values();

    return response()->json(['status' => 'success', 'data' => $applications]);
});
```

**Why**: Enhanced apps have a `config` object in the JSON that defines their stats and config type. The database doesn't store this, so we merge both sources.

#### Added `/appload` endpoint
**File**: [routes/api.php](routes/api.php#L164)

```php
Route::post('/appload', [ItemController::class, 'appload']);
```

**What it does**: Returns app details for populating the item form, including:
- App name, icon, color
- Config template path (e.g., "Bazarr.config")
- Existing item config (when editing)

**Used for**: When user selects an enhanced app from dropdown in ItemForm

####Added `/testConfig` endpoint
**File**: [routes/api.php](routes/api.php#L167)

```php
Route::post('/testConfig', [ItemController::class, 'testConfig']);
```

**What it does**: Tests the enhanced app configuration by:
1. Instantiating the app's PHP class
2. Calling its `test()` method with provided config
3. Attempting to connect to the app's API
4. Returning success/failure status

**Used for**: "Test" button in enhanced app config section

### 3. **API Response Consistency Fix**

**File**: [routes/api.php](routes/api.php)

All API endpoints now return consistent wrapped responses:

```json
{
  "status": "success",
  "data": [...]
}
```

This was causing infinite query loops before (see [API_RESPONSE_FIX.md](API_RESPONSE_FIX.md))

## 🚧 In Progress / Pending

### 1. **Enhanced ItemForm Component**

**File to update**: [resources/js/components/ItemForm.tsx](resources/js/components/ItemForm.tsx)

**What needs to be added**:

```tsx
// Additional state for enhanced app config
const [config, setConfig] = createSignal<any>({
  enabled: false,
  override_url: null,
  apikey: null,
  username: null,
  password: null,
});
const [testingConfig, setTestingConfig] = createSignal(false);

// When app is selected, load its details
const handleAppSelect = async (app: Application) => {
  setSelectedAppId(app.appid);

  if (app.enhanced && props.item?.id) {
    // Load app details including existing config
    const details = await applicationsApi.loadApp(app.appid, props.item.id);

    // Populate config from existing item
    if (details.appvalue) {
      setConfig(JSON.parse(details.appvalue));
    }
  }

  // Set defaults
  if (!title()) setTitle(app.name);
  if (!colour()) setColour(app.tile_background === 'dark' ? '#161b1f' : '#fafbfc');
};

// Test configuration
const testConfig = async () => {
  setTestingConfig(true);
  try {
    const result = await applicationsApi.testConfig({
      type: selectedAppId(),
      url: url(),
      ...config(),
      id: props.item?.id,
    });

    alert(result.status); // TODO: Better UI feedback
  } catch (error) {
    alert('Configuration test failed');
  } finally {
    setTestingConfig(false);
  }
};

// On submit, include config in description
const handleSubmit = (e: Event) => {
  e.preventDefault();

  const data: Partial<Item> = {
    title: title(),
    url: url(),
    colour: colour(),
    icon: icon(),
    appid: selectedAppId() || null,
    pinned: pinned(),
    type: 0,
    // Store config as JSON in description for enhanced apps
    description: selectedApp()?.enhanced ? JSON.stringify(config()) : null,
  };

  props.onSubmit(data);
};
```

**UI to add** (after app selection):

```tsx
<Show when={selectedApp()?.enhanced}>
  <div class="space-y-4 p-4 bg-gray-50 rounded-lg">
    <h3 class="font-medium text-gray-900">Enhanced App Configuration</h3>

    {/* Override URL */}
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        API URL Override (Optional)
      </label>
      <input
        type="url"
        value={config().override_url || ''}
        onInput={(e) => setConfig({ ...config(), override_url: e.currentTarget.value })}
        placeholder="Leave empty to use main URL"
        class="input w-full"
      />
      <p class="mt-1 text-xs text-gray-500">
        Use a different URL for API calls (e.g., internal vs. external address)
      </p>
    </div>

    {/* Dynamic fields based on config type */}
    <Show when={selectedApp()?.config?.type === 'apikey'}>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          API Key <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={config().apikey || ''}
          onInput={(e) => setConfig({ ...config(), apikey: e.currentTarget.value })}
          placeholder="Enter API key"
          class="input w-full"
          required={config().enabled}
        />
      </div>
    </Show>

    <Show when={selectedApp()?.config?.type === 'password'}>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={config().username || ''}
            onInput={(e) => setConfig({ ...config(), username: e.currentTarget.value })}
            class="input w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={config().password || ''}
            onInput={(e) => setConfig({ ...config(), password: e.currentTarget.value })}
            placeholder={props.item ? "Leave blank to keep current" : ""}
            class="input w-full"
          />
        </div>
      </div>
    </Show>

    {/* Enable stats toggle */}
    <div class="flex items-center gap-2">
      <input
        type="checkbox"
        id="enable-stats"
        checked={config().enabled || false}
        onChange={(e) => setConfig({ ...config(), enabled: e.currentTarget.checked })}
        class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
      />
      <label for="enable-stats" class="text-sm font-medium text-gray-700">
        Enable live stats on tile
      </label>
    </div>

    {/* Test button */}
    <Button
      type="button"
      onClick={testConfig}
      isLoading={testingConfig()}
      variant="secondary"
    >
      Test Configuration
    </Button>

    {/* Show stats info */}
    <Show when={selectedApp()?.config?.stat1}>
      <div class="text-xs text-gray-600 space-y-1">
        <p class="font-medium">Live stats to display:</p>
        <ul class="list-disc list-inside pl-2">
          <Show when={selectedApp()!.config!.stat1}>
            <li>{selectedApp()!.config!.stat1.name}</li>
          </Show>
          <Show when={selectedApp()!.config!.stat2}>
            <li>{selectedApp()!.config!.stat2.name}</li>
          </Show>
        </ul>
      </div>
    </Show>
  </div>
</Show>
```

### 2. **Enhanced ItemTile Component**

**File to update**: [resources/js/components/ItemTile.tsx](resources/js/components/ItemTile.tsx)

**What needs to be added**:

```tsx
import { createSignal, createEffect, onCleanup, Show } from 'solid-js';

// Add stats state
const [stats, setStats] = createSignal<string | null>(null);
const [statsLoading, setStatsLoading] = createSignal(false);
const [statsError, setStatsError] = createSignal(false);

// Check if item has enhanced stats enabled
const hasLiveStats = createMemo(() => {
  if (!props.item.description) return false;

  try {
    const config = JSON.parse(props.item.description);
    return config.enabled === true;
  } catch {
    return false;
  }
});

// Poll for live stats
createEffect(() => {
  if (!hasLiveStats()) return;

  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError(false);

    try {
      const result = await itemsApi.getLiveStats(props.item.id);
      setStats(result.html);
    } catch (error) {
      console.error('Failed to fetch live stats:', error);
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch immediately
  fetchStats();

  // Poll every 60 seconds
  const interval = setInterval(fetchStats, 60000);

  onCleanup(() => clearInterval(interval));
});

// Render stats overlay
<Show when={hasLiveStats()}>
  <div class="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-2">
    <Show when={statsLoading() && !stats()}>
      <div class="animate-pulse">Loading stats...</div>
    </Show>
    <Show when={statsError()}>
      <div class="text-red-300">Failed to load stats</div>
    </Show>
    <Show when={stats()}>
      <div innerHTML={stats()!} />
    </Show>
  </div>
</Show>
```

### 3. **API Client Methods**

**File to update**: [resources/js/api/applications.ts](resources/js/api/applications.ts)

```tsx
export const applicationsApi = {
  // ... existing methods ...

  // Load app details for form (enhanced apps)
  loadApp: async (appid: string, itemId?: number): Promise<any> => {
    const response = await apiClient.post('/api/appload', { app: appid, item_id: itemId });
    return response.data;
  },

  // Test enhanced app configuration
  testConfig: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/testConfig', { data });
    return response.data;
  },
};
```

**File to update**: [resources/js/api/items.ts](resources/js/api/items.ts)

```tsx
export const itemsApi = {
  // ... existing methods ...

  // Get live stats for enhanced item
  getLiveStats: async (id: number): Promise<{ status: string; html: string }> => {
    const response = await apiClient.get(`/livestats/${id}`);
    return response.data;
  },

  // Manually refresh stats
  refreshStats: async (id: number): Promise<{ status: string; html: string }> => {
    const response = await apiClient.post(`/items/${id}/refresh`);
    return response.data;
  },
};
```

### 4. **TypeScript Types**

**File to update**: [resources/js/types/index.ts](resources/js/types/index.ts)

```tsx
// Enhanced app config structure
export interface EnhancedAppConfig {
  enabled: boolean;
  url?: string;
  override_url?: string | null;
  apikey?: string | null;
  username?: string | null;
  password?: string | null;
  [key: string]: any; // Allow custom fields per app
}

// Enhanced app stat definition
export interface EnhancedAppStat {
  name: string;
  url: string;
  key: string;
  filter: string;
  updateOnChange: string;
  suffix?: string;
}

// Enhanced app config in applications table
export interface EnhancedAppConfigDef {
  type: 'apikey' | 'password' | 'username';
  stat1?: EnhancedAppStat;
  stat2?: EnhancedAppStat;
}

// Update Application interface
export interface Application {
  appid: string;
  name: string;
  icon: string;
  website: string;
  license: string;
  description: string;
  enhanced: boolean;
  tile_background: 'light' | 'dark';
  sha: string;
  class?: string;
  config?: EnhancedAppConfigDef; // ← ADD THIS
}

// Update Item interface
export interface Item {
  id: number;
  title: string;
  url: string;
  colour: string | null;
  icon: string | null;
  description: string | null; // ← JSON config for enhanced apps
  appid: string | null;
  class: string | null;
  pinned: boolean;
  order: number;
  type: number;
  user_id: number;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
}
```

## 📋 Testing Checklist

Once implementation is complete, test with these scenarios:

### Basic Enhanced App Flow
- [ ] Select enhanced app (e.g., Bazarr) from dropdown
- [ ] Config fields appear automatically
- [ ] Enter API key
- [ ] Click "Test" button
- [ ] See success/failure message
- [ ] Enable "Show live stats"
- [ ] Save item
- [ ] Verify config stored as JSON in description field

### Editing Enhanced App
- [ ] Edit existing enhanced app item
- [ ] Config fields pre-populated
- [ ] Password field shows placeholder (not actual password)
- [ ] Change API key
- [ ] Test new config
- [ ] Save successfully

### Live Stats Display
- [ ] Enhanced app with stats enabled shows overlay on tile
- [ ] Stats update every 60 seconds
- [ ] Manual refresh works
- [ ] Error handling shows appropriate message
- [ ] Stats HTML renders correctly

### Backward Compatibility
- [ ] Import existing Heimdall database
- [ ] Enhanced items load correctly
- [ ] Config parsed from description field
- [ ] Stats display for existing items
- [ ] Can edit existing enhanced items without losing config

## 🎯 Priority Order

1. **HIGH**: Update ItemForm with enhanced app config UI
2. **HIGH**: Add API client methods (loadApp, testConfig)
3. **MEDIUM**: Add live stats to ItemTile
4. **MEDIUM**: Add TypeScript types
5. **LOW**: UI polish and error handling
6. **LOW**: Documentation for users

## 📝 Notes

- The `description` field serves dual purpose:
  - For regular items: human-readable description
  - For enhanced items: JSON config object
- Password fields should never return actual values when editing (security)
- Enhanced app PHP classes are dynamically downloaded from repository
- Stats polling should be configurable (currently hardcoded to 60s)
- Consider adding a "Refresh" button on tiles for manual stat updates

## 🔗 Related Files

- [ENHANCED_APPS_ARCHITECTURE.md](ENHANCED_APPS_ARCHITECTURE.md) - Full system architecture
- [API_RESPONSE_FIX.md](API_RESPONSE_FIX.md) - API consistency fixes
- [routes/api.php](routes/api.php) - API endpoints
- [app/Item.php](app/Item.php) - Item model with config methods
- [app/Application.php](app/Application.php) - Application model
- [storage/app/supportedapps.json](storage/app/supportedapps.json) - App repository data
