<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HiminbjorgPollLog extends Model
{
    public $timestamps = false; // Using polled_at instead

    protected $fillable = [
        'item_id',
        'status',
        'response_time_ms',
        'error_message',
        'polled_at',
    ];

    protected $casts = [
        'polled_at' => 'datetime',
        'response_time_ms' => 'integer',
    ];

    /**
     * Soft reference to Item (no FK constraint for backward compatibility)
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Get recent logs for an item
     */
    public static function getRecentForItem(int $itemId, int $limit = 10)
    {
        return static::where('item_id', $itemId)
            ->orderBy('polled_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get error rate for an item
     */
    public static function getErrorRate(int $itemId, int $hours = 24): float
    {
        $total = static::where('item_id', $itemId)
            ->where('polled_at', '>=', now()->subHours($hours))
            ->count();

        if ($total === 0) {
            return 0;
        }

        $errors = static::where('item_id', $itemId)
            ->where('polled_at', '>=', now()->subHours($hours))
            ->where('status', 'error')
            ->count();

        return ($errors / $total) * 100;
    }
}
