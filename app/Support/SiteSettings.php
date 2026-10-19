<?php

namespace App\Support;

use App\Models\SiteSetting;
use Throwable;

/**
 * Key/value site settings, ported from the original src/lib/settings.ts.
 */
class SiteSettings
{
    public const THEMES = ['bloom', 'ocean', 'sunset', 'forest'];

    private static ?array $cache = null;

    public static function defaults(): array
    {
        return [
            'siteName' => 'Boy Scouts of the Philippines',
            'tagline' => 'Laging Handa — Always Prepared',
            'theme' => 'forest',
            'allowRegistration' => true,
            'welcomeMessage' => 'Welcome to the Boy Scouts of the Philippines eLearning Portal — a home on the trail for Scouts, Scout Leaders, and Council Admins. Learn the Scout Oath and Law, earn your badges, and always be prepared.',
            'maintenanceMode' => false,
            'supportEmail' => 'support@bsp.org.ph',
            'mascotName' => 'Handa',
            'logoUrl' => '',
            'faviconUrl' => '/images/logo.svg',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function all(): array
    {
        if (self::$cache !== null) {
            return self::$cache;
        }

        try {
            $map = SiteSetting::query()->pluck('value', 'key')->all();
            $defaults = self::defaults();

            $theme = $map['theme'] ?? null;
            if (! is_string($theme) || ! in_array($theme, self::THEMES, true)) {
                $theme = $defaults['theme'];
            }

            self::$cache = [
                'siteName' => self::str($map['siteName'] ?? null, $defaults['siteName']),
                'tagline' => self::str($map['tagline'] ?? null, $defaults['tagline']),
                'theme' => $theme,
                'allowRegistration' => (($map['allowRegistration'] ?? 'true') === 'true'),
                'welcomeMessage' => self::str($map['welcomeMessage'] ?? null, $defaults['welcomeMessage']),
                'maintenanceMode' => (($map['maintenanceMode'] ?? 'false') === 'true'),
                'supportEmail' => self::str($map['supportEmail'] ?? null, $defaults['supportEmail']),
                'mascotName' => self::str($map['mascotName'] ?? null, $defaults['mascotName']),
                'logoUrl' => self::str($map['logoUrl'] ?? null, $defaults['logoUrl']),
                'faviconUrl' => self::str($map['faviconUrl'] ?? null, $defaults['faviconUrl']),
            ];
        } catch (Throwable) {
            self::$cache = self::defaults();
        }

        return self::$cache;
    }

    /**
     * Merge and persist a partial set of settings.
     *
     * @param  array<string, mixed>  $next
     * @return array<string, mixed>
     */
    public static function save(array $next): array
    {
        $merged = array_merge(self::all(), $next);

        $entries = [
            'siteName' => (string) $merged['siteName'],
            'tagline' => (string) $merged['tagline'],
            'theme' => (string) $merged['theme'],
            'allowRegistration' => $merged['allowRegistration'] ? 'true' : 'false',
            'welcomeMessage' => (string) $merged['welcomeMessage'],
            'maintenanceMode' => $merged['maintenanceMode'] ? 'true' : 'false',
            'supportEmail' => (string) $merged['supportEmail'],
            'mascotName' => (string) $merged['mascotName'],
            'logoUrl' => (string) $merged['logoUrl'],
            'faviconUrl' => (string) $merged['faviconUrl'],
        ];

        foreach ($entries as $key => $value) {
            SiteSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        self::$cache = $merged;

        return $merged;
    }

    public static function flush(): void
    {
        self::$cache = null;
    }

    private static function str(mixed $value, string $fallback): string
    {
        return (is_string($value) && $value !== '') ? $value : $fallback;
    }
}
