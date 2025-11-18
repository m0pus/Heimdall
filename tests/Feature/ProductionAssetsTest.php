<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionAssetsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_main_page_loads_successfully(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertViewIs('react');
    }

    public function test_blade_template_includes_app_div(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertSee('<div id="app">', false);
    }

    public function test_production_assets_are_referenced(): void
    {
        // Set environment to production
        config(['app.env' => 'production']);

        $response = $this->get('/');

        $html = $response->getContent();

        // In production, should reference built assets from public/build/
        // NOT the Vite dev server
        $this->assertStringNotContainsString('localhost:5173', $html);
        $this->assertStringNotContainsString('@vite/client', $html);

        // Should contain either:
        // 1. The actual built asset paths (if manifest exists)
        // 2. Or the vite tags for local dev
        $this->assertStringContainsString('app', $html);
    }

    public function test_built_assets_exist(): void
    {
        // Check that build directory exists
        $this->assertDirectoryExists(public_path('build'));

        // Check that manifest exists
        $this->assertFileExists(public_path('build/.vite/manifest.json'));

        // Parse manifest
        $manifest = json_decode(file_get_contents(public_path('build/.vite/manifest.json')), true);

        // Verify app entry point exists
        $this->assertArrayHasKey('resources/js/app.tsx', $manifest);

        $entry = $manifest['resources/js/app.tsx'];

        // Verify JS file exists
        $jsFile = public_path('build/' . $entry['file']);
        $this->assertFileExists($jsFile, "Built JS file should exist at: {$jsFile}");

        // Verify CSS file exists
        $this->assertArrayHasKey('css', $entry);
        $this->assertIsArray($entry['css']);
        $this->assertNotEmpty($entry['css']);

        $cssFile = public_path('build/' . $entry['css'][0]);
        $this->assertFileExists($cssFile, "Built CSS file should exist at: {$cssFile}");

        // Verify files are not empty
        $this->assertGreaterThan(0, filesize($jsFile), "JS file should not be empty");
        $this->assertGreaterThan(0, filesize($cssFile), "CSS file should not be empty");
    }

    public function test_built_js_contains_expected_code(): void
    {
        $manifest = json_decode(file_get_contents(public_path('build/.vite/manifest.json')), true);
        $entry = $manifest['resources/js/app.tsx'];
        $jsFile = public_path('build/' . $entry['file']);

        $jsContent = file_get_contents($jsFile);

        // Should be minified (no excessive whitespace)
        $lines = explode("\n", $jsContent);
        $this->assertLessThan(100, count($lines), "Minified JS should have fewer lines");

        // Should contain SolidJS runtime
        $this->assertStringContainsString('solid', strtolower($jsContent));
    }

    public function test_custom_css_is_included(): void
    {
        // Set custom CSS
        $customCss = 'body { background: red; }';
        \App\Setting::where('key', 'custom_css')->update(['value' => $customCss]);

        $response = $this->get('/');

        $response->assertSee('custom_css', false);
        $response->assertSee($customCss, false);
    }

    public function test_custom_js_is_included(): void
    {
        // Set custom JS
        $customJs = 'console.log("Custom JS loaded");';
        \App\Setting::where('key', 'custom_js')->update(['value' => $customJs]);

        $response = $this->get('/');

        $response->assertSee('custom_js', false);
        $response->assertSee($customJs, false);
    }
}
