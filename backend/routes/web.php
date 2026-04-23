<?php

use Illuminate\Support\Facades\Route;
use App\Events\PingEvent;

Route::get('/', function () {
    return view('welcome');
});