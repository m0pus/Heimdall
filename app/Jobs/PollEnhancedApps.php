<?php

namespace App\Jobs;

use App\HiminbjorgEnhancedConfig;
use App\HiminbjorgEnhancedStat;
use App\HiminbjorgPollLog;
use App\Item;
use App\Setting;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PollEnhancedApps implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of seconds the job can run before timing out.
     */
    public $timeout = 300; // 5 minutes

    /**
     * @var array<int>
     */
    protected array $itemIds;

    /**
     * Create a new job instance.
     */
    public function __construct(array $itemIds = [])
    {
        $this->itemIds = $itemIds;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Increase memory limit for enhanced apps that fetch large datasets
        $originalMemoryLimit = ini_get('memory_limit');
        ini_set('memory_limit', '512M');
        Log::info('PollEnhancedApps job started', [
            'original_memory_limit' => $originalMemoryLimit,
            'new_memory_limit' => '512M',
        ]);

        // Get all items with enhanced apps (class is not null)
        $items = Item::whereNotNull('class')
            ->where('type', 0)
            ->when(!empty($this->itemIds), function ($query) {
                $query->whereIn('id', $this->itemIds);
            })
            ->get();

        $polled = 0;
        $errors = 0;

        foreach ($items as $item) {
            // Skip if item doesn't have enhanced app enabled
            if (!$item->enabled()) {
                continue;
            }

            // Check if this item should be polled now
            $stat = HiminbjorgEnhancedStat::where('item_id', $item->id)->first();

            // If stat exists and doesn't need polling yet, skip it
            if ($stat && !$stat->needsPolling()) {
                Log::debug('Skipping enhanced app (not scheduled yet)', [
                    'item_id' => $item->id,
                    'title' => $item->title,
                    'next_poll_at' => optional($stat->next_poll_at)?->toIso8601String(),
                ]);
                continue;
            }

            // Poll this item
            $success = $this->pollItem($item, $stat);
            if ($success) {
                $polled++;
            } else {
                $errors++;
            }
        }

        Log::info("PollEnhancedApps job completed. Polled: {$polled}, Errors: {$errors}");
    }

    /**
     * Poll a single item and update its stats
     */
    protected function pollItem(Item $item, ?HiminbjorgEnhancedStat $stat): bool
    {
        $startTime = microtime(true);
        $status = 'error';
        $errorMessage = null;
        $stats = null;
        $success = false;

        try {
            // Get the item's config (from description field)
            $config = $item->getconfig();
            Log::info('Polling enhanced app', [
                'item_id' => $item->id,
                'title' => $item->title,
                'class' => $item->class,
                'config' => $this->redactConfig($config),
            ]);

            // Check if the enhanced app class exists
            if (!class_exists($item->class)) {
                throw new \Exception("Enhanced app class not found: {$item->class}");
            }

            // Instantiate the enhanced app
            $application = new $item->class;
            $application->config = $config;

            // Call livestats() method
            $result = $application->livestats();

            // Parse the JSON response
            $decoded = json_decode($result, true);

            if ($decoded && isset($decoded['status'])) {
                $status = $decoded['status'];

                // Extract stats data from the response (status/html/data)
                $stats = [
                    'status' => $decoded['status'],
                    'html' => $decoded['html'] ?? null,
                    'data' => $decoded['data'] ?? null,
                    'timestamp' => now()->toIso8601String(),
                ];

                // Fix for upstream SupportedApps that return "inactive" even when data is fetched successfully
                // If we have data and no errors, override status to "active"
                if ($status === 'inactive' && !empty($decoded['data']) && is_array($decoded['data'])) {
                    $status = 'active';
                    Log::debug("Overriding status from 'inactive' to 'active' for item {$item->id} (data was successfully fetched)");
                }
            } else {
                throw new \Exception('Invalid response from livestats()');
            }

        } catch (GuzzleException $e) {
            Log::warning("Poll failed for item {$item->id} ({$item->title}): {$e->getMessage()}", [
                'exception' => $e,
            ]);
            $errorMessage = 'Connection error: ' . $e->getMessage();
            $status = 'error';
        } catch (\Throwable $e) {
            Log::error("Poll failed for item {$item->id} ({$item->title})", [
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
            ]);
            $errorMessage = $e->getMessage();
            $status = 'error';
        }

        $endTime = microtime(true);
        $responseTimeMs = (int) (($endTime - $startTime) * 1000);

        // Get poll interval for this item
        $config = HiminbjorgEnhancedConfig::where('item_id', $item->id)->first();
        $pollInterval = (int) ($config?->poll_interval ?? Setting::fetch('enhanced_poll_interval') ?? 300);

        // Update or create the stat record
        $updatedStat = HiminbjorgEnhancedStat::updateOrCreate(
            ['item_id' => $item->id],
            [
                'stats' => $stats,
                'status' => in_array($status, ['success', 'online', 'active']) ? 'active' : ($status === 'inactive' ? 'inactive' : 'error'),
                'error_message' => $errorMessage,
                'response_time_ms' => $responseTimeMs,
                'last_polled_at' => now(),
                'next_poll_at' => now()->addSeconds($pollInterval),
                'poll_count' => ($stat->poll_count ?? 0) + 1,
            ]
        );

        // Log this poll attempt
        HiminbjorgPollLog::create([
            'item_id' => $item->id,
            'status' => $errorMessage ? 'error' : 'success',
            'response_time_ms' => $responseTimeMs,
            'error_message' => $errorMessage,
            'polled_at' => now(),
        ]);

        $success = !$errorMessage && $updatedStat->status === 'active';

        if ($success) {
            Log::info('Enhanced app poll succeeded', [
                'item_id' => $item->id,
                'title' => $item->title,
                'response_time_ms' => $responseTimeMs,
                'stats_present' => !empty($stats),
            ]);
        }

        return $success;
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('PollEnhancedApps job failed: ' . $exception->getMessage());
    }

    protected function redactConfig($config): array
    {
        $array = json_decode(json_encode($config ?? []), true) ?? [];

        array_walk_recursive($array, function (&$value, $key) {
            if (is_string($key) && preg_match('/(key|token|secret|pass|password)/i', $key)) {
                $value = '***redacted***';
            }
        });

        return $array;
    }
}
