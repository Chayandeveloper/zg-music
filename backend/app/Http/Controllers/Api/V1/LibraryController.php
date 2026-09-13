<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Song;
use App\Models\Artist;
use App\Models\Playlist;
use App\Models\Like;
use App\Models\Follow;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LibraryController extends Controller
{
    public function toggleLike(Request $request, int $songId): JsonResponse
    {
        $user = $request->user();
        $song = Song::findOrFail($songId);

        $existing = Like::where('user_id', $user->id)->where('song_id', $song->id)->first();

        if ($existing) {
            $existing->delete();
            $song->decrement('like_count');
            $liked = false;
        } else {
            Like::create(['user_id' => $user->id, 'song_id' => $song->id]);
            $song->increment('like_count');
            $liked = true;
        }

        return response()->json([
            'data' => [
                'song_id' => $song->id,
                'is_liked' => $liked,
                'like_count' => $song->like_count,
            ],
            'message' => $liked ? 'Added to Liked Songs' : 'Removed from Liked Songs',
        ]);
    }

    public function likedSongs(Request $request): JsonResponse
    {
        $user = $request->user();

        $songs = Song::with(['artist', 'album'])
            ->join('likes', 'songs.id', '=', 'likes.song_id')
            ->where('likes.user_id', $user->id)
            ->orderBy('likes.created_at', 'desc')
            ->select('songs.*')
            ->paginate($request->query('per_page', 20));

        return response()->json($songs);
    }

    public function toggleFollow(Request $request, int $artistId): JsonResponse
    {
        $user = $request->user();
        $artist = Artist::findOrFail($artistId);

        $existing = Follow::where('user_id', $user->id)->where('artist_id', $artist->id)->first();

        if ($existing) {
            $existing->delete();
            $artist->decrement('followers_count');
            $following = false;
        } else {
            Follow::create(['user_id' => $user->id, 'artist_id' => $artist->id]);
            $artist->increment('followers_count');
            $following = true;
        }

        return response()->json([
            'data' => [
                'artist_id' => $artist->id,
                'is_following' => $following,
                'followers_count' => $artist->followers_count,
            ],
            'message' => $following ? "Following {$artist->name}" : "Unfollowed {$artist->name}",
        ]);
    }

    public function followedArtists(Request $request): JsonResponse
    {
        $user = $request->user();

        $artists = Artist::join('follows', 'artists.id', '=', 'follows.artist_id')
            ->where('follows.user_id', $user->id)
            ->select('artists.*')
            ->paginate($request->query('per_page', 20));

        return response()->json($artists);
    }

    public function playlists(Request $request): JsonResponse
    {
        $user = $request->user();

        $playlists = Playlist::withCount('songs')
            ->where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json(['data' => $playlists]);
    }

    public function showPlaylist(Request $request, int $id): JsonResponse
    {
        $playlist = Playlist::with(['songs.artist', 'songs.album'])
            ->withCount('songs')
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json(['data' => $playlist]);
    }

    public function createPlaylist(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'visibility' => ['sometimes', 'in:PUBLIC,PRIVATE'],
        ]);

        $playlist = Playlist::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'visibility' => $validated['visibility'] ?? 'PUBLIC',
            'cover_url' => 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
        ]);

        return response()->json([
            'data' => $playlist->loadCount('songs'),
            'message' => 'Playlist created successfully',
        ], 201);
    }

    public function deletePlaylist(Request $request, int $id): JsonResponse
    {
        $playlist = Playlist::where('user_id', $request->user()->id)->findOrFail($id);
        $playlist->songs()->detach();
        $playlist->delete();

        return response()->json([
            'message' => 'Playlist deleted successfully',
        ]);
    }

    public function addSongToPlaylist(Request $request, int $playlistId): JsonResponse
    {
        $validated = $request->validate([
            'song_id' => ['required', 'integer', 'exists:songs,id'],
        ]);

        $playlist = Playlist::where('user_id', $request->user()->id)->findOrFail($playlistId);

        $maxPos = (int) $playlist->songs()->max('position');
        $playlist->songs()->syncWithoutDetaching([
            $validated['song_id'] => ['position' => $maxPos + 1]
        ]);

        $playlist->update(['songs_count' => $playlist->songs()->count()]);

        return response()->json([
            'message' => 'Song added to playlist',
        ]);
    }

    public function removeSongFromPlaylist(Request $request, int $playlistId, int $songId): JsonResponse
    {
        $playlist = Playlist::where('user_id', $request->user()->id)->findOrFail($playlistId);
        $playlist->songs()->detach($songId);
        $playlist->update(['songs_count' => $playlist->songs()->count()]);

        return response()->json([
            'message' => 'Song removed from playlist',
        ]);
    }

    public function playHistory(Request $request): JsonResponse
    {
        $history = $request->user()->playHistories()
            ->with(['song.artist', 'song.album'])
            ->latest('played_at')
            ->paginate($request->query('per_page', 30));

        return response()->json($history);
    }
}
