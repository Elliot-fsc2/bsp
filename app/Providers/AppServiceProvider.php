<?php

namespace App\Providers;

use App\Auth\SessionTokenGuard;
use App\Support\SiteSettings;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Auth::extend('bsp', function ($app, string $name, array $config) {
            return new SessionTokenGuard(
                $app['request'],
                Auth::createUserProvider($config['provider']),
            );
        });

        // Site settings are available to every view (site name, theme, mascot…).
        View::composer('*', function ($view) {
            $view->with('settings', SiteSettings::all());
        });
    }
}
