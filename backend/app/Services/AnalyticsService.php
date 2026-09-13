<?php

namespace App\Services;

use App\Models\Song;
use App\Models\Artist;
use App\Models\ArtistAnalytic;
use App\Models\StreamEvent;
use App\Models\PlayHistory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Process a stream event.
     * Only counts as a qualified stream if duration played >= 30 seconds.
     */
    public function recordPlaybackEvent(
        ?User $user,
        int $songId,
        int $durationPlayedSeconds,
        bool $completed = false,
        ?string $bitrate = null,
        ?string $ipAddress = null
    ): array {
        $song = Song::find($songId);
        if (!$song) {
            return ['status' => 'error', 'message' => 'Song not found'];
        }

        $isQualified = $durationPlayedSeconds >= config('media.qualifying_stream_seconds', 30);

        // 1. Record Stream Event log
        $event = StreamEvent::create([
            'user_id' => $user?->id,
            'song_id' => $song->id,
            'artist_id' => $song->artist_id,
            'duration_played_seconds' => $durationPlayedSeconds,
            'completed' => $completed,
            'bitrate_streamed' => $bitrate,
            'ip_address' => $ipAddress,
            'created_at' => now(),
        ]);

        // 2. Record Play History if user is authenticated
        if ($user) {
            PlayHistory::create([
                'user_id' => $user->id,
                'song_id' => $song->id,
                'playback_duration_seconds' => $durationPlayedSeconds,
                'completed' => $completed,
                'played_at' => now(),
            ]);
        }

        // 3. If qualified stream, update counters and daily artist aggregate
        if ($isQualified) {
            $song->increment('play_count');
            $song->artist()->increment('total_streams');

            $today = Carbon::today()->toDateString();
            $analytic = ArtistAnalytic::firstOrCreate(
                ['artist_id' => $song->artist_id, 'metric_date' => $today],
                ['daily_streams' => 0, 'daily_listeners' => 0, 'total_duration_seconds' => 0]
            );

            $analytic->increment('daily_streams');
            $analytic->increment('total_duration_seconds', $durationPlayedSeconds);
        }

        return [
            'status' => 'success',
            'qualified_stream' => $isQualified,
            'total_song_plays' => $song->play_count,
        ];
    }

    /**
     * Get aggregated analytics for an artist dashboard.
     */
    public function getArtistMetrics(Artist $artist): array
    {
        $past30Days = Carbon::today()->subDays(30);

        $trends = ArtistAnalytic::where('artist_id', $artist->id)
            ->where('metric_date', '>=', $past30Days)
            ->orderBy('metric_date', 'asc')
            ->get(['metric_date', 'daily_streams', 'daily_listeners', 'total_duration_seconds']);

        $topSongs = Song::where('artist_id', $artist->id)
            ->orderBy('play_count', 'desc')
            ->limit(5)
            ->get();

        $topAlbums = $artist->albums()
            ->withCount('songs')
            ->limit(5)
            ->get();

        return [
            'total_streams' => $artist->total_streams,
            'monthly_listeners' => $artist->monthly_listeners,
            'followers' => $artist->followers_count,
            'total_songs' => $artist->songs()->count(),
            'total_albums' => $artist->albums()->count(),
            'daily_trends' => $trends,
            'top_songs' => $topSongs,
            'top_albums' => $topAlbums,
        ];
    }
}
