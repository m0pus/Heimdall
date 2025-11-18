<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\UserApiController;
use App\Http\Controllers\ItemRestController;
use App\Http\Controllers\TagController;
use App\Item;
use App\Application;
use App\HiminbjorgEnhancedStat;
use App\Jobs\PollEnhancedApps;
use App\Services\EnhancedAppSample;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

if (! function_exists('format_item_for_api')) {
    function format_item_for_api(Item $item, ?HiminbjorgEnhancedStat $stat = null): array
    {
        $base = $item->toArray();
        $enhanced = $item->class !== null;

        $base['enhanced'] = $enhanced;
        $base['enhanced_enabled'] = $enhanced ? $item->enabled() : false;

        $payload = build_enhanced_payload($stat);

        $base['stats'] = $payload['metrics'];
        $base['enhanced_status'] = $payload['status'];
        $base['enhanced_error'] = $payload['error'];
        $base['enhanced_last_polled_at'] = $payload['last_polled_at'];
        $base['enhanced_next_poll_at'] = $payload['next_poll_at'];
        $base['enhanced_response_time_ms'] = $payload['response_time_ms'];
        $base['enhanced_is_fresh'] = $payload['is_fresh'];
        $base['enhanced_raw_html'] = $payload['html'];

        return $base;
    }

    function build_enhanced_payload(?HiminbjorgEnhancedStat $stat): array
    {
        if (! $stat) {
            return [
                'metrics' => null,
                'status' => null,
                'error' => null,
                'last_polled_at' => null,
                'next_poll_at' => null,
                'response_time_ms' => null,
                'is_fresh' => false,
                'html' => null,
            ];
        }

        $metrics = $stat->metrics();

        return [
            'metrics' => !empty($metrics) ? $metrics : null,
            'status' => $stat->status,
            'error' => $stat->error_message,
            'last_polled_at' => optional($stat->last_polled_at)?->toIso8601String(),
            'next_poll_at' => optional($stat->next_poll_at)?->toIso8601String(),
            'response_time_ms' => $stat->response_time_ms,
            'is_fresh' => $stat->isFresh(),
            'html' => $stat->stats['html'] ?? null,
        ];
    }
}

// TODO: Add proper authentication for production
// For development, API routes are open. In production, add auth middleware.
// Route::middleware('auth:sanctum')->group(function () {

// Translations API - Get translations for frontend
Route::get('/translations/{locale?}', function ($locale = null) {
    $locale = $locale ?? \App\Setting::fetch('language') ?? config('app.locale', 'en');

    // Ensure locale exists
    if (!is_dir(lang_path($locale))) {
        $locale = 'en';
    }

    $translations = [];

    // Load all translation files for the locale
    $files = glob(lang_path($locale) . '/*.php');
    foreach ($files as $file) {
        $namespace = basename($file, '.php');
        $translations[$namespace] = require $file;
    }

    return response()->json([
        'status' => 'success',
        'data' => [
            'locale' => $locale,
            'translations' => $translations,
        ],
    ]);
});

// Items API - Consistent wrapped JSON responses
Route::get('/items', function() {
    $items = Item::where('deleted_at', null)
        ->where('type', 0)
        ->orderBy('order', 'asc')
        ->get();

    $stats = HiminbjorgEnhancedStat::whereIn('item_id', $items->pluck('id'))->get()->keyBy('item_id');

    $data = $items->map(function (Item $item) use ($stats) {
        return format_item_for_api($item, $stats->get($item->id));
    })->values();

    return response()->json([
        'status' => 'success',
        'data' => $data,
    ]);
});

Route::get('/items/{id}', function($id) {
    $item = Item::findOrFail($id);
    $stat = HiminbjorgEnhancedStat::where('item_id', $item->id)->first();

    return response()->json([
        'status' => 'success',
        'data' => format_item_for_api($item, $stat),
    ]);
});

