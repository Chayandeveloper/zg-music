<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Song;
use App\Models\Artist;
use App\Models\Album;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

class ExternalMusicTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create(['role' => 'ARTIST']);
        $artist = Artist::create([
            'user_id' => $user->id,
            'name' => 'Zubeen Garg',
            'slug' => 'zubeen-garg',
            'genres' => ['Modern Assamese'],
            'languages' => ['Assamese'],
            'source_type' => 'INTERNAL',
            'verified' => true,
        ]);

        $album = Album::create([
            'artist_id' => $artist->id,
            'title' => 'Maya',
            'slug' => 'maya',
            'release_year' => 1994,
            'source_type' => 'INTERNAL',
            'status' => 'PUBLISHED',
        ]);

        Song::create([
            'artist_id' => $artist->id,
            'album_id' => $album->id,
            'title' => 'Maya Mathu Maya',
            'slug' => 'maya-mathu-maya',
            'duration_seconds' => 285,
            'stream_url' => 'https://example.com/audio.mp3',
            'source_type' => 'INTERNAL',
            'status' => 'PUBLISHED',
        ]);
    }

    public function test_external_search_proxies_to_python_service(): void
    {
        Http::fake([
            '*/api/v1/search*' => Http::response([
                'query' => 'Wonderwall',
                'songs' => [
                    [
                        'title' => 'Wonderwall',
                        'artist' => 'Oasis',
                        'duration_seconds' => 258,
                        'source_type' => 'EXTERNAL',
                        'external_source' => 'YOUTUBE_MUSIC',
                        'external_id' => 'abc12345',
                        'external_url' => 'https://music.youtube.com/watch?v=abc12345',
                    ],
                ],
                'artists' => [],
                'albums' => [],
                'playlists' => [],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/external/search?q=Wonderwall');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'source_type' => 'EXTERNAL',
                'external_source' => 'YOUTUBE_MUSIC',
                'available' => true,
            ])
            ->assertJsonPath('data.songs.0.title', 'Wonderwall')
            ->assertJsonPath('data.songs.0.source_type', 'EXTERNAL')
            ->assertJsonPath('data.songs.0.external_source', 'YOUTUBE_MUSIC')
            ->assertJsonPath('data.songs.0.external_id', 'abc12345');
    }

    public function test_combined_search_separates_internal_and_external_catalogs(): void
    {
        Http::fake([
            '*/api/v1/search*' => Http::response([
                'query' => 'Maya',
                'songs' => [
                    [
                        'title' => 'Maya External Version',
                        'artist' => 'External Artist',
                        'source_type' => 'EXTERNAL',
                        'external_source' => 'YOUTUBE_MUSIC',
                        'external_id' => 'ext_maya_99',
                    ],
                ],
                'artists' => [],
                'albums' => [],
                'playlists' => [],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/search?q=Maya');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'query',
                    'internal' => ['songs', 'artists', 'albums', 'playlists'],
                    'external' => ['songs', 'artists', 'albums', 'playlists'],
                    'external_available',
                ],
            ]);

        // Check internal song
        $this->assertEquals('Maya Mathu Maya', $response->json('data.internal.songs.0.title'));
        $this->assertEquals('INTERNAL', $response->json('data.internal.songs.0.source_type'));

        // Check external song
        $this->assertEquals('Maya External Version', $response->json('data.external.songs.0.title'));
        $this->assertEquals('EXTERNAL', $response->json('data.external.songs.0.source_type'));
    }

    public function test_search_deduplication_prefers_internal_catalog_version(): void
    {
        // YouTube returns exact same song title and artist as internal DB song ('Maya Mathu Maya' by 'Zubeen Garg')
        Http::fake([
            '*/api/v1/search*' => Http::response([
                'query' => 'Maya Mathu Maya',
                'songs' => [
                    [
                        'title' => 'Maya Mathu Maya (Official Audio)',
                        'artist' => 'Zubeen Garg',
                        'duration_seconds' => 285,
                        'source_type' => 'EXTERNAL',
                        'external_source' => 'YOUTUBE_MUSIC',
                        'external_id' => 'yt_duplicate_123',
                    ],
                    [
                        'title' => 'Completely Different Song',
                        'artist' => 'Another Artist',
                        'duration_seconds' => 190,
                        'source_type' => 'EXTERNAL',
                        'external_source' => 'YOUTUBE_MUSIC',
                        'external_id' => 'yt_unique_456',
                    ],
                ],
                'artists' => [],
                'albums' => [],
                'playlists' => [],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/search?q=Maya Mathu Maya');

        $response->assertStatus(200);
        $songs = $response->json('data.songs');

        // Total unified songs should only have 2 (Internal 'Maya Mathu Maya' and unique 'Completely Different Song')
        // Duplicate 'Maya Mathu Maya (Official Audio)' should have been pruned in favor of internal version!
        $this->assertCount(2, $songs);
        $this->assertEquals('Maya Mathu Maya', $songs[0]['title']);
        $this->assertEquals('INTERNAL', $songs[0]['source_type']);
        $this->assertEquals('INTERNAL_HLS', $songs[0]['playback']['type']);

        $this->assertEquals('Completely Different Song', $songs[1]['title']);
        $this->assertEquals('EXTERNAL', $songs[1]['source_type']);
        $this->assertEquals('YOUTUBE_EMBEDDED', $songs[1]['playback']['type']);
    }

    public function test_external_song_metadata_endpoint(): void
    {
        Http::fake([
            '*/api/v1/songs/abc12345' => Http::response([
                'title' => 'Yellow',
                'artist' => 'Coldplay',
                'duration_seconds' => 269,
                'source_type' => 'EXTERNAL',
                'external_source' => 'YOUTUBE_MUSIC',
                'external_id' => 'abc12345',
                'external_url' => 'https://music.youtube.com/watch?v=abc12345',
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/external/songs/abc12345');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'title' => 'Yellow',
                    'artist' => 'Coldplay',
                    'source_type' => 'EXTERNAL',
                    'external_source' => 'YOUTUBE_MUSIC',
                    'external_id' => 'abc12345',
                ],
            ]);
    }

    public function test_graceful_fallback_when_external_service_fails(): void
    {
        // Simulate service returning 500 error
        Http::fake([
            '*/api/v1/search*' => Http::response(['detail' => 'Service error'], 500),
        ]);

        $response = $this->getJson('/api/v1/search?q=Maya');

        // Main search MUST still return 200 OK with internal results intact
        $response->assertStatus(200)
            ->assertJsonPath('data.external_available', false);

        $this->assertNotEmpty($response->json('data.internal.songs'));
        $this->assertEquals('Maya Mathu Maya', $response->json('data.internal.songs.0.title'));
    }

    public function test_database_source_type_distinction(): void
    {
        $internalSong = Song::first();
        $this->assertEquals('INTERNAL', $internalSong->source_type);
        $this->assertNull($internalSong->external_id);

        $artist = Artist::first();
        $externalSong = Song::create([
            'artist_id' => $artist->id,
            'title' => 'External Track',
            'slug' => 'external-track',
            'duration_seconds' => 200,
            'source_type' => 'EXTERNAL',
            'external_source' => 'YOUTUBE_MUSIC',
            'external_id' => 'yt_vid_999',
            'external_url' => 'https://music.youtube.com/watch?v=yt_vid_999',
            'status' => 'PUBLISHED',
        ]);

        $this->assertEquals('EXTERNAL', $externalSong->fresh()->source_type);
        $this->assertEquals('YOUTUBE_MUSIC', $externalSong->fresh()->external_source);
        $this->assertEquals('yt_vid_999', $externalSong->fresh()->external_id);
    }

    public function test_external_stream_endpoint_proxies_to_stream_service(): void
    {
        Http::fake([
            '*/api/v1/stream/Fg4MfA3BCyI' => Http::response([
                'videoId' => 'Fg4MfA3BCyI',
                'streamUrl' => 'https://rr3---sn-4g5ednle.googlevideo.com/videoplayback?expire=12345',
                'title' => 'City Of Blinding Lights',
                'duration' => 346,
                'ext' => 'm4a',
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/external/stream/Fg4MfA3BCyI');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'videoId' => 'Fg4MfA3BCyI',
                    'streamUrl' => 'https://rr3---sn-4g5ednle.googlevideo.com/videoplayback?expire=12345',
                    'title' => 'City Of Blinding Lights',
                ],
            ]);
    }
}

