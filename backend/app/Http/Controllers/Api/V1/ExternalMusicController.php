<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\YouTubeMusicService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExternalMusicController extends Controller
{
    protected YouTubeMusicService $ytMusic;

    public function __construct(YouTubeMusicService $ytMusic)
    {
        $this->ytMusic = $ytMusic;
    }

    /**
     * Search external music using ytmusicapi via the Python microservice.
     */
    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        $filter = $request->query('filter'); // 'songs', 'artists', 'albums', 'playlists'
        $limit = (int) $request->query('limit', 15);

        if (empty($q)) {
            return response()->json([
                'status' => 'success',
                'query' => '',
                'source_type' => 'EXTERNAL',
                'external_source' => 'YOUTUBE_MUSIC',
                'available' => true,
                'data' => [
                    'songs' => [],
                    'artists' => [],
                    'albums' => [],
                    'playlists' => [],
                ],
            ]);
        }

        $results = $this->ytMusic->search($q, $filter, $limit);

        return response()->json([
            'status' => 'success',
            'query' => $q,
            'source_type' => 'EXTERNAL',
            'external_source' => 'YOUTUBE_MUSIC',
            'available' => $results['available'] ?? true,
            'data' => $results,
        ]);
    }

    /**
     * Get external song metadata by YouTube video ID.
     */
    public function songDetail(string $id): JsonResponse
    {
        $song = $this->ytMusic->getSong($id);

        if (!$song) {
            return response()->json([
                'status' => 'error',
                'message' => 'External song not found or external music service is unavailable.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $song,
        ]);
    }

    /**
     * Get external artist details, top tracks, and albums by channel/browse ID.
     */
    public function artistDetail(string $id): JsonResponse
    {
        $artist = $this->ytMusic->getArtist($id);

        if (!$artist) {
            return response()->json([
                'status' => 'error',
                'message' => 'External artist not found or external music service is unavailable.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $artist,
        ]);
    }

    /**
     * Get external album details and tracklist by browse ID.
     */
    public function albumDetail(string $id): JsonResponse
    {
        $album = $this->ytMusic->getAlbum($id);

        if (!$album) {
            return response()->json([
                'status' => 'error',
                'message' => 'External album not found or external music service is unavailable.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $album,
        ]);
    }

    /**
     * Get external playlist details and tracks by playlist ID.
     */
    public function playlistDetail(string $id): JsonResponse
    {
        $playlist = $this->ytMusic->getPlaylist($id);

        if (!$playlist) {
            return response()->json([
                'status' => 'error',
                'message' => 'External playlist not found or external music service is unavailable.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $playlist,
        ]);
    }

    /**
     * Get audio stream info (CDN streamUrl) for an external song by YouTube video ID.
     */
    public function stream(string $id): JsonResponse
    {
        $stream = $this->ytMusic->getStream($id);

        if (!$stream || empty($stream['streamUrl'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Audio stream could not be extracted for the requested track or external service is unavailable.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $stream,
        ]);
    }
}