Route::post('/items', function(Request $request) {
    $data = $request->all();
    $data['type'] = 0;

    if (config('app.debug')) {
        \Log::debug('[POST /api/items] Creating new item', [
            'title' => $request->input('title'),
            'appid' => $request->input('appid'),
            'has_config' => $request->has('config'),
        ]);
    }

    // Handle enhanced app config
    if ($request->has('config')) {
        $configInput = $request->input('config');

        // Check if config is already a JSON string (from FormData) or an object
        if (is_string($configInput)) {
            // Already JSON encoded by frontend's createFormData
            $data['description'] = $configInput;
        } else {
            // Raw object, need to encode it
            $data['description'] = Item::checkConfig($configInput);
        }

        if (config('app.debug')) {
            \Log::debug('[POST /api/items] Enhanced app config', [
                'config_input_type' => gettype($configInput),
                'config_saved' => $data['description'],
            ]);
        }

        unset($data['config']); // Remove config from data since we've moved it to description
    }

    // Set class if appid is provided
    if ($request->has('appid') && $request->input('appid') !== 'null' && $request->input('appid') !== null) {
        $app = \App\Application::single($request->input('appid'));
        if ($app) {
            $data['class'] = \App\Application::classFromName($app->name);
        }
    } else {
        $data['class'] = null;
    }

    $item = Item::create($data);

    // Sync tags if provided
    if ($request->has('tags')) {
        $tags = $request->input('tags');
        // Decode if it's a JSON string (from FormData)
        if (is_string($tags)) {
            $tags = json_decode($tags, true) ?: [];
        }
        $item->parents()->sync($tags);
    }

    return response()->json([
        'status' => 'success',
        'data' => format_item_for_api($item),
    ]);
});

Route::put('/items/{id}', function(Request $request, $id) {
    $item = Item::findOrFail($id);
    $data = $request->all();

    if (config('app.debug')) {
        \Log::debug('[PUT /api/items] Updating item', [
            'id' => $id,
            'title' => $request->input('title'),
            'appid' => $request->input('appid'),
            'has_config' => $request->has('config'),
        ]);
    }

    // Handle enhanced app config
    if ($request->has('config')) {
        $configInput = $request->input('config');

        if (config('app.debug')) {
            \Log::debug('[PUT /api/items] Config received', [
                'config_input_type' => gettype($configInput),
                'config_value' => is_string($configInput) ? $configInput : json_encode($configInput),
            ]);
        }

        // Check if config is already a JSON string (from FormData) or an object
        if (is_string($configInput)) {
            // Already JSON encoded by frontend's createFormData
            $config = $configInput;
        } else {
            // Raw object, need to encode it
            $config = Item::checkConfig($configInput);
        }

        // Don't overwrite the stored password if it wasn't submitted
        if (strpos($config, '"password":null') !== false) {
            $storedConfigObject = json_decode($item->getAttribute('description'));
            $configObject = json_decode($config);

            if ($storedConfigObject && property_exists($storedConfigObject, 'password')) {
                if (config('app.debug')) {
                    \Log::debug('[PUT /api/items] Preserving stored password');
                }
                $configObject->password = $storedConfigObject->password;
            } else {
                $configObject->password = null;
            }

            $config = json_encode($configObject);
        }

        $data['description'] = $config;
        unset($data['config']); // Remove config from data since we've moved it to description

        if (config('app.debug')) {
            \Log::debug('[PUT /api/items] Final config to save', [
                'description' => $data['description'],
            ]);
        }
    }

    // Set class if appid is provided
    if ($request->has('appid') && $request->input('appid') !== 'null' && $request->input('appid') !== null) {
        $app = \App\Application::single($request->input('appid'));
        if ($app) {
            $data['class'] = \App\Application::classFromName($app->name);
        }
    } elseif ($request->has('appid')) {
        // Explicitly set to null if appid is null/removed
        $data['class'] = null;
    }

    $item->update($data);

    // Sync tags if provided
    if ($request->has('tags')) {
        $tags = $request->input('tags');
        // Decode if it's a JSON string (from FormData)
        if (is_string($tags)) {
            $tags = json_decode($tags, true) ?: [];
        }
        $item->parents()->sync($tags);
    }

    // Reload the item to get the fresh config accessor
    $item->refresh();
    $stat = HiminbjorgEnhancedStat::where('item_id', $item->id)->first();

    return response()->json([
        'status' => 'success',
        'data' => format_item_for_api($item, $stat),
    ]);
});

