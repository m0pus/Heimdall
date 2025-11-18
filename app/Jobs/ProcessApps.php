<?php

namespace App\Jobs;

use App\Application;
use App\Item;
use App\SupportedApps;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessApps implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     *
     * @throws GuzzleException
     */
    public function handle(): void
    {
        Log::debug('Process Apps dispatched');

        // Download and save the apps list JSON
        $response = SupportedApps::getList();
        $json = $response->getBody()->getContents(); // Convert stream to string
        Storage::disk('local')->put('supportedapps.json', $json);

        Log::info('[ProcessApps] supportedapps.json downloaded and saved');

        // Parse the JSON and sync all apps to database
        $appsData = json_decode($json);
        if (isset($appsData->apps)) {
            Log::info('[ProcessApps] Found ' . count($appsData->apps) . ' apps in JSON');

            foreach ($appsData->apps as $appData) {
                // Create or update the application in the database
                $app = Application::firstOrNew(['appid' => $appData->appid]);
                $app->name = $appData->name;
                $app->sha = $appData->sha ?? null;
                $app->icon = 'icons/' . $appData->icon;
                $app->website = $appData->website ?? null;
                $app->license = $appData->license ?? null;
                $app->description = $appData->description ?? null;
                $app->enhanced = $appData->enhanced ?? 0;
                $app->tile_background = $appData->tile_background ?? 'light';

                // Generate class name
                $className = preg_replace('/[^\p{L}\p{N}]/u', '', $appData->name);
                $app->class = \App\SupportedApps::class . '\\' . $className . '\\' . $className;

                $app->save();
            }

            Log::info('[ProcessApps] Synced ' . count($appsData->apps) . ' apps to database');
        }

        // Download files for items that are using enhanced apps but don't have the files yet
        $items = Item::whereNotNull('class')->get();
        Log::info('[ProcessApps] Checking ' . $items->count() . ' items for missing app files');

        foreach ($items as $item) {
            if (! file_exists(app_path('SupportedApps/'.Item::nameFromClass($item->class)))) {
                $app = Application::where('class', $item->class)->first();
                if ($app) {
                    Log::debug('[ProcessApps] Downloading files for app: ' . $app->name);
                    Application::getApp($app->appid);
                }
            }
        }

        Log::info('[ProcessApps] Complete');
    }
}
