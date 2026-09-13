<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Song;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PlayerController extends Controller
{
    public function trackEvent(Request $request, AnalyticsService $analyticsService): JsonResponse
    {
        $validated = $request->validate([
            'song_id' => ['required', 'integer', 'exists:songs,id'],
            'duration_played_seconds' => ['required', 'integer', 'min:0'],
            'completed' => ['sometimes', 'boolean'],
            'bitrate_streamed' => ['sometimes', 'nullable', 'string'],
        ]);

        $user = $request->user('sanctum');

        $result = $analyticsService->recordPlaybackEvent(
            user: $user,
            songId: $validated['song_id'],
            durationPlayedSeconds: $validated['duration_played_seconds'],
            completed: $validated['completed'] ?? false,
            bitrate: $validated['bitrate_streamed'] ?? null,
            ipAddress: $request->ip()
        );

        return response()->json($result);
    }

    public function streamInfo(int $songId): JsonResponse
    {
        $song = Song::with('variants')
            ->where('status', 'PUBLISHED')
            ->findOrFail($songId);

        return response()->json([
            'data' => [
                'song_id' => $song->id,
                'title' => $song->title,
                'stream_url' => $song->stream_url,
                'hls_master_url' => $song->hls_master_url,
                'variants' => $song->variants,
            ],
        ]);
    }
}
