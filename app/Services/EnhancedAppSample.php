<?php

namespace App\Services;

use Illuminate\Support\Str;

class EnhancedAppSample
{
    public static function build(object $app, int $index): array
    {
        $stats = self::extractStatDefinitions($app, $index);
        $iconUrl = self::iconUrl($app->icon ?? null);
        $colour = ($app->tile_background ?? 'dark') === 'light' ? '#fafbfc' : '#161b1f';

        return [
            'appid' => $app->appid,
            'name' => $app->name,
            'description' => $app->description,
            'icon' => $iconUrl,
            'colour' => $colour,
            'tile_background' => $app->tile_background,
            'stats' => $stats,
        ];
    }

    protected static function extractStatDefinitions(object $app, int $seed): array
    {
        $className = preg_replace('/[^\p{L}\p{N}]/u', '', $app->name);
        $path = app_path('SupportedApps/'.$className.'/livestats.blade.php');

        if (! file_exists($path)) {
            return static::fallbackStats($seed);
        }

        $contents = file_get_contents($path);
        if (! $contents) {
            return static::fallbackStats($seed);
        }

        libxml_use_internal_errors(true);
        $dom = new \DOMDocument();
        $loaded = @$dom->loadHTML('<?xml encoding="utf-8"?>'.$contents);
        libxml_clear_errors();

        if (! $loaded) {
            return static::fallbackStats($seed);
        }

        $entries = [];
        $liNodes = $dom->getElementsByTagName('li');
        $position = 0;

        foreach ($liNodes as $li) {
            $label = null;
            $valueHtml = null;

            foreach ($li->childNodes as $child) {
                if ($child->nodeType === XML_ELEMENT_NODE && $child->nodeName === 'span') {
                    $classAttr = $child->attributes->getNamedItem('class')?->nodeValue;
                    if ($classAttr && strpos($classAttr, 'title') !== false) {
                        $label = trim($child->textContent);
                    }
                }

                if ($child->nodeType === XML_ELEMENT_NODE && $child->nodeName === 'strong') {
                    $valueHtml = $dom->saveHTML($child);
                    break;
                }
            }

            if (! $label) {
                $label = 'Metric '.(++$position);
            }

            if (! $valueHtml) {
                $valueHtml = $dom->saveHTML($li);
            }

            $variable = self::detectVariableName($valueHtml);
            $entries[$label] = self::sampleValue($label, $variable, $seed + $position);
            $position++;
        }

        if (empty($entries)) {
            return static::fallbackStats($seed);
        }

        return $entries;
    }

    protected static function detectVariableName(string $html): ?string
    {
        if (preg_match('/\$([A-Za-z0-9_]+)/', $html, $matches)) {
            return $matches[1];
        }

        return null;
    }

    protected static function sampleValue(string $label, ?string $variable, int $seed)
    {
        $key = Str::lower($variable ?? $label);

        if (Str::contains($key, ['uptime', 'runtime', 'time'])) {
            $days = ($seed % 5) + 1;
            $hours = (($seed + 2) * 3) % 24;
            return $days.'d '.$hours.'h';
        }

        if (Str::contains($key, ['queue', 'missing', 'alerts', 'todos'])) {
            return ($seed * 2) % 17;
        }

        if (Str::contains($key, ['error', 'failed', 'warning'])) {
            return $seed % 2;
        }

        if (Str::contains($key, ['download', 'upload', 'speed', 'bandwidth', 'requests'])) {
            return (($seed + 5) * 7).' / min';
        }

        if (Str::contains($key, ['users', 'sessions', 'items', 'movies', 'shows'])) {
            return ($seed % 9) + 3;
        }

        return ($seed + 2) * 3;
    }

    protected static function fallbackStats(int $seed): array
    {
        return [
            'Status' => $seed % 2 === 0 ? 'OK' : 'Warn',
            'Requests' => 100 + ($seed % 20),
            'Queue' => ($seed * 3) % 11,
        ];
    }

    protected static function iconUrl(?string $icon): string
    {
        if ($icon) {
            $path = public_path('storage/'.$icon);
            if (file_exists($path)) {
                return asset('storage/'.$icon);
            }
        }

        return asset('img/heimdall-icon-small.png');
    }
}
