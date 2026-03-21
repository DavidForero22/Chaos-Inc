<?php
// app/Providers/AppServiceProvider.php

namespace App\Providers;

use Illuminate\Http\Request;
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
        Request::macro('shouldLog', function () {
            return !str_contains($this->path(), 'api/v1/rooms')
                || $this->isMethod('POST');
        });
    }
}
