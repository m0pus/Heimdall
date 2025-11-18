<?php

namespace Tests\Feature;

use App\Setting;
use App\SettingGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_get_all_settings(): void
    {
        $response = $this->getJson('/api/settings');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'groups' => [
                    '*' => ['id', 'title', 'order']
                ],
                'settings' => [
                    '*' => ['id', 'group_id', 'key', 'type', 'options', 'label', 'value', 'order', 'system']
                ],
            ],
        ]);

        $data = $response->json('data');

        // Verify we have 4 setting groups (System, Appearance, Miscellaneous, Advanced)
        $this->assertCount(4, $data['groups']);

        // Verify we have 13 settings
        $this->assertCount(13, $data['settings']);
    }

    public function test_can_update_non_system_setting(): void
    {
        // Find a non-system setting (background_image)
        $setting = Setting::where('key', 'background_image')->first();
        $this->assertNotNull($setting);
        $this->assertEquals(0, $setting->system);

        $response = $this->putJson("/api/settings/{$setting->id}", [
            'value' => 'test-value.jpg',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
        ]);

        // Verify the setting was updated in the database
        $setting->refresh();
        $this->assertEquals('test-value.jpg', $setting->value);
    }

    public function test_cannot_update_system_setting(): void
    {
        // Find a system setting (version)
        $setting = Setting::where('key', 'version')->first();
        $this->assertNotNull($setting);
        $this->assertEquals(1, $setting->system);

        $originalValue = $setting->value;

        $response = $this->putJson("/api/settings/{$setting->id}", [
            'value' => 'hacked-version',
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'error',
            'message' => 'System settings cannot be modified',
        ]);

        // Verify the setting was NOT updated
        $setting->refresh();
        $this->assertEquals($originalValue, $setting->value);
    }

    public function test_can_update_boolean_setting(): void
    {
        $setting = Setting::where('key', 'homepage_search')->first();
        $this->assertNotNull($setting);
        $this->assertEquals('boolean', $setting->type);

        $response = $this->putJson("/api/settings/{$setting->id}", [
            'value' => '1',
        ]);

        $response->assertStatus(200);
        $setting->refresh();
        $this->assertEquals('1', $setting->value);

        // Toggle it off
        $response = $this->putJson("/api/settings/{$setting->id}", [
            'value' => '0',
        ]);

        $response->assertStatus(200);
        $setting->refresh();
        $this->assertEquals('0', $setting->value);
    }

    public function test_can_update_select_setting(): void
    {
        $setting = Setting::where('key', 'search_provider')->first();
        $this->assertNotNull($setting);
        $this->assertEquals('select', $setting->type);

        $response = $this->putJson("/api/settings/{$setting->id}", [
            'value' => 'google',
        ]);

        $response->assertStatus(200);
        $setting->refresh();
        $this->assertEquals('google', $setting->value);
    }

    public function test_can_update_text_setting(): void
    {
        $setting = Setting::where('key', 'trianglify_seed')->first();
        $this->assertNotNull($setting);
        $this->assertEquals('text', $setting->type);

        $response = $this->putJson("/api/settings/{$setting->id}", [
            'value' => 'custom-seed',
        ]);

        $response->assertStatus(200);
        $setting->refresh();
        $this->assertEquals('custom-seed', $setting->value);
    }

    public function test_can_update_textarea_setting(): void
    {
        $setting = Setting::where('key', 'custom_css')->first();
        $this->assertNotNull($setting);
        $this->assertEquals('textarea', $setting->type);

        $customCss = 'body { background: red; }';

        $response = $this->putJson("/api/settings/{$setting->id}", [
            'value' => $customCss,
        ]);

        $response->assertStatus(200);
        $setting->refresh();
        $this->assertEquals($customCss, $setting->value);
    }

    public function test_returns_404_for_nonexistent_setting(): void
    {
        $response = $this->putJson('/api/settings/99999', [
            'value' => 'test',
        ]);

        $response->assertStatus(404);
    }

    public function test_setting_groups_are_ordered(): void
    {
        $response = $this->getJson('/api/settings');

        $groups = $response->json('data.groups');

        // Verify groups are ordered
        $this->assertEquals(0, $groups[0]['order']);
        $this->assertEquals(1, $groups[1]['order']);
        $this->assertEquals(2, $groups[2]['order']);
        $this->assertEquals(3, $groups[3]['order']);
    }

    public function test_settings_belong_to_correct_groups(): void
    {
        $response = $this->getJson('/api/settings');

        $settings = collect($response->json('data.settings'));

        // Version should be in System group (group_id = 1)
        $version = $settings->firstWhere('key', 'version');
        $this->assertEquals(1, $version['group_id']);

        // Background image should be in Appearance group (group_id = 2)
        $bgImage = $settings->firstWhere('key', 'background_image');
        $this->assertEquals(2, $bgImage['group_id']);

        // Homepage search should be in Miscellaneous group (group_id = 3)
        $search = $settings->firstWhere('key', 'homepage_search');
        $this->assertEquals(3, $search['group_id']);

        // Custom CSS should be in Advanced group (group_id = 4)
        $customCss = $settings->firstWhere('key', 'custom_css');
        $this->assertEquals(4, $customCss['group_id']);
    }

    public function test_all_setting_types_are_present(): void
    {
        $response = $this->getJson('/api/settings');

        $settings = collect($response->json('data.settings'));

        $types = $settings->pluck('type')->unique()->sort()->values()->toArray();

        // Verify we have all 5 setting types
        $this->assertContains('text', $types);
        $this->assertContains('select', $types);
        $this->assertContains('boolean', $types);
        $this->assertContains('image', $types);
        $this->assertContains('textarea', $types);
    }

    public function test_backward_compatibility_with_heimdall(): void
    {
        // Test that all expected Heimdall settings exist
        $expectedKeys = [
            'version',
            'background_image',
            'homepage_search',
            'search_provider',
            'language',
            'trianglify',
            'trianglify_seed',
            'window_target',
            'support',
            'donate',
            'custom_css',
            'custom_js',
            'treat_tags_as',
        ];

        $response = $this->getJson('/api/settings');
        $settings = collect($response->json('data.settings'));

        foreach ($expectedKeys as $key) {
            $setting = $settings->firstWhere('key', $key);
            $this->assertNotNull($setting, "Setting '$key' should exist for Heimdall compatibility");
        }
    }

    public function test_can_delete_image_setting(): void
    {
        $setting = Setting::where('key', 'background_image')->first();
        $this->assertNotNull($setting);
        $this->assertEquals('image', $setting->type);

        // Set a value first
        $setting->value = 'test-image.jpg';
        $setting->save();

        $response = $this->deleteJson("/api/settings/{$setting->id}/image");

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
        ]);

        // Verify the setting value was cleared
        $setting->refresh();
        $this->assertNull($setting->value);
    }

    public function test_cannot_delete_non_image_setting(): void
    {
        $setting = Setting::where('key', 'homepage_search')->first();
        $this->assertNotNull($setting);
        $this->assertEquals('boolean', $setting->type);

        $response = $this->deleteJson("/api/settings/{$setting->id}/image");

        $response->assertStatus(400);
        $response->assertJson([
            'status' => 'error',
            'message' => 'This setting is not an image type',
        ]);
    }
}
