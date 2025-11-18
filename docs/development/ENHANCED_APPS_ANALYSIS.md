# Enhanced Apps System - Analysis & Modernization Plan

## Current Heimdall Implementation Analysis

### Overview

Heimdall's enhanced apps system allows tiles to display live statistics from integrated applications (Plex, Radarr, Sonarr, etc.). The system uses client-side polling to fetch stats from the backend, which then makes API calls to each application.

### Architecture Components

#### 1. Enhanced App Interface

**Location:** `app/EnhancedApps.php`

```php
interface EnhancedApps {
    public function test();      // Test API connection
    public function livestats(); // Fetch live statistics
    public function url($endpoint); // Build API URLs
}
```

#### 2. Base Class

**Location:** `app/SupportedApps.php`

- Provides HTTP client (Guzzle)
- 15-second timeout for API requests
- Cookie jar support for session-based auth
- SSL verification disabled (security concern)
- Normalizes URLs (adds/removes trailing slashes)

#### 3. Enhanced App Implementation Example

**Location:** `app/SupportedApps/Heimdall/Heimdall.php`

```php
class Heimdall extends \App\SupportedApps implements \App\EnhancedApps {
    public $config; // Injected configuration

    public function livestats() {
        $res = parent::execute($this->url('health'));
        $details = json_decode($res->getBody());

        $data = [
            'items' => $details->items,
            'users' => $details->users,
        ];

        return parent::getLiveStats($status, $data);
    }
}
```

#### 4. Configuration Storage

**Database Field:** `items.description` (stores JSON config)

Example config structure from `supportedapps.json`:

```json
{
  "name": "Bazarr",
  "enhanced": true,
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
  }
}
```

**Config Field Types:**
- `url` - Base URL (required)
- `apikey` - API token/key
- `username` - Username for authentication
- `password` - Password (masked in forms)
- `override_url` - Override the item URL for API calls
- `enabled` - Enable/disable stat polling
- `dataonly` - Reduce polling frequency (30s instead of 5s)

#### 5. Client-Side Polling

**Location:** `resources/assets/js/liveStatRefresh.js`

```javascript
// Polling intervals
REFRESH_INTERVAL_SMALL = 5000;   // 5 seconds (active)
REFRESH_INTERVAL_BIG = 30000;     // 30 seconds (dataonly)
QUEUE_PROCESSING_INTERVAL = 1000; // 1 second queue processor

// Queue system to prevent overwhelming the server
- Creates queue of update jobs
- Processes one job per second
- Pauses when browser tab is hidden
- Adjusts interval based on status (active/inactive)
```

**Request Flow:**
1. Frontend polls `GET /get_stats/{id}` every 5-30 seconds
2. Backend calls `ItemController@getStats`
3. Controller instantiates enhanced app class
4. Injects config from `item.description` JSON
5. Calls `livestats()` method
6. App makes API request to external service
7. Returns HTML fragment with stats
8. Frontend replaces `.livestats-container` innerHTML

#### 6. Backend Controller

**Location:** `app/Http/Controllers/ItemController.php`

```php
public function getStats($id) {
    $item = Item::find($id);
    $config = $item->getconfig(); // JSON decode description field

    if (isset($item->class)) {
        $application = new $item->class;
        $application->config = $config;
        echo $application->livestats(); // Returns JSON with HTML
    }
}
```

### Current System Issues

#### 1. **Performance Problems**

- **Synchronous Polling:** Each tile polls independently every 5-30 seconds
- **No Caching:** Every request triggers a fresh API call to external service
- **Frontend Load:** With 20 enhanced tiles = 20 requests every 5 seconds = 240 requests/minute
- **Backend Blocking:** Each request blocks PHP thread for 15+ seconds (timeout)
- **N+1 Problem:** Can't batch requests to same service

#### 2. **Scalability Issues**

- **Client-Dependent:** Polling only works when browser tab is open
- **Bandwidth Waste:** Multiple clients all polling same data
- **Rate Limiting:** May hit API rate limits on external services
- **Queue System:** Only prevents overwhelming browser, not server

#### 3. **Security Concerns**

- **SSL Disabled:** `verify => false` in HTTP client
- **Credentials in JSON:** API keys stored in database as plain JSON
- **No Encryption:** Description field not encrypted
- **SSRF Risk:** User-provided URLs could target internal services

