<?php

use Illuminate\Support\Facades\Route;
use App\Events\PingEvent;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/fire-event', function () {
    broadcast(new PingEvent('¡Hola desde el WebSocket!'))->toOthers();
    return "Evento disparado";
});