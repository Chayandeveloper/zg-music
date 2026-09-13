<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Artist;
use App\Models\ArtistApplication;
use App\Models\Release;
use App\Models\ReleaseSong;
use App\Models\Song;
use App\Models\Album;
use App\Models\SongStory;
use App\Models\Lyric;
use App\Services\MediaService;
use App\Services\AnalyticsService;
use App\Jobs\ProcessAudioVariantsJob;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ArtistStageController extends Controller
{
    /**
     * Submit "Become an Artist" application.
     */
    public function apply(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->artist) {
            return response()->json(['message' => 'You are already an approved artist on Zubeen Stage.'], 400);
        }

        $validated = $request->validate([
            'artist_name' => ['required', 'string', 'max:255'],
            'biography' => ['required', 'string', 'min:20', 'max:5000'],
            'genres' => ['required', 'array', 'min:1'],
            'languages' => ['required', 'array', 'min:1'],
            'social_links' => ['sometimes', 'nullable', 'array'],
            'website' => ['sometimes', 'nullable', 'url', 'max:255'],
            'artist_information' => ['required', 'string', 'min:10', 'max:3000'],
            'profile_image' => ['sometimes', 'nullable', 'image', 'max:5120'], // 5MB max
            'banner_image' => ['sometimes', 'nullable', 'image', 'max:8192'],
            'rights_declaration' => ['required', 'accepted'], // Must check and declare rights
        ]);

        $profilePath = null;
        if ($request->hasFile('profile_image')) {
            $profilePath = $request->file('profile_image')->store('artists/profiles', 'public');
            $profilePath = Storage::url($profilePath);
        }

        $bannerPath = null;
        if ($request->hasFile('banner_image')) {
            $bannerPath = $request->file('banner_image')->store('artists/banners', 'public');
            $bannerPath = Storage::url($bannerPath);
        }

        $application = ArtistApplication::updateOrCreate(
            ['user_id' => $user->id],
            [
                'artist_name' => $validated['artist_name'],
                'biography' => $validated['biography'],
                'genres' => $validated['genres'],
                'languages' => $validated['languages'],
                'social_links' => $validated['social_links'] ?? [],
                'website' => $validated['website'] ?? null,
                'artist_information' => $validated['artist_information'],
                'profile_image_path' => $profilePath,
                'banner_image_path' => $bannerPath,
                'rights_declaration' => true,
                'rights_declared_at' => now(),
                'status' => 'PENDING',
                'admin_notes' => null,
            ]
        );

        return response()->json([
            'data' => $application,
            'message' => 'Your artist application has been submitted and is pending review by our editorial team.',
        ], 201);
    }

    /**
     * Get current artist application status.
     */
    public function applicationStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $application = ArtistApplication::where('user_id', $user->id)->latest()->first();

        return response()->json([
            'data' => [
                'has_applied' => (bool) $application,
                'application' => $application,
                'is_approved_artist' => (bool) $user->artist,
            ],
        ]);
    }

    /**
     * Artist Stage dashboard metrics & recent activity.
     */
    public function dashboard(Request $request, AnalyticsService $analyticsService): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['message' => 'Artist profile not found. Please apply to Zubeen Stage.'], 403);
        }

        $metrics = $analyticsService->getArtistMetrics($artist);

        $recentReleases = Release::where('artist_id', $artist->id)
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'artist' => $artist,
                'metrics' => $metrics,
                'recent_releases' => $recentReleases,
            ],
        ]);
    }

    /**
     * Upload original audio master with validation.
     */
    public function uploadAudio(Request $request, MediaService $mediaService): JsonResponse
    {
        $user = $request->user();
        if (!$user->artist) {
            return response()->json(['message' => 'Unauthorized. Must be an approved artist.'], 403);
        }

        $request->validate([
            'audio_file' => ['required', 'file', 'max:102400'], // 100MB limit
        ]);

        $file = $request->file('audio_file');
        $extension = $file->getClientOriginalExtension();
        $tempPath = $file->getRealPath();

        // Perform server-side deep audio verification (not just extension)
        $validation = $mediaService->validateAudioFile($tempPath);
        if (!$validation['valid']) {
            return response()->json([
                'message' => $validation['error'],
            ], 422);
        }

        // Store original master in isolated disk
        $safeName = Str::uuid()->toString() . '.' . $extension;
        $storedMasterPath = $file->storeAs("masters/{$user->artist->id}", $safeName, 'public');

        return response()->json([
            'data' => [
                'master_path' => $storedMasterPath,
                'original_name' => $file->getClientOriginalName(),
                'duration_seconds' => $validation['duration'],
                'file_size' => $validation['size'],
                'mime_type' => $validation['mime'],
            ],
            'message' => 'Audio master uploaded and verified successfully.',
        ]);
    }

    /**
     * Create and submit a release for review.
     */
    public function submitRelease(Request $request, MediaService $mediaService): JsonResponse
    {
        $user = $request->user();
        $artist = $user->artist;

        if (!$artist) {
            return response()->json(['message' => 'Unauthorized. Must be an approved artist.'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'release_type' => ['required', 'in:SINGLE,ALBUM,EP'],
            'genre' => ['required', 'string', 'max:100'],
            'language' => ['required', 'string', 'max:100'],
            'release_date' => ['sometimes', 'nullable', 'date'],
            'composer' => ['sometimes', 'nullable', 'string', 'max:255'],
            'lyricist' => ['sometimes', 'nullable', 'string', 'max:255'],
            'producer' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'lyrics' => ['sometimes', 'nullable', 'string'],
            'cover_image_url' => ['sometimes', 'nullable', 'string', 'max:1024'],
            'rights_declaration' => ['required', 'accepted'], // Mandatory legal rights attestation
            'tracks' => ['required', 'array', 'min:1'],
            'tracks.*.title' => ['required', 'string', 'max:255'],
            'tracks.*.master_path' => ['required', 'string'],
            'tracks.*.duration_seconds' => ['required', 'integer', 'min:15'],
        ]);

        $release = Release::create([
            'artist_id' => $artist->id,
            'title' => $validated['title'],
            'release_type' => $validated['release_type'],
            'genre' => $validated['genre'],
            'language' => $validated['language'],
            'composer' => $validated['composer'] ?? null,
            'lyricist' => $validated['lyricist'] ?? null,
            'producer' => $validated['producer'] ?? null,
            'release_date' => $validated['release_date'] ?? now()->toDateString(),
            'description' => $validated['description'] ?? null,
            'lyrics' => $validated['lyrics'] ?? null,
            'cover_image_path' => $validated['cover_image_url'] ?? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
            'rights_declaration' => true,
            'rights_declared_at' => now(),
            'status' => 'UNDER_REVIEW',
        ]);

        foreach ($validated['tracks'] as $idx => $trackData) {
            // Create Song record in draft / processing state
            $song = Song::create([
                'artist_id' => $artist->id,
                'title' => $trackData['title'],
                'slug' => Str::slug($trackData['title']) . '-' . Str::random(5),
                'artwork_url' => $release->cover_image_path,
                'duration_seconds' => $trackData['duration_seconds'],
                'genre' => $release->genre,
                'language' => $release->language,
                'stream_url' => '/storage/' . $trackData['master_path'],
                'status' => 'PUBLISHED', // Will be live upon release approval
            ]);

            if (!empty($validated['lyrics'])) {
                Lyric::create([
                    'song_id' => $song->id,
                    'lyrics_text' => $validated['lyrics'],
                    'language' => $release->language,
                ]);
            }

            if (!empty($validated['description']) || !empty($validated['composer'])) {
                SongStory::create([
                    'song_id' => $song->id,
                    'composer' => $validated['composer'] ?? null,
                    'lyricist' => $validated['lyricist'] ?? null,
                    'producer' => $validated['producer'] ?? null,
                    'singer' => $artist->name,
                    'description' => $validated['description'] ?? null,
                ]);
            }

            $relSong = ReleaseSong::create([
                'release_id' => $release->id,
                'song_id' => $song->id,
                'title' => $trackData['title'],
                'original_master_path' => $trackData['master_path'],
                'duration_seconds' => $trackData['duration_seconds'],
                'track_number' => $idx + 1,
                'processing_status' => 'PROCESSING',
            ]);

            // Dispatch background queue job for FFmpeg HLS transcoding
            $fullDiskPath = storage_path('app/public/' . $trackData['master_path']);
            ProcessAudioVariantsJob::dispatch($song, $fullDiskPath, $relSong);
        }

        return response()->json([
            'data' => $release->load('releaseSongs'),
            'message' => 'Release submitted for editorial review. Audio transcoding is being processed.',
        ], 201);
    }

    public function listReleases(Request $request): JsonResponse
    {
        $artist = $request->user()->artist;
        if (!$artist) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $releases = Release::with(['releaseSongs.song'])
            ->where('artist_id', $artist->id)
            ->latest()
            ->paginate(15);

        return response()->json($releases);
    }

    public function releaseDetail(Request $request, int $id): JsonResponse
    {
        $artist = $request->user()->artist;
        $release = Release::with(['releaseSongs.song.variants', 'reviews.reviewer'])
            ->where('artist_id', $artist->id)
            ->findOrFail($id);

        return response()->json(['data' => $release]);
    }

    public function mySongs(Request $request): JsonResponse
    {
        $artist = $request->user()->artist;
        $songs = Song::where('artist_id', $artist->id)
            ->latest()
            ->paginate(20);

        return response()->json($songs);
    }

    public function analytics(Request $request, AnalyticsService $analyticsService): JsonResponse
    {
        $artist = $request->user()->artist;
        $data = $analyticsService->getArtistMetrics($artist);

        return response()->json(['data' => $data]);
    }
}