#### 4. **Reliability Issues**

- **No Error Handling:** Failed requests just show empty/error state
- **No Retry Logic:** Transient failures aren't retried
- **No Fallback Data:** No stale data shown when service is down
- **Timeout Issues:** 15s timeout can make UI feel sluggish

#### 5. **Developer Experience**

- **Tight Coupling:** Enhanced apps must return HTML (not data)
- **No Testing:** Hard to test without real external services
- **Dynamic Class Loading:** Enhanced apps loaded from remote ZIP files
- **Code Execution Risk:** Downloading and executing PHP from remote source

## Proposed Modern Architecture

### Goals

1. ✅ **Decouple polling from user sessions** - Use Laravel scheduled jobs
2. ✅ **Cache stats in database** - Reduce API calls to external services
3. ✅ **Return JSON instead of HTML** - Let frontend handle rendering
4. ✅ **Implement proper error handling** - Graceful degradation
5. ✅ **Add rate limiting** - Respect external API limits
6. ✅ **Improve security** - Encrypt credentials, enable SSL
7. ✅ **Make testable** - Mock external services in tests

### New Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (SolidJS)                      │
│  - Fetches cached stats from /api/items/{id}/stats         │
│  - No polling (uses fresh cached data)                     │
│  - Renders stats in React components                       │
│  - Real-time updates via WebSocket (future)                │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Laravel 11)                      │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │         API Endpoint: /api/items/{id}/stats        │   │
│  │  - Returns cached stats from database              │   │
│  │  - Includes timestamp, status, error state         │   │
│  │  - No external API calls                           │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │ Reads from                           │
│                     ▼                                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │            Database: item_stats table              │   │
│  │  - id, item_id, stats (JSON), status, error       │   │
│  │  - updated_at, created_at                          │   │
│  └──────────────────▲─────────────────────────────────┘   │
│                     │ Writes to                            │
│                     │                                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │    Scheduled Job: PollEnhancedApps (every 5 min)  │   │
│  │  - Fetches all enabled enhanced items              │   │
│  │  - Calls livestats() for each app                  │   │
│  │  - Stores results in item_stats table              │   │
│  │  - Handles errors gracefully                       │   │
│  │  - Respects rate limits                            │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │ Calls                                │
│                     ▼                                       │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Enhanced App Classes (Refactored)          │   │
│  │  - No HTML generation (return data only)           │   │
│  │  - Implements EnhancedApps interface               │   │
│  │  - Returns structured data arrays                  │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │ HTTP Requests                        │
└─────────────────────┼─────────────────────────────────────┘
                      │
                      ▼
           ┌──────────────────────────┐
           │  External Services       │
           │  - Plex, Radarr, Sonarr  │
           │  - Returns JSON data     │
           └──────────────────────────┘
