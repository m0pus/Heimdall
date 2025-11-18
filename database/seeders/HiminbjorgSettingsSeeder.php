<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Setting;
use App\SettingGroup;

class HiminbjorgSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds - Add Himinbjörg-specific settings
     */
    public function run(): void
    {
        // Get or create "Enhanced Apps" settings group
        $group = SettingGroup::firstOrCreate(
            ['title' => 'Enhanced Apps'],
            ['order' => 100] // Place after existing groups
        );

        // Enhanced Apps Poll Interval Setting
        Setting::firstOrCreate(
            ['key' => 'enhanced_poll_interval'],
            [
                'group_id' => $group->id,
                'type' => 'select',
                'label' => 'app.settings.enhanced_poll_interval',
                'value' => '300',
                'options' => json_encode([
                    '60' => '1 minute',
                    '180' => '3 minutes',
                    '300' => '5 minutes (default)',
                    '600' => '10 minutes',
                    '900' => '15 minutes',
                    '1800' => '30 minutes',
                    '3600' => '1 hour',
                ]),
                'order' => 1,
                'system' => 0,
            ]
        );

        // Background Polling Enabled Setting
        Setting::firstOrCreate(
            ['key' => 'enhanced_background_polling'],
            [
                'group_id' => $group->id,
                'type' => 'boolean',
                'label' => 'app.settings.enhanced_background_polling',
                'value' => '1',
                'options' => null,
                'order' => 2,
                'system' => 0,
            ]
        );
    }
}