Route::delete('/items/{id}', function($id) {
    $item = Item::findOrFail($id);
    $item->delete();
    return response()->json([
        'status' => 'success',
        'data' => null,
    ]);
});

Route::get('/items/{id}/refresh', function($id) {
    \Log::info('[API /items/{id}/refresh] Refresh request received', [
        'item_id' => $id,
    ]);

    $item = Item::findOrFail($id);

    \Log::info('[API /items/{id}/refresh] Item found', [
        'item_id' => $item->id,
        'title' => $item->title,
        'class' => $item->class,
        'enhanced' => $item->class !== null,
    ]);

    if ($item->class === null) {
        \Log::warning('[API /items/{id}/refresh] Item is not enhanced', [
            'item_id' => $item->id,
        ]);
        return response()->json([
            'status' => 'error',
            'message' => 'Enhanced stats are not enabled for this item.',
        ], 422);
    }

    $stat = HiminbjorgEnhancedStat::firstOrCreate(
        ['item_id' => $item->id],
        [
            'stats' => null,
            'status' => 'pending',
            'poll_count' => 0,
            'last_polled_at' => null,
            'next_poll_at' => now(),
        ]
    );

    \Log::info('[API /items/{id}/refresh] Stat record ready', [
        'item_id' => $item->id,
        'stat_id' => $stat->id,
        'current_status' => $stat->status,
    ]);

    $stat->markForImmediatePolling();

    \Log::info('[API /items/{id}/refresh] Dispatching poll job', [
        'item_id' => $item->id,
    ]);

    PollEnhancedApps::dispatch([$item->id]);

    $stat->refresh();

    \Log::info('[API /items/{id}/refresh] Refresh complete', [
        'item_id' => $item->id,
        'new_status' => $stat->status,
    ]);

    return response()->json([
        'status' => 'success',
        'data' => [
            'message' => __('app.alert.success.enhanced_refresh_triggered'),
            'item' => format_item_for_api($item, $stat),
        ],
    ]);
});

// Tags API - Consistent wrapped JSON responses
Route::get('/tags', function() {
    $tags = \App\Item::where('type', 1)
        ->where('deleted_at', null)
        ->orderBy('order', 'asc')
        ->get();

    return response()->json([
        'status' => 'success',
        'data' => $tags,
    ]);
});

Route::get('/tags/{id}', function($id) {
    $tag = \App\Item::where('type', 1)->findOrFail($id);
    return response()->json([
        'status' => 'success',
        'data' => $tag,
    ]);
});

Route::post('/tags', function(Request $request) {
    $tag = \App\Item::create(array_merge($request->all(), ['type' => 1]));
    return response()->json([
        'status' => 'success',
        'data' => $tag,
    ]);
});

Route::put('/tags/{id}', function(Request $request, $id) {
    $tag = \App\Item::where('type', 1)->findOrFail($id);
    $tag->update($request->all());
    return response()->json([
        'status' => 'success',
        'data' => $tag,
    ]);
});

Route::delete('/tags/{id}', function($id) {
    $tag = \App\Item::where('type', 1)->findOrFail($id);
    $tag->delete();
    return response()->json([
        'status' => 'success',
        'data' => null,
    ]);
});

