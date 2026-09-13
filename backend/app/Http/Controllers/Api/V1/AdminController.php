<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Artist;
use App\Models\ArtistApplication;
use App\Models\Release;
use App\Models\ReleaseReview;
use App\Models\ReleaseStatusHistory;
use App\Models\Song;
use App\Models\Album;
use App\Models\CopyrightReport;
use App\Models\AuditLog;
use App\Models\StreamEvent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * Admin overview KPIs & system statistics.
     */
    public function dashboard(): JsonResponse
    {
        $totalUsers = User::count();
        $totalArtists = Artist::count();
        $totalSongs = Song::count();
        $totalAlbums = Album::count();
        $totalStreams = StreamEvent::count();
        $pendingApplications = ArtistApplication::where('status', 'PENDING')->count();
        $pendingReleases = Release::where('status', 'UNDER_REVIEW')->count();
        $pendingReports = CopyrightReport::where('status', 'PENDING')->count();

        // Recent 7 days daily stream volume
        $dailyStreams = StreamEvent::selectRaw('DATE(created_at) as date, count(*) as count')
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'data' => [
                'stats' => [
                    'total_users' => $totalUsers,
                    'total_artists' => $totalArtists,
                    'total_songs' => $totalSongs,
                    'total_albums' => $totalAlbums,
                    'total_streams' => $totalStreams,
                    'pending_applications' => $pendingApplications,
                    'pending_releases' => $pendingReleases,
                    'pending_reports' => $pendingReports,
                ],
                'daily_streams_chart' => $dailyStreams,
            ],
        ]);
    }

    /**
     * List artist verification applications.
     */
    public function applications(Request $request): JsonResponse
    {
        $query = ArtistApplication::with('user');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $apps = $query->latest()->paginate(20);
        return response()->json($apps);
    }

    /**
     * Review artist verification application.
     */
    public function reviewApplication(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'in:APPROVE,REJECT,REQUEST_CHANGES'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $admin = $request->user();
        $application = ArtistApplication::findOrFail($id);

        $statusMap = [
            'APPROVE' => 'APPROVED',
            'REJECT' => 'REJECTED',
            'REQUEST_CHANGES' => 'CHANGES_REQUESTED',
        ];

        $application->update([
            'status' => $statusMap[$validated['action']],
            'admin_notes' => $validated['admin_notes'] ?? null,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        // If approved, provision Artist entity and elevate user role
        if ($validated['action'] === 'APPROVE') {
            $user = $application->user;
            $user->update(['role' => 'ARTIST']);

            Artist::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'name' => $application->artist_name,
                    'slug' => Str::slug($application->artist_name) . '-' . Str::random(4),
                    'profile_image_url' => $application->profile_image_path ?? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
                    'banner_image_url' => $application->banner_image_path ?? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
                    'biography' => $application->biography,
                    'genres' => $application->genres,
                    'languages' => $application->languages,
                    'social_links' => $application->social_links,
                    'website' => $application->website,
                    'verified' => true,
                ]
            );
        }

        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'REVIEW_ARTIST_APPLICATION',
            'auditable_type' => ArtistApplication::class,
            'auditable_id' => $application->id,
            'new_values' => ['action' => $validated['action'], 'notes' => $validated['admin_notes'] ?? ''],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'data' => $application->fresh()->load('user'),
            'message' => "Application has been {$statusMap[$validated['action']]}.",
        ]);
    }

    /**
     * List releases for moderation.
     */
    public function releases(Request $request): JsonResponse
    {
        $query = Release::with(['artist', 'releaseSongs.song']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $releases = $query->latest()->paginate(20);
        return response()->json($releases);
    }

    /**
     * Review submitted release.
     */
    public function reviewRelease(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'in:APPROVE,REJECT,REQUEST_CHANGES,PUBLISH,TAKEDOWN'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $admin = $request->user();
        $release = Release::findOrFail($id);
        $oldStatus = $release->status;

        $newStatus = match ($validated['action']) {
            'APPROVE' => 'APPROVED',
            'PUBLISH' => 'PUBLISHED',
            'REJECT' => 'REJECTED',
            'REQUEST_CHANGES' => 'CHANGES_REQUESTED',
            'TAKEDOWN' => 'TAKEN_DOWN',
        };

        $release->update([
            'status' => $newStatus,
            'admin_feedback' => $validated['notes'] ?? null,
        ]);

        // Record review & status audit history
        ReleaseReview::create([
            'release_id' => $release->id,
            'reviewer_id' => $admin->id,
            'action' => $validated['action'],
            'notes' => $validated['notes'] ?? null,
        ]);

        ReleaseStatusHistory::create([
            'release_id' => $release->id,
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'changed_by' => $admin->id,
            'comment' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'data' => $release->fresh()->load(['artist', 'releaseSongs.song']),
            'message' => "Release marked as {$newStatus}.",
        ]);
    }

    /**
     * List all songs for content management.
     */
    public function songs(Request $request): JsonResponse
    {
        $songs = Song::with(['artist', 'album'])
            ->latest()
            ->paginate(25);

        return response()->json($songs);
    }

    /**
     * Toggle song status (PUBLISHED / TAKEN_DOWN).
     */
    public function updateSongStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:PUBLISHED,TAKEN_DOWN'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $song = Song::findOrFail($id);
        $song->update(['status' => $validated['status']]);

        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'UPDATE_SONG_STATUS',
            'auditable_type' => Song::class,
            'auditable_id' => $song->id,
            'new_values' => $validated,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'data' => $song,
            'message' => "Song status updated to {$validated['status']}.",
        ]);
    }

    /**
     * List copyright reports.
     */
    public function reports(Request $request): JsonResponse
    {
        $reports = CopyrightReport::with(['reporter', 'song.artist'])
            ->latest()
            ->paginate(20);

        return response()->json($reports);
    }

    /**
     * Resolve copyright complaint.
     */
    public function resolveReport(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'in:TAKEDOWN,DISMISS'],
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $admin = $request->user();
        $report = CopyrightReport::findOrFail($id);

        if ($validated['action'] === 'TAKEDOWN') {
            $report->song->update(['status' => 'TAKEN_DOWN']);
            $report->update([
                'status' => 'RESOLVED',
                'admin_action' => 'CONTENT_TAKEN_DOWN',
                'admin_notes' => $validated['notes'],
                'resolved_by' => $admin->id,
                'resolved_at' => now(),
            ]);
        } else {
            $report->update([
                'status' => 'DISMISSED',
                'admin_action' => 'REPORT_DISMISSED',
                'admin_notes' => $validated['notes'],
                'resolved_by' => $admin->id,
                'resolved_at' => now(),
            ]);
        }

        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'RESOLVE_COPYRIGHT_REPORT',
            'auditable_type' => CopyrightReport::class,
            'auditable_id' => $report->id,
            'new_values' => $validated,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'data' => $report->fresh()->load('song'),
            'message' => 'Report resolved.',
        ]);
    }

    /**
     * Audit trail logs.
     */
    public function auditLogs(): JsonResponse
    {
        $logs = AuditLog::with('user')->latest()->paginate(50);
        return response()->json($logs);
    }

    /**
     * User management.
     */
    public function users(): JsonResponse
    {
        $users = User::with('artist')->latest()->paginate(25);
        return response()->json($users);
    }
}
