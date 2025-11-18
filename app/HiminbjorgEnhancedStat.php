<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class HiminbjorgEnhancedStat extends Model
{
    protected $fillable = [
        'item_id',
        'stats',
        'status',
        'error_message',
        'response_time_ms',
        'last_polled_at',
        'next_poll_at',
        'poll_count',
    ];

    protected $casts = [
        'stats' => 'array',
        'last_polled_at' => 'datetime',
        'next_poll_at' => 'datetime',
        'poll_count' => 'integer',
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
     * Get Himinbjörg config for this item
     */
    public function config()
    {
        return HiminbjorgEnhancedConfig::where('item_id', $this->item_id)->first();
    }

    /**
     * Check if cached data is still fresh
     */
    public function isFresh(): bool
    {
        if (!$this->last_polled_at) {
            return false;
        }

        // Get poll interval from config or use default
        $pollInterval = $this->config()?->poll_interval ?? Setting::fetch('enhanced_poll_interval') ?? 300;

        return $this->last_polled_at->gt(now()->subSeconds($pollInterval));
    }

    /**
     * Check if this item needs polling
     */
    public function needsPolling(): bool
    {
        // Never polled
        if (!$this->next_poll_at) {
            return true;
        }

        // Next poll time has passed
        return now()->gte($this->next_poll_at);
    }

    /**
     * Mark as needing immediate polling
     */
    public function markForImmediatePolling(): void
    {
        $this->update(['next_poll_at' => now()]);
    }

    /**
     * Normalized metrics extracted from cached stats data.
     */
    public function metrics(): array
    {
        $stats = $this->stats ?? [];
        $data = $stats['data'] ?? null;

        if (!is_array($data) || empty($data)) {
            $data = $this->parseHtmlMetrics($stats['html'] ?? null);
        }

        if (!is_array($data) || empty($data)) {
            return [];
        }

        $normalized = [];
        $index = 1;
        foreach ($data as $key => $value) {
            $label = is_string($key) && $key !== '' ? Str::headline($key) : 'Metric '.$index;
            $normalized[$label] = $this->stringifyMetricValue($value);
            $index++;
        }

        return $normalized;
    }

    protected function stringifyMetricValue($value): string
    {
        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        if (is_scalar($value)) {
            return (string) $value;
        }

        if ($value === null) {
            return '-';
        }

        return trim(strip_tags(is_string($value) ? $value : json_encode($value)));
    }

    protected function parseHtmlMetrics(?string $html): array
    {
        if (empty($html)) {
            return [];
        }

        libxml_use_internal_errors(true);
        $doc = new \DOMDocument();
        $loaded = $doc->loadHTML('<?xml encoding="utf-8"?>'.$html);
        libxml_clear_errors();

        if (! $loaded) {
            return [];
        }

        $entries = [];
        $index = 1;

        foreach ($doc->getElementsByTagName('li') as $li) {
            $label = null;
            $value = null;

            foreach ($li->childNodes as $node) {
                if ($node->nodeType === XML_ELEMENT_NODE && $node->nodeName === 'span') {
                    /** @var \DOMElement $node */
                    if ($node->hasAttribute('class') && $node->getAttribute('class') === 'title') {
                        $label = trim($node->textContent);
                    }
                }

                if ($node->nodeType === XML_ELEMENT_NODE && $node->nodeName === 'strong') {
                    $value = trim($node->textContent);
                }
            }

            if ($value === null) {
                $value = trim($li->textContent);
            }

            $label = $label ?: 'Metric '.$index;
            $entries[$label] = $value;
            $index++;
        }

        return $entries;
    }
}