```

### Database Schema

#### New Table: `item_stats`

```sql
CREATE TABLE item_stats (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT UNSIGNED NOT NULL,
    stats JSON,                    -- Structured stats data
    status ENUM('active', 'inactive', 'error') DEFAULT 'inactive',
    error_message TEXT NULL,       -- Error details if failed
    poll_interval INT DEFAULT 300, -- Seconds between polls (default 5 min)
    last_polled_at TIMESTAMP NULL, -- When last polled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_item_id (item_id),
    INDEX idx_last_polled (last_polled_at)
);
```

#### Stats JSON Structure

```json
{
  "stat1": {
    "label": "Missing Episodes",
    "value": 42,
    "unit": null
  },
  "stat2": {
    "label": "Missing Movies",
    "value": 18,
    "unit": null
  },
  "metadata": {
    "polled_at": "2025-10-16T10:30:00Z",
    "duration_ms": 234
  }
}
```

### Laravel Scheduled Job

**Location:** `app/Jobs/PollEnhancedApps.php`

```php
class PollEnhancedApps implements ShouldQueue {
    public function handle() {
        $items = Item::whereNotNull('class')
            ->whereHas('config', function($q) {
                $q->where('enabled', true);
            })
            ->get();

        foreach ($items as $item) {
            try {
                $stats = $this->fetchStats($item);

                ItemStat::updateOrCreate(
                    ['item_id' => $item->id],
                    [
                        'stats' => $stats,
                        'status' => 'active',
                        'error_message' => null,
                        'last_polled_at' => now(),
                    ]
                );
            } catch (\Exception $e) {
                ItemStat::updateOrCreate(
                    ['item_id' => $item->id],
                    [
                        'status' => 'error',
                        'error_message' => $e->getMessage(),
                        'last_polled_at' => now(),
                    ]
                );

                Log::error('Enhanced app poll failed', [
                    'item_id' => $item->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }
}
```

### Enhanced App Refactoring

**New Contract:** `app/Contracts/EnhancedAppContract.php`

```php
interface EnhancedAppContract {
    public function testConnection(): TestResult;
    public function fetchStats(): array;
    public function getConfigSchema(): array;
}
```

**Example Implementation:**

```php
class Bazarr extends SupportedApps implements EnhancedAppContract {
    public function fetchStats(): array {
        $wanted_series = $this->apiRequest('/api/episodes/wanted');
        $wanted_movies = $this->apiRequest('/api/movies/wanted');

        return [
            'missing_series' => [
                'label' => 'Missing Series',
                'value' => $wanted_series['total'] ?? 0,
            ],
            'missing_movies' => [
                'label' => 'Missing Movies',
                'value' => $wanted_movies['total'] ?? 0,
            ],
        ];
    }
}
```

### Frontend Integration

**New API Endpoint:** `GET /api/items/{id}/stats`

```php
public function stats(Item $item) {
    $stats = ItemStat::where('item_id', $item->id)->first();

    if (!$stats) {
        return response()->json([
            'status' => 'success',
            'data' => [
                'enhanced' => false,
                'stats' => null,
            ],
        ]);
    }

    return response()->json([
        'status' => 'success',
        'data' => [
            'enhanced' => true,
            'stats' => $stats->stats,
            'status' => $stats->status,
            'error' => $stats->error_message,
            'last_updated' => $stats->last_polled_at->diffForHumans(),
        ],
    ]);
}
```

**SolidJS Component:**

```typescript
const itemStats = createQuery(() => ({
  queryKey: ['item-stats', item.id],
  queryFn: () => fetchItemStats(item.id),
  refetchInterval: 60000, // Refetch every 60s for fresh cache data
  staleTime: 30000, // Consider stale after 30s
}));
```

### Configuration Improvements

#### Encrypted Credentials

```php
// Encrypt API keys before storing
$item->description = json_encode([
    'enabled' => true,
    'url' => $data['url'],
    'apikey' => encrypt($data['apikey']), // Laravel encryption
    'username' => encrypt($data['username']),
    'password' => encrypt($data['password']),
]);

// Decrypt when needed
$config = $item->getconfig();
$config->apikey = decrypt($config->apikey);
```

#### SSL Verification

```php
// Enable SSL verification by default
$client = new Client([
    'verify' => config('app.verify_ssl', true),
    'timeout' => 15,
]);
```

### Migration Plan

1. **Phase 1: Database** (Week 1)
   - Create `item_stats` table migration
   - Add indexes for performance
   - Seed with existing items

2. **Phase 2: Backend** (Week 2-3)
   - Create `ItemStat` model
   - Implement `PollEnhancedApps` job
   - Schedule job to run every 5 minutes
   - Create stats API endpoint
   - Refactor 3-5 popular enhanced apps (Plex, Radarr, Sonarr)

3. **Phase 3: Frontend** (Week 3-4)
   - Remove `liveStatRefresh.js` polling
   - Create SolidJS stats component
   - Use TanStack Query for caching
   - Display stats in ItemTile
   - Show last updated timestamp

4. **Phase 4: Testing & Refinement** (Week 4)
   - Test with real external services
   - Monitor queue performance
   - Adjust polling intervals
   - Handle edge cases

### Benefits

1. **Performance:** 240 requests/min → 1 request/5min = 99% reduction
2. **Scalability:** Multiple users share same cached data
3. **Reliability:** Stale data shown when service is down
4. **Security:** Encrypted credentials, SSL verification
5. **UX:** Instant load (no 15s wait), graceful errors
6. **Developer:** Testable, mockable, data-focused
7. **Cost:** Reduced API calls = lower rate limit hits

### Next Steps

1. Review this plan with team
2. Get approval for architecture changes
3. Create database migration
4. Implement PollEnhancedApps job
5. Refactor Heimdall enhanced app as proof of concept
6. Test with real data
7. Roll out to other enhanced apps incrementally
