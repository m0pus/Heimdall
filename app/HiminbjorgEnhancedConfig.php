<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HiminbjorgEnhancedConfig extends Model
{
    protected $table = 'himinbjorg_enhanced_config';

    protected $fillable = [
        'item_id',
        'poll_interval',
        'enable_background_polling',
        'notify_on_error',
        'custom_settings',
    ];

    protected $casts = [
        'poll_interval' => 'integer',
        'enable_background_polling' => 'boolean',
        'notify_on_error' => 'boolean',
        'custom_settings' => 'array',
    ];

    /**
     * Soft reference to Item (no FK constraint for backward compatibility)
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Get stats for this item
     */
    public function stats()
    {
        return HiminbjorgEnhancedStat::where('item_id', $this->item_id)->first();
    }
}