// Applications API - includes config from JSON for enhanced apps
Route::get('/applications', function () {
    // Get apps from database
    $dbApps = \App\Application::all()->keyBy('appid');

    // Get full app details from JSON (includes config for enhanced apps)
    $jsonApps = \App\Application::apps();

    // Base URL for app icons
    $appsource = config('app.appsource', 'https://appslist.heimdall.site/');

    // Merge database and JSON data
    $applications = $jsonApps->map(function($jsonApp) use ($dbApps, $appsource) {
        $dbApp = $dbApps->get($jsonApp->appid);

        // Build full icon URL
        $iconUrl = $jsonApp->icon;
        if (strpos($iconUrl, 'http') !== 0) {
            // Not a full URL, build it from appsource
            if (strpos($iconUrl, 'icons/') === 0) {
                // Already has icons/ prefix
                $iconUrl = $appsource . $iconUrl;
            } else {
                // Add icons/ prefix
                $iconUrl = $appsource . 'icons/' . $iconUrl;
            }
        }

        // Return JSON app data with database fields and full icon URL
        return (object) array_merge(
            (array) $jsonApp,
            [
                'icon' => $iconUrl,  // Override with full URL
            ],
            $dbApp ? [
                'class' => $dbApp->class,
                'created_at' => $dbApp->created_at,
                'updated_at' => $dbApp->updated_at,
            ] : []
        );
    })->values();

    return response()->json([
        'status' => 'success',
        'data' => $applications,
    ]);
});

Route::get('/applications/{appid}', function ($appid) {
    $app = \App\Application::where('appid', $appid)->firstOrFail();
    return response()->json([
        'status' => 'success',
        'data' => $app,
    ]);
});

// Load app details for form (enhanced app support)
Route::post('/appload', [App\Http\Controllers\ItemController::class, 'appload']);

// Test enhanced app configuration
Route::post('/testConfig', [App\Http\Controllers\ItemController::class, 'testConfig']);

// User info
Route::get('/user', function (Request $request) {
    return $request->user();
});

// Background settings - Get trianglify and background_image settings
Route::get('/background', function () {
    $trianglify = \App\Setting::fetch('trianglify');
    $trianglify_seed = \App\Setting::fetch('trianglify_seed') ?: 'heimdall';
    $background_image = \App\Setting::fetch('background_image');

    return response()->json([
        'status' => 'success',
        'data' => [
            'trianglify' => $trianglify === '1' || $trianglify === 'true',
            'trianglify_seed' => $trianglify_seed,
            'background_image' => $background_image ? url('storage/' . $background_image) : null,
        ],
    ]);
});

// Settings API - Get all settings
Route::get('/settings', function () {
    $groups = \App\SettingGroup::orderBy('order')->get();
    $settings = \App\Setting::orderBy('group_id')->orderBy('order')->get();

    return response()->json([
        'status' => 'success',
        'data' => [
            'groups' => $groups,
            'settings' => $settings,
        ],
    ]);
});

// Download/update enhanced apps from repository
Route::post('/applications/download', function () {
    try {
        \Illuminate\Support\Facades\Log::info('[Download Apps] Starting download process...');

        // Get count before
        $appsBefore = \App\Application::count();
        \Illuminate\Support\Facades\Log::info("[Download Apps] Apps in database before: {$appsBefore}");

        // Run the job synchronously
        \App\Jobs\ProcessApps::dispatchSync();

        // Get count after
        $appsAfter = \App\Application::count();
        $newApps = $appsAfter - $appsBefore;
        \Illuminate\Support\Facades\Log::info("[Download Apps] Apps in database after: {$appsAfter}");

        // Check if supportedapps.json was updated
        $jsonPath = storage_path('app/supportedapps.json');
        if (file_exists($jsonPath)) {
            $fileTime = date('Y-m-d H:i:s', filemtime($jsonPath));
            \Illuminate\Support\Facades\Log::info("[Download Apps] supportedapps.json last modified: {$fileTime}");
        } else {
            \Illuminate\Support\Facades\Log::warning('[Download Apps] supportedapps.json not found!');
        }

        // Count enhanced apps
        $enhancedApps = \App\Application::where('enhanced', 1)->count();
        \Illuminate\Support\Facades\Log::info("[Download Apps] Enhanced apps: {$enhancedApps}");

        // Build success message
        if ($newApps > 0) {
            $message = "Successfully synced {$appsAfter} apps from repository ({$newApps} new apps added).\n\n";
        } else {
            $message = "Successfully synced {$appsAfter} apps from repository (all apps up to date).\n\n";
        }
        $message .= "Enhanced apps available: {$enhancedApps}";

        \Illuminate\Support\Facades\Log::info("[Download Apps] {$message}");

        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => [
                'total_apps' => $appsAfter,
                'enhanced_apps' => $enhancedApps,
                'new_apps' => $newApps,
            ],
        ]);
    } catch (\Exception $e) {
        \Illuminate\Support\Facades\Log::error('[Download Apps] Error: ' . $e->getMessage());
        \Illuminate\Support\Facades\Log::error('[Download Apps] Stack trace: ' . $e->getTraceAsString());

        return response()->json([
            'status' => 'error',
            'message' => 'Failed to download apps: ' . $e->getMessage(),
        ], 500);
    }
});

