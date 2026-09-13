<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Artist;
use App\Models\Song;
use App\Models\Album;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CatalogAndPlayerTest extends TestCase
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
            'verified' => true,
        ]);

        $album = Album::create([
            'artist_id' => $artist->id,
            'title' => 'Maya',
            'slug' => 'maya',
            'release_year' => 1994,
            'status' => 'PUBLISHED',
        ]);

        Song::create([
            'artist_id' => $artist->id,
            'album_id' => $album->id,
            'title' => 'Maya Mathu Maya',
            'slug' => 'maya-mathu-maya',
            'duration_seconds' => 285,
            'stream_url' => 'https://example.com/audio.mp3',
            'status' => 'PUBLISHED',
        ]);
    }

    public function test_home_feed_returns_curated_sections(): void
    {
        $response = $this->getJson('/api/v1/home');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'greeting',
                    'trending',
                    'zubeen_top_hits',
                    'new_releases',
                    'rising_artists',
                    'featured_playlists',
                ],
            ]);
    }

    public function test_search_returns_grouped_results(): void
    {
        $response = $this->getJson('/api/v1/search?q=Maya');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'query',
                    'songs',
                    'artists',
                    'albums',
                    'playlists',
                ],
            ]);
    }

    public function test_stream_event_tracking_increments_count_when_qualified(): void
    {
        $song = Song::first();
        $initialPlays = $song->play_count;

        $response = $this->postJson('/api/v1/player/track-event', [
            'song_id' => $song->id,
            'duration_played_seconds' => 45, // >= 30 qualifies as stream
            'completed' => false,
            'bitrate_streamed' => '128k',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'qualified_stream' => true,
            ]);

        $this->assertEquals($initialPlays + 1, $song->fresh()->play_count);
    }

    public function test_toggle_like_song_persists_in_database(): void
    {
        $user = User::factory()->create();
        $song = Song::first();

        // Like song
        $response = $this->actingAs($user)->postJson("/api/v1/songs/{$song->id}/like");
        $response->assertStatus(200)->assertJsonPath('data.is_liked', true);
        $this->assertEquals(1, $song->fresh()->like_count);

        // Unlike song
        $response2 = $this->actingAs($user)->postJson("/api/v1/songs/{$song->id}/like");
        $response2->assertStatus(200)->assertJsonPath('data.is_liked', false);
        $this->assertEquals(0, $song->fresh()->like_count);
    }
}
