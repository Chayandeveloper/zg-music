<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\CatalogController;
use App\Http\Controllers\Api\V1\PlayerController;
use App\Http\Controllers\Api\V1\LibraryController;
use App\Http\Controllers\Api\V1\ArtistStageController;
use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\ExternalMusicController;

Route::prefix('v1')->group(function () {
    // API V1 Root
    Route::get('/', function () {
        return response()->json([
            'service' => 'Zubeefy API V1',
            'status' => 'online',
            'catalog' => [
                'home' => '/api/v1/home',
                'songs' => '/api/v1/songs',
                'artists' => '/api/v1/artists',
                'albums' => '/api/v1/albums',
                'search' => '/api/v1/search?q=Maya',
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // Health check
    Route::get('/health', function () {
        return response()->json([
            'status' => 'healthy',
            'service' => 'Zubeefy API',
            'version' => '1.0.0',
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // Public Authentication
    Route::prefix('auth')->group(function () {
        Route::post('/send-otp', [AuthController::class, 'sendOtp']);
        Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::put('/profile', [AuthController::class, 'updateProfile']);
        });
    });

    // Discovery & Public Catalog
    Route::get('/home', [HomeController::class, 'index']);
    Route::get('/search', [CatalogController::class, 'search']);
    Route::get('/genres', [CatalogController::class, 'genres']);

    Route::get('/songs', [CatalogController::class, 'songs']);
    Route::get('/songs/{id}', [CatalogController::class, 'songDetail']);

    Route::get('/albums', [CatalogController::class, 'albums']);
    Route::get('/albums/{id}', [CatalogController::class, 'albumDetail']);

    Route::get('/artists', [CatalogController::class, 'artists']);
    Route::get('/artists/{id}', [CatalogController::class, 'artistDetail']);

    // External Music Discovery (ytmusicapi Python microservice)
    Route::prefix('external')->group(function () {
        Route::get('/search', [ExternalMusicController::class, 'search']);
        Route::get('/songs/{id}', [ExternalMusicController::class, 'songDetail']);
        Route::get('/artists/{id}', [ExternalMusicController::class, 'artistDetail']);
        Route::get('/albums/{id}', [ExternalMusicController::class, 'albumDetail']);
        Route::get('/playlists/{id}', [ExternalMusicController::class, 'playlistDetail']);
        Route::get('/stream/{id}', [ExternalMusicController::class, 'stream']);
    });

    // Player & Stream Events
    Route::post('/player/track-event', [PlayerController::class, 'trackEvent']);
    Route::get('/player/stream/{id}', [PlayerController::class, 'streamInfo']);

    // Authenticated Listener Library & Social
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/songs/{id}/like', [LibraryController::class, 'toggleLike']);
        Route::get('/library/liked-songs', [LibraryController::class, 'likedSongs']);

        Route::post('/artists/{id}/follow', [LibraryController::class, 'toggleFollow']);
        Route::get('/library/followed-artists', [LibraryController::class, 'followedArtists']);

        Route::get('/playlists', [LibraryController::class, 'playlists']);
        Route::post('/playlists', [LibraryController::class, 'createPlaylist']);
        Route::get('/playlists/{id}', [LibraryController::class, 'showPlaylist']);
        Route::delete('/playlists/{id}', [LibraryController::class, 'deletePlaylist']);
        Route::post('/playlists/{id}/songs', [LibraryController::class, 'addSongToPlaylist']);
        Route::delete('/playlists/{id}/songs/{songId}', [LibraryController::class, 'removeSongFromPlaylist']);

        Route::get('/library/history', [LibraryController::class, 'playHistory']);
    });

    // Zubeen Stage (Artist Publishing)
    Route::prefix('artist')->middleware('auth:sanctum')->group(function () {
        Route::post('/apply', [ArtistStageController::class, 'apply']);
        Route::get('/application-status', [ArtistStageController::class, 'applicationStatus']);

        Route::get('/dashboard', [ArtistStageController::class, 'dashboard']);
        Route::post('/uploads/audio', [ArtistStageController::class, 'uploadAudio']);
        Route::post('/releases', [ArtistStageController::class, 'submitRelease']);
        Route::get('/releases', [ArtistStageController::class, 'listReleases']);
        Route::get('/releases/{id}', [ArtistStageController::class, 'releaseDetail']);
        Route::get('/songs', [ArtistStageController::class, 'mySongs']);
        Route::get('/analytics', [ArtistStageController::class, 'analytics']);
    });

    // Admin & Moderation Console
    Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'users']);

        Route::get('/applications', [AdminController::class, 'applications']);
        Route::post('/applications/{id}/review', [AdminController::class, 'reviewApplication']);

        Route::get('/releases', [AdminController::class, 'releases']);
        Route::post('/releases/{id}/review', [AdminController::class, 'reviewRelease']);

        Route::get('/songs', [AdminController::class, 'songs']);
        Route::patch('/songs/{id}/status', [AdminController::class, 'updateSongStatus']);

        Route::get('/reports', [AdminController::class, 'reports']);
        Route::post('/reports/{id}/resolve', [AdminController::class, 'resolveReport']);

        Route::get('/audit-logs', [AdminController::class, 'auditLogs']);
    });
});