// Enhanced Apps - Trigger manual refresh of all enhanced apps
Route::post('/enhanced-apps/refresh', function () {
    // Mark all enhanced app stats for immediate polling
    $stats = HiminbjorgEnhancedStat::all();
    foreach ($stats as $stat) {
        $stat->markForImmediatePolling();
    }

    // Dispatch job immediately (don't wait for scheduled time)
    PollEnhancedApps::dispatch();

    return response()->json([
        'status' => 'success',
        'message' => __('app.alert.success.enhanced_refreshing'),
        'data' => [
            'items_queued' => $stats->count(),
        ],
    ]);
});

// Enhanced Apps - Get stats for a specific item
Route::get('/items/{id}/stats', function($id) {
    $item = Item::findOrFail($id);
    $cached = HiminbjorgEnhancedStat::where('item_id', $id)->first();
    $payload = build_enhanced_payload($cached);

    return response()->json([
        'status' => 'success',
        'data' => [
            'enhanced' => $item->class !== null,
            'stats' => $payload['metrics'],
            'cached' => (bool) $cached,
            'stat_status' => $payload['status'],
            'error' => $payload['error'],
            'last_polled_at' => $payload['last_polled_at'],
            'next_poll_at' => $payload['next_poll_at'],
            'response_time_ms' => $payload['response_time_ms'],
            'is_fresh' => $payload['is_fresh'],
            'raw_html' => $payload['html'],
        ],
    ]);
});

Route::get('/enhanced-apps/samples', function () {
    $apps = Application::apps()->filter(fn ($app) => $app->enhanced ?? false)->values();

    $samples = [];
    foreach ($apps as $index => $app) {
        $samples[] = EnhancedAppSample::build($app, $index);
    }

    return response()->json([
        'status' => 'success',
        'data' => $samples,
    ]);
});

// Update a setting
Route::put('/settings/{id}', function (Request $request, $id) {
    $setting = \App\Setting::findOrFail($id);

    // System settings cannot be modified
    if ($setting->system) {
        return response()->json([
            'status' => 'error',
            'message' => 'System settings cannot be modified',
        ], 403);
    }

    $value = $request->input('value');
    $setting->value = $value;
    $setting->save();

    return response()->json([
        'status' => 'success',
        'data' => $setting,
    ]);
});

// Delete uploaded image
Route::delete('/settings/{id}/image', function ($id) {
    $setting = \App\Setting::findOrFail($id);

    if ($setting->type !== 'image') {
        return response()->json([
            'status' => 'error',
            'message' => 'This setting is not an image type',
        ], 400);
    }

    // Delete the file if it exists
    if ($setting->value && \Storage::disk('public')->exists($setting->value)) {
        \Storage::disk('public')->delete($setting->value);
    }

    // Clear the setting
    $setting->value = null;
    $setting->save();

    return response()->json([
        'status' => 'success',
        'message' => 'Image deleted',
    ]);
});

// User management API
Route::get('/users', [UserApiController::class, 'index']);
Route::post('/users', [UserApiController::class, 'store']);
Route::put('/users/{user}', [UserApiController::class, 'update']);
Route::delete('/users/{user}', [UserApiController::class, 'destroy']);

// });
