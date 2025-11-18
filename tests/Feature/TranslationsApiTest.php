<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TranslationsApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_get_translations_for_default_locale(): void
    {
        $response = $this->getJson('/api/translations');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'locale',
                'translations' => [
                    'app' => [],
                ],
            ],
        ]);

        $data = $response->json('data');

        // Should default to 'en'
        $this->assertEquals('en', $data['locale']);

        // Should have app translations
        $this->assertArrayHasKey('app', $data['translations']);

        // Should have settings translations
        $this->assertArrayHasKey('settings.system', $data['translations']['app']);
        $this->assertArrayHasKey('settings.appearance', $data['translations']['app']);
        $this->assertArrayHasKey('dashboard', $data['translations']['app']);
    }

    public function test_can_get_translations_for_specific_locale(): void
    {
        // Test with French
        $response = $this->getJson('/api/translations/fr');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertEquals('fr', $data['locale']);
        $this->assertArrayHasKey('app', $data['translations']);
    }

    public function test_falls_back_to_english_for_invalid_locale(): void
    {
        $response = $this->getJson('/api/translations/invalid-locale');

        $response->assertStatus(200);

        $data = $response->json('data');

        // Should fallback to English
        $this->assertEquals('en', $data['locale']);
    }

    public function test_translations_include_all_expected_keys(): void
    {
        $response = $this->getJson('/api/translations');

        $data = $response->json('data');
        $translations = $data['translations']['app'];

        // Check for key settings translations
        $expectedKeys = [
            'settings.system',
            'settings.appearance',
            'settings.miscellaneous',
            'settings.advanced',
            'settings.version',
            'settings.language',
            'dashboard',
            'buttons.save',
            'buttons.cancel',
            'buttons.add',
        ];

        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $translations, "Missing translation key: $key");
        }
    }
}
