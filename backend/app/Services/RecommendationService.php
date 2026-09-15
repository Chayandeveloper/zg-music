<?php

namespace App\Services;

use App\Models\User;
use App\Models\Song;
use App\Models\Artist;
use Illuminate\Support\Collection;

class RecommendationService
{
    /**
     * Compute tailored recommendations for a given user.
     */
    public function getRecommendedSongs(?User $user, int $limit = 10): Collection
    {
        if (!$user) {
            return Song::with(['artist', 'album'])
                ->where('status', 'PUBLISHED')
                ->orderBy('play_count', 'desc')
                ->limit($limit)
                ->get();
        }

        // 1. Determine User Affinity
        $likedSongIds = $user->likes()->pluck('song_id')->toArray();
        $followedArtistIds = $user->follows()->pluck('artist_id')->toArray();

        // 2. Extract preferred genres from liked songs & history
        $preferredGenres = Song::whereIn('id', $likedSongIds)
            ->whereNotNull('genre')
            ->pluck('genre')
            ->unique()
            ->toArray();

        // 3. Query candidate songs
        $query = Song::with(['artist', 'album'])
            ->where('status', 'PUBLISHED')
            ->whereNotIn('id', $likedSongIds);

        if (!empty($followedArtistIds) || !empty($preferredGenres)) {
            $query->where(function ($q) use ($followedArtistIds, $preferredGenres) {
                if (!empty($followedArtistIds)) {
                    $q->whereIn('artist_id', $followedArtistIds);
                }
                if (!empty($preferredGenres)) {
                    if (!empty($followedArtistIds)) {
                        $q->orWhereIn('genre', $preferredGenres);
                    } else {
                        $q->whereIn('genre', $preferredGenres);
                    }
                }
            });
        }

        $candidates = $query->orderBy('play_count', 'desc')
            ->limit($limit * 2)
            ->get();

        if ($candidates->isEmpty()) {
            return Song::with(['artist', 'album'])
                ->where('status', 'PUBLISHED')
                ->orderBy('play_count', 'desc')
                ->limit($limit)
                ->get();
        }

        return $candidates->shuffle()->take($limit);
    }

    /**
     * Identify Rising Artists based on stream momentum and follower conversion.
     */
    public function getRisingArtists(int $limit = 6): Collection
    {
        return Artist::where('is_rising', true)
            ->orWhere(function ($q) {
                $q->where('total_streams', '>', 50000)
                  ->where('followers_count', '>', 1000);
            })
            ->orderBy('monthly_listeners', 'desc')
            ->limit($limit)
            ->get();
    }
}
