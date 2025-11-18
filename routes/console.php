<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\PollEnhancedApps;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

/*Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->describe('Display an inspiring quote');*/

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
|
| Define scheduled jobs here using the Schedule facade.
|
*/

// Poll enhanced apps for live stats at configurable intervals
// Dispatch to queue so it runs with proper memory limit (queue worker has -d memory_limit=2G)
Schedule::call(function () {
    PollEnhancedApps::dispatch();
})
    ->everyFiveMinutes()
    ->name('poll-enhanced-apps')
    ->description('Poll enhanced apps for live statistics')
    ->withoutOverlapping()
    ->onOneServer();
