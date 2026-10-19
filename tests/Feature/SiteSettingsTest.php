<?php

namespace Tests\Feature;

use App\Support\SiteSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        SiteSettings::flush();
    }

    public function test_falls_back_to_defaults_when_the_table_is_empty(): void
    {
        $settings = SiteSettings::all();

        $this->assertSame('forest', $settings['theme']);
        $this->assertSame('Boy Scouts of the Philippines', $settings['siteName']);
        $this->assertTrue($settings['allowRegistration']);
        $this->assertFalse($settings['maintenanceMode']);
    }

    public function test_save_persists_and_reads_back(): void
    {
        SiteSettings::save([
            'siteName' => 'BSP Test Council',
            'allowRegistration' => false,
            'theme' => 'ocean',
        ]);

        SiteSettings::flush();

        $settings = SiteSettings::all();

        $this->assertSame('BSP Test Council', $settings['siteName']);
        $this->assertFalse($settings['allowRegistration']);
        $this->assertSame('ocean', $settings['theme']);
        $this->assertDatabaseHas('site_settings', ['key' => 'siteName', 'value' => 'BSP Test Council']);
    }
}
