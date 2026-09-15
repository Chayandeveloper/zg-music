<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Exception;

class YouTubeMusicService
{
    protected string $baseUrl;
    protected int $timeout;
    protected int $cacheTtl;
    protected bool $enabled;

    public function __construct()
    {
        $config = config('services.youtube_music', []);
        $this->baseUrl = rtrim($config['url'] ?? 'http://127.0.0.1:8001', '/');
        $this->timeout = (int) ($config['timeout'] ?? 4);
        $this->cacheTtl = (int) ($config['cache_ttl'] ?? 3600);
        $this->enabled = (bool) ($config['enabled'] ?? true);
    }

    /**
     * Check if the YouTube Music Python service is configured and reachable.
     */
    public function isAvailable(): bool
    {
        if (!$this->enabled) {
            return false;
        }

        return Cache::remember('ytmusic:is_healthy', 30, function () {
            try {
                $response = Http::timeout(2)->get("{$this->baseUrl}/health");
                return $response->successful() && ($response->json('status') === 'healthy');
            } catch (Exception $e) {
                Log::debug("YouTube Music service health check failed: " . $e->getMessage());
                return false;
            }
        });
    }

    /**
     * Perform unified or filtered search via the Python service.
     */
    public function search(string $query, ?string $filter = null, int $limit = 10): array
    {
        if (!$this->enabled || empty(trim($query))) {
            return $this->emptySearchResponse($query);
        }

        $cacheKey = 'ytmusic:search:' . md5("{$query}:{$filter}:{$limit}");

        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        try {
            $params = ['q' => $query, 'limit' => $limit];
            if ($filter) {
                $params['filter'] = $filter;
            }

            $response = Http::timeout($this->timeout)->get("{$this->baseUrl}/api/v1/search", $params);

            if ($response->successful()) {
                $data = $response->json();
                if ($filter) {
                    $res = [
                        'query' => $query,
                        'filter' => $filter,
                        'results' => $data,
                        'source' => 'YOUTUBE_MUSIC',
                        'available' => true,
                    ];
                } else {
                    $data['available'] = true;
                    $res = $data;
                }
                Cache::put($cacheKey, $res, $this->cacheTtl);
                return $res;
            }

            Log::warning("YouTube Music service returned HTTP {$response->status()} for query: {$query}");
            return $this->emptySearchResponse($query);
        } catch (Exception $e) {
            Log::warning("YouTube Music service search error: " . $e->getMessage());
            return $this->emptySearchResponse($query);
        }
    }

    /**
     * Retrieve single song metadata by YouTube video ID.
     */
    public function getSong(string $videoId): ?array
    {
        if (!$this->enabled || empty($videoId)) {
            return null;
        }

        $cacheKey = 'ytmusic:song:' . $videoId;

        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        try {
            $response = Http::timeout($this->timeout)->get("{$this->baseUrl}/api/v1/songs/{$videoId}");
            if ($response->successful()) {
                $data = $response->json();
                Cache::put($cacheKey, $data, $this->cacheTtl);
                return $data;
            }
            return null;
        } catch (Exception $e) {
            Log::warning("YouTube Music service getSong error for {$videoId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Retrieve artist details, top tracks, and albums by channel/browse ID.
     */
    public function getArtist(string $channelId): ?array
    {
        if (!$this->enabled || empty($channelId)) {
            return null;
        }

        $cacheKey = 'ytmusic:artist:' . $channelId;

        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        try {
            $response = Http::timeout($this->timeout)->get("{$this->baseUrl}/api/v1/artists/{$channelId}");
            if ($response->successful()) {
                $data = $response->json();
                Cache::put($cacheKey, $data, $this->cacheTtl);
                return $data;
            }
            return null;
        } catch (Exception $e) {
            Log::warning("YouTube Music service getArtist error for {$channelId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Retrieve album details and tracklist by browse ID.
     */
    public function getAlbum(string $browseId): ?array
    {
        if (!$this->enabled || empty($browseId)) {
            return null;
        }

        $cacheKey = 'ytmusic:album:' . $browseId;

        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        try {
            $response = Http::timeout($this->timeout)->get("{$this->baseUrl}/api/v1/albums/{$browseId}");
            if ($response->successful()) {
                $data = $response->json();
                Cache::put($cacheKey, $data, $this->cacheTtl);
                return $data;
            }
            return null;
        } catch (Exception $e) {
            Log::warning("YouTube Music service getAlbum error for {$browseId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Retrieve playlist details and tracklist by playlist ID.
     */
    public function getPlaylist(string $playlistId, int $limit = 100): ?array
    {
        if (!$this->enabled || empty($playlistId)) {
            return null;
        }

        $cacheKey = 'ytmusic:playlist:' . $playlistId;

        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        try {
            $response = Http::timeout($this->timeout)->get("{$this->baseUrl}/api/v1/playlists/{$playlistId}", [
                'limit' => $limit,
            ]);
            if ($response->successful()) {
                $data = $response->json();
                Cache::put($cacheKey, $data, $this->cacheTtl);
                return $data;
            }
            return null;
        } catch (Exception $e) {
            Log::warning("YouTube Music service getPlaylist error for {$playlistId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Retrieve audio stream info (CDN streamUrl) for a YouTube video ID.
     */
    public function getStream(string $videoId): ?array
    {
        if (!$this->enabled || empty($videoId)) {
            return null;
        }

        $cacheKey = 'ytmusic:stream:' . $videoId;

        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        try {
            // Stream extraction may take 1-3 seconds, so use a higher timeout
            $timeout = max($this->timeout, 15);
            $response = Http::timeout($timeout)->get("{$this->baseUrl}/api/v1/stream/{$videoId}");
            if ($response->successful()) {
                $data = $response->json();
                // Cache stream URL for 3 hours (CDN URLs expire in ~6 hours)
                Cache::put($cacheKey, $data, 10800);
                return $data;
            }
            Log::warning("YouTube Music service getStream returned HTTP {$response->status()} for {$videoId}");
            return null;
        } catch (Exception $e) {
            Log::warning("YouTube Music service getStream error for {$videoId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Standard empty fallback response structure.
     */

    protected function emptySearchResponse(string $query): array
    {
        return [
            'query' => $query,
            'songs' => [],
            'artists' => [],
            'albums' => [],
            'playlists' => [],
            'available' => false,
        ];
    }
}
