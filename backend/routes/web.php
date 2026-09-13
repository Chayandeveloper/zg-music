<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Zubeen Player API',
        'version' => '1.0.0',
        'status' => 'operational',
        'timestamp' => now()->toIso8601String(),
    ]);
});
