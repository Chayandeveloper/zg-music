<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Song;
use App\Models\Artist;
use App\Models\Album;
use App\Models\Playlist;
use App\Services\RecommendationService;
use App\Services\YouTubeMusicService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    public function index(
        Request $request,
        RecommendationService $recommendationService,
        YouTubeMusicService $ytMusic
    ): JsonResponse
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
                ->whereHas('song', function ($q) {
                    $q->where('status', 'PUBLISHED');
                })
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

        // Fallback to real Zubeen hits from YouTube Music microservice if database is unseeded
        if (empty($zubeenTopHits) || (is_countable($zubeenTopHits) && count($zubeenTopHits) === 0)) {
            try {
                $extHits = $ytMusic->search('Zubeen Garg', 'songs', 10);
                $zubeenTopHits = $extHits['results'] ?? ($extHits['songs'] ?? []);
            } catch (\Exception $e) {
                $zubeenTopHits = [];
            }
        }

        // 4b. Zubeen's Hindi Hits (Bollywood & Hindi Classics)
        $zubeenHindiHits = [];
        if ($zubeenArtist) {
            $zubeenHindiHits = Song::with(['artist', 'album'])
                ->where('artist_id', $zubeenArtist->id)
                ->where(function ($q) {
                    $q->where('language', 'Hindi')
                      ->orWhere('genre', 'Bollywood');
                })
                ->where('status', 'PUBLISHED')
                ->orderBy('play_count', 'desc')
                ->limit(10)
                ->get();
        }

        if (empty($zubeenHindiHits) || (is_countable($zubeenHindiHits) && count($zubeenHindiHits) === 0)) {
            try {
                $extHindi = $ytMusic->search('Zubeen Garg Hindi Songs Bollywood', 'songs', 10);
                $zubeenHindiHits = $extHindi['results'] ?? ($extHindi['songs'] ?? []);
            } catch (\Exception $e) {
                $zubeenHindiHits = [];
            }
        }

        // 4c. Zubeen's Bangla Songs (Tollywood & Bengali Superhits)
        $zubeenBanglaHits = [];
        if ($zubeenArtist) {
            $zubeenBanglaHits = Song::with(['artist', 'album'])
                ->where('artist_id', $zubeenArtist->id)
                ->where(function ($q) {
                    $q->where('language', 'Bengali')
                      ->orWhere('language', 'Bangla');
                })
                ->where('status', 'PUBLISHED')
                ->orderBy('play_count', 'desc')
                ->limit(10)
                ->get();
        }

        if (empty($zubeenBanglaHits) || (is_countable($zubeenBanglaHits) && count($zubeenBanglaHits) === 0)) {
            try {
                $extBangla = $ytMusic->search('Zubeen Garg Bengali Songs', 'songs', 10);
                $zubeenBanglaHits = $extBangla['results'] ?? ($extBangla['songs'] ?? []);
            } catch (\Exception $e) {
                $zubeenBanglaHits = [];
            }
        }

        // 5. New Releases & Dedicated Zubeen Albums
        $newReleases = Album::with('artist')
            ->where('status', 'PUBLISHED')
            ->orderBy('release_year', 'desc')
            ->limit(6)
            ->get();

        $zubeenAlbums = [];
        try {
            $extAlbums = $ytMusic->search('Zubeen Garg', 'albums', 8);
            $rawAlbums = $extAlbums['results'] ?? ($extAlbums['albums'] ?? []);

            // Flagship "Zubeen Songs" album
            $flagshipAlbum = [
                'id' => 'zubeen-songs',
                'external_id' => 'MPREb_Bgo3UykAEb4',
                'title' => 'Zubeen Songs',
                'artist' => ['name' => 'Zubeen Garg'],
                'year' => 2024,
                'release_year' => 2024,
                'genre' => 'Assamese Classic',
                'cover_url' => 'https://yt3.googleusercontent.com/MIeKBUrRYIWXrLR7IkV4PWbl-7lU8oLo8lRW_z618Gr_DjlOyT9hZIo9g1-eQjUKiCQfnzzWCyhVP8nq=w544-h544-l90-rj',
                'artwork_url' => 'https://yt3.googleusercontent.com/MIeKBUrRYIWXrLR7IkV4PWbl-7lU8oLo8lRW_z618Gr_DjlOyT9hZIo9g1-eQjUKiCQfnzzWCyhVP8nq=w544-h544-l90-rj',
                'track_count' => 10,
                'source_type' => 'EXTERNAL',
                'external_source' => 'YOUTUBE_MUSIC',
            ];

            $zubeenAlbums[] = $flagshipAlbum;

            foreach ($rawAlbums as $alb) {
                if (($alb['external_id'] ?? '') !== 'MPREb_Bgo3UykAEb4') {
                    $zubeenAlbums[] = [
                        'id' => $alb['external_id'] ?? $alb['id'] ?? null,
                        'external_id' => $alb['external_id'] ?? $alb['id'] ?? null,
                        'title' => $alb['title'] ?? 'Zubeen Album',
                        'artist' => ['name' => is_string($alb['artist'] ?? null) ? $alb['artist'] : 'Zubeen Garg'],
                        'year' => $alb['year'] ?? null,
                        'release_year' => $alb['year'] ?? null,
                        'genre' => 'Assamese Melodies',
                        'cover_url' => $alb['artwork_url'] ?? null,
                        'artwork_url' => $alb['artwork_url'] ?? null,
                        'track_count' => $alb['track_count'] ?? null,
                        'source_type' => 'EXTERNAL',
                        'external_source' => 'YOUTUBE_MUSIC',
                    ];
                }
            }
        } catch (\Exception $e) {
            $zubeenAlbums = [];
        }

        if ($newReleases->isEmpty() && !empty($zubeenAlbums)) {
            $newReleases = $zubeenAlbums;
        }

        // 6. Rising Artists
        $risingArtists = $recommendationService->getRisingArtists(6);

        // 7. Featured Playlists
        $featuredPlaylists = Playlist::withCount('songs')
            ->where('visibility', 'PUBLIC')
            ->limit(6)
            ->get();

        // 8. External Music Discovery (ytmusicapi)
        $externalDiscovery = [];
        try {
            $extRes = $ytMusic->search('Assamese Hits', 'songs', 6);
            $externalDiscovery = $extRes['results'] ?? ($extRes['songs'] ?? []);
        } catch (\Exception $e) {
            $externalDiscovery = [];
        }

        return response()->json([
            'data' => [
                'greeting' => $greeting,
                'recently_played' => $recentlyPlayed,
                'made_for_you' => $madeForYou,
                'trending' => $trending->isEmpty() ? $zubeenTopHits : $trending,
                'zubeen_top_hits' => $zubeenTopHits,
                'zubeen_hindi_hits' => $zubeenHindiHits,
                'zubeen_bangla_hits' => $zubeenBanglaHits,
                'zubeen_albums' => $zubeenAlbums,
                'zubeen_songs_album' => $flagshipAlbum ?? null,
                'new_releases' => $newReleases,
                'rising_artists' => $risingArtists,
                'featured_playlists' => $featuredPlaylists,
                'external_discovery' => $externalDiscovery,
            ],
        ]);
    }
}
