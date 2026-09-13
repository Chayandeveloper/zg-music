<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Song;
use App\Models\Artist;
use App\Models\Album;
use App\Models\Genre;
use App\Models\Playlist;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CatalogController extends Controller
{
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

    public function albumDetail(int $id): JsonResponse
    {
        $album = Album::with(['artist', 'songs.artist'])
            ->where('status', 'PUBLISHED')
            ->findOrFail($id);

        return response()->json([
            'data' => [
                'album' => $album,
            ],
        ]);
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
                    'trending_searches' => ['Zubeen Garg', 'Maya', 'Anamika', 'Papon', 'Mon Jaai', 'Oi Jaan Mon'],
                    'songs' => [],
                    'artists' => [],
                    'albums' => [],
                    'playlists' => [],
                ],
            ]);
        }

        $songs = Song::with('artist')
            ->where('status', 'PUBLISHED')
            ->where('title', 'LIKE', "%{$q}%")
            ->limit(10)
            ->get();

        $artists = Artist::where('name', 'LIKE', "%{$q}%")
            ->limit(6)
            ->get();

        $albums = Album::with('artist')
            ->where('status', 'PUBLISHED')
            ->where('title', 'LIKE', "%{$q}%")
            ->limit(6)
            ->get();

        $playlists = Playlist::where('visibility', 'PUBLIC')
            ->where('title', 'LIKE', "%{$q}%")
            ->limit(6)
            ->get();

        return response()->json([
            'data' => [
                'query' => $q,
                'songs' => $songs,
                'artists' => $artists,
                'albums' => $albums,
                'playlists' => $playlists,
            ],
        ]);
    }
}
