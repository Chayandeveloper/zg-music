<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Song;
use App\Models\Artist;
use App\Models\Album;
use App\Models\Playlist;
use App\Services\RecommendationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    public function index(Request $request, RecommendationService $recommendationService): JsonResponse
    {
        $user = $request->user('sanctum');

        // Determine dynamic time greeting
        $hour = (int) now()->format('H');
        if ($hour < 12) {
            $greeting = 'Good Morning';
        } elseif ($hour < 17) {
            $greeting = 'Good Afternoon';
        } else {
            $greeting = 'Good Evening';
        }

        // 1. Recently Played
        $recentlyPlayed = [];
        if ($user) {
            $recentlyPlayed = $user->playHistories()
                ->with(['song.artist', 'song.album'])
                ->latest('played_at')
                ->limit(6)
                ->get()
                ->pluck('song')
                ->filter()
                ->unique('id')
                ->values();
        }

        // 2. Made For You
        $madeForYou = $recommendationService->getRecommendedSongs($user, 8);

        // 3. Trending Now
        $trending = Song::with(['artist', 'album'])
            ->where('status', 'PUBLISHED')
            ->orderBy('play_count', 'desc')
            ->limit(8)
            ->get();

        // 4. Zubeen's Top Hits
        $zubeenArtist = Artist::where('slug', 'zubeen-garg')->first();
        $zubeenTopHits = [];
        if ($zubeenArtist) {
            $zubeenTopHits = Song::with(['artist', 'album'])
                ->where('artist_id', $zubeenArtist->id)
                ->where('status', 'PUBLISHED')
                ->orderBy('play_count', 'desc')
                ->limit(8)
                ->get();
        }

        // 5. New Releases (Albums & Songs)
        $newReleases = Album::with('artist')
            ->where('status', 'PUBLISHED')
            ->orderBy('release_year', 'desc')
            ->limit(6)
            ->get();

        // 6. Rising Artists
        $risingArtists = $recommendationService->getRisingArtists(6);

        // 7. Featured Playlists
        $featuredPlaylists = Playlist::withCount('songs')
            ->where('visibility', 'PUBLIC')
            ->limit(6)
            ->get();

        return response()->json([
            'data' => [
                'greeting' => $greeting,
                'recently_played' => $recentlyPlayed,
                'made_for_you' => $madeForYou,
                'trending' => $trending,
                'zubeen_top_hits' => $zubeenTopHits,
                'new_releases' => $newReleases,
                'rising_artists' => $risingArtists,
                'featured_playlists' => $featuredPlaylists,
            ],
        ]);
    }
}
