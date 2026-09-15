<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Song;
use App\Models\Artist;
use App\Models\Album;
use App\Models\Genre;
use App\Models\Playlist;
use App\Services\YouTubeMusicService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CatalogController extends Controller
{
    protected YouTubeMusicService $ytMusic;

    public function __construct(YouTubeMusicService $ytMusic)
    {
        $this->ytMusic = $ytMusic;
    }
    public function songs(Request $request): JsonResponse
    {
        $query = Song::with(['artist', 'album'])
            ->where('status', 'PUBLISHED');

        if ($request->filled('genre')) {
            $query->where('genre', $request->query('genre'));
        }

        if ($request->filled('language')) {
            $query->where('language', $request->query('language'));
        }

        if ($request->filled('artist_id')) {
            $query->where('artist_id', $request->query('artist_id'));
        }

        $songs = $query->orderBy('play_count', 'desc')
            ->paginate($request->query('per_page', 20));

        return response()->json($songs);
    }

    public function songDetail(int $id): JsonResponse
    {
        $song = Song::with(['artist', 'album', 'story', 'lyrics', 'variants'])
            ->where('status', 'PUBLISHED')
            ->findOrFail($id);

        $relatedSongs = Song::with('artist')
            ->where('status', 'PUBLISHED')
            ->where('id', '!=', $song->id)
            ->where(function ($q) use ($song) {
                $q->where('artist_id', $song->artist_id)
                  ->orWhere('genre', $song->genre);
            })
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'song' => $song,
                'related_songs' => $relatedSongs,
            ],
        ]);
    }

    public function albums(Request $request): JsonResponse
    {
        $query = Album::with('artist')
            ->where('status', 'PUBLISHED');

        if ($request->filled('artist_id')) {
            $query->where('artist_id', $request->query('artist_id'));
        }

        $albums = $query->orderBy('release_year', 'desc')
            ->paginate($request->query('per_page', 20));

        return response()->json($albums);
    }

    public function albumDetail(string $id): JsonResponse
    {
        if ($id === 'zubeen-songs') {
            $album = $this->ytMusic->getAlbum('MPREb_Bgo3UykAEb4');
            if ($album) {
                $album['id'] = 'zubeen-songs';
                $album['title'] = 'Zubeen Songs';
                $album['artist'] = ['name' => 'Zubeen Garg'];
                $album['songs'] = $album['tracks'] ?? [];
                return response()->json([
                    'data' => [
                        'album' => $album,
                    ],
                ]);
            }
        }

        if (is_numeric($id)) {
            $album = Album::with([
                'artist',
                'songs' => function ($q) {
                    $q->where('status', 'PUBLISHED')->with('artist');
                }
            ])
                ->where('status', 'PUBLISHED')
                ->find((int) $id);

            if ($album) {
                return response()->json([
                    'data' => [
                        'album' => $album,
                    ],
                ]);
            }
        }

        // Try external album (e.g. YouTube Music browse ID)
        $extAlbum = $this->ytMusic->getAlbum($id);
        if ($extAlbum) {
            $extAlbum['id'] = $id;
            $extAlbum['songs'] = $extAlbum['tracks'] ?? [];
            return response()->json([
                'data' => [
                    'album' => $extAlbum,
                ],
            ]);
        }

        return response()->json([
            'message' => 'Album not found',
        ], 404);
    }

    public function artists(Request $request): JsonResponse
    {
        $query = Artist::query();

        if ($request->boolean('rising')) {
            $query->where('is_rising', true);
        }

        $artists = $query->orderBy('followers_count', 'desc')
            ->paginate($request->query('per_page', 20));

        return response()->json($artists);
    }

    public function artistDetail(int $id): JsonResponse
    {
        $artist = Artist::findOrFail($id);

        $popularSongs = Song::with('album')
            ->where('artist_id', $artist->id)
            ->where('status', 'PUBLISHED')
            ->orderBy('play_count', 'desc')
            ->limit(10)
            ->get();

        $albums = Album::where('artist_id', $artist->id)
            ->where('status', 'PUBLISHED')
            ->orderBy('release_year', 'desc')
            ->get();

        $singles = Song::where('artist_id', $artist->id)
            ->whereNull('album_id')
            ->where('status', 'PUBLISHED')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => [
                'artist' => $artist,
                'popular_songs' => $popularSongs,
                'albums' => $albums,
                'singles' => $singles,
            ],
        ]);
    }

    public function genres(): JsonResponse
    {
        $genres = Genre::all();
        return response()->json(['data' => $genres]);
    }

    public function search(Request $request): JsonResponse
    {
        $q = trim((string)$request->query('q', ''));

        if (empty($q)) {
            return response()->json([
                'data' => [
                    'query' => '',
                    'trending_searches' => ['Zubeen Garg', 'Maya', 'Anamika', 'Papon', 'Mon Jaai', 'Oi Jaan Mon'],
                    'songs' => [],
                    'artists' => [],
                    'albums' => [],
                    'playlists' => [],
                ],
            ]);
        }

        // 1. Query Internal Catalog
        $internalSongs = Song::with(['artist', 'album'])
            ->where('status', 'PUBLISHED')
            ->where(function ($query) use ($q) {
                $query->where('title', 'LIKE', "%{$q}%")
                      ->orWhereHas('artist', function ($aq) use ($q) {
                          $aq->where('name', 'LIKE', "%{$q}%");
                      });
            })
            ->limit(15)
            ->get();

        $internalArtists = Artist::where('name', 'LIKE', "%{$q}%")
            ->limit(6)
            ->get();

        $internalAlbums = Album::with('artist')
            ->where('status', 'PUBLISHED')
            ->where('title', 'LIKE', "%{$q}%")
            ->limit(6)
            ->get();

        $playlists = Playlist::where('visibility', 'PUBLIC')
            ->where('title', 'LIKE', "%{$q}%")
            ->limit(6)
            ->get();

        // 2. Query External YouTube Music Service
        $external = [
            'songs' => [],
            'artists' => [],
            'albums' => [],
            'playlists' => [],
        ];
        $externalAvailable = false;

        if ($request->boolean('include_external', true)) {
            $extRes = $this->ytMusic->search($q, null, 12);
            $external['songs'] = $extRes['songs'] ?? [];
            $external['artists'] = $extRes['artists'] ?? [];
            $external['albums'] = $extRes['albums'] ?? [];
            $external['playlists'] = $extRes['playlists'] ?? [];
            $externalAvailable = (bool) ($extRes['available'] ?? false);
        }

        // 3. Unify and Deduplicate Songs (Internal Version = Priority)
        $unifiedSongs = [];
        $seenMeta = [];

        foreach ($internalSongs as $song) {
            $songArr = $song->toArray();
            $songArr['source_type'] = $songArr['source_type'] ?? 'INTERNAL';
            $songArr['playback'] = [
                'available' => true,
                'type' => 'INTERNAL_HLS',
                'stream_url' => $song->stream_url,
                'hls_master_url' => $song->hls_master_url,
            ];
            $unifiedSongs[] = $songArr;
            $seenMeta[] = [
                'title' => $song->title,
                'artist' => $song->artist?->name ?? '',
            ];
        }

        foreach ($external['songs'] as $extSong) {
            $extTitle = $extSong['title'] ?? '';
            $extArtist = is_array($extSong['artist'] ?? null) 
                ? ($extSong['artist']['name'] ?? '') 
                : ($extSong['artist'] ?? '');

            // Deduplication Check
            $isDuplicate = false;
            foreach ($seenMeta as $meta) {
                if ($this->isSongDuplicate($meta['title'], $meta['artist'], $extTitle, $extArtist)) {
                    $isDuplicate = true;
                    break;
                }
            }

            if (!$isDuplicate) {
                $extId = $extSong['external_id'] ?? '';
                $unifiedSongs[] = [
                    'id' => $extId,
                    'title' => $extTitle,
                    'artist_id' => null,
                    'artist' => [
                        'id' => 0,
                        'name' => $extArtist ?: 'YouTube Music',
                    ],
                    'album_id' => null,
                    'album' => !empty($extSong['album']) ? [
                        'id' => 0,
                        'title' => is_array($extSong['album']) ? ($extSong['album']['title'] ?? '') : $extSong['album'],
                    ] : null,
                    'duration_seconds' => (int) ($extSong['duration_seconds'] ?? 0),
                    'artwork_url' => $extSong['artwork_url'] ?? null,
                    'genre' => 'External',
                    'stream_url' => null,
                    'hls_master_url' => null,
                    'source_type' => 'EXTERNAL',
                    'external_source' => 'YOUTUBE_MUSIC',
                    'external_id' => $extId,
                    'external_url' => $extSong['external_url'] ?? "https://music.youtube.com/watch?v={$extId}",
                    'playback' => [
                        'available' => false,
                        'type' => 'YOUTUBE_EMBEDDED',
                        'videoId' => $extId,
                    ],
                    'status' => 'PUBLISHED',
                ];
                $seenMeta[] = ['title' => $extTitle, 'artist' => $extArtist];
            }
        }

        // 4. Unify Artists
        $unifiedArtists = $internalArtists->toArray();
        $seenArtistNames = array_map(fn($a) => strtolower(trim($a['name'] ?? '')), $unifiedArtists);

        foreach ($external['artists'] as $extArtist) {
            $name = $extArtist['name'] ?? '';
            $cleanName = strtolower(trim($name));
            if (!in_array($cleanName, $seenArtistNames) && !empty($cleanName)) {
                $unifiedArtists[] = [
                    'id' => $extArtist['external_id'] ?? 0,
                    'name' => $name,
                    'profile_image_url' => $extArtist['artwork_url'] ?? null,
                    'source_type' => 'EXTERNAL',
                    'external_source' => 'YOUTUBE_MUSIC',
                    'external_id' => $extArtist['external_id'] ?? null,
                    'verified' => false,
                ];
                $seenArtistNames[] = $cleanName;
            }
        }

        // 5. Unify Albums
        $unifiedAlbums = $internalAlbums->toArray();
        $seenAlbumTitles = array_map(fn($a) => strtolower(trim($a['title'] ?? '')), $unifiedAlbums);

        foreach ($external['albums'] as $extAlbum) {
            $title = $extAlbum['title'] ?? '';
            $cleanTitle = strtolower(trim($title));
            if (!in_array($cleanTitle, $seenAlbumTitles) && !empty($cleanTitle)) {
                $unifiedAlbums[] = [
                    'id' => $extAlbum['external_id'] ?? 0,
                    'title' => $title,
                    'cover_url' => $extAlbum['artwork_url'] ?? null,
                    'artist' => ['name' => $extAlbum['artist'] ?? 'YouTube Music'],
                    'release_year' => $extAlbum['year'] ?? null,
                    'source_type' => 'EXTERNAL',
                    'external_source' => 'YOUTUBE_MUSIC',
                    'external_id' => $extAlbum['external_id'] ?? null,
                ];
                $seenAlbumTitles[] = $cleanTitle;
            }
        }

        return response()->json([
            'data' => [
                'query' => $q,
                'songs' => $unifiedSongs,
                'artists' => $unifiedArtists,
                'albums' => $unifiedAlbums,
                'playlists' => $playlists,
                'internal' => [
                    'songs' => $internalSongs,
                    'artists' => $internalArtists,
                    'albums' => $internalAlbums,
                    'playlists' => $playlists,
                ],
                'external' => $external,
                'external_available' => $externalAvailable,
            ],
        ]);
    }

    /**
     * Smart deduplication comparator between two tracks.
     */
    protected function isSongDuplicate(string $title1, string $artist1, string $title2, string $artist2): bool
    {
        $cleanT1 = $this->normalizeString($title1);
        $cleanT2 = $this->normalizeString($title2);

        if (empty($cleanT1) || empty($cleanT2)) {
            return false;
        }

        // Exact normalized title match
        if ($cleanT1 === $cleanT2) {
            return true;
        }

        // Substring match if meaningful length
        if (strlen($cleanT1) >= 5 && strlen($cleanT2) >= 5) {
            if (str_contains($cleanT1, $cleanT2) || str_contains($cleanT2, $cleanT1)) {
                $cleanA1 = $this->normalizeString($artist1);
                $cleanA2 = $this->normalizeString($artist2);
                if (empty($cleanA1) || empty($cleanA2) || str_contains($cleanA1, $cleanA2) || str_contains($cleanA2, $cleanA1)) {
                    return true;
                }
            }
        }

        // Levenshtein typo tolerance for titles >= 7 chars
        if (strlen($cleanT1) >= 7 && strlen($cleanT2) >= 7) {
            if (levenshtein($cleanT1, $cleanT2) <= 2) {
                return true;
            }
        }

        return false;
    }

    protected function normalizeString(string $str): string
    {
        $str = strtolower($str);
        // Strip common suffixes / tags like (Official Video), [Audio], etc.
        $str = preg_replace('/\(.*?\)|\[.*?\]/', '', $str);
        $str = preg_replace('/\b(official|audio|video|lyric|lyrics|full|song|hd|remix|feat|ft|original)\b/i', '', $str);
        $str = preg_replace('/[^a-z0-9]/', '', $str);
        return trim($str);
    }
}
