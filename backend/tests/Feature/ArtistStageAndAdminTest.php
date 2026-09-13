<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Artist;
use App\Models\ArtistApplication;
use App\Models\Release;
use App\Models\Song;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ArtistStageAndAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_submit_artist_application_with_rights_declaration(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/artist/apply', [
            'artist_name' => 'Dipak Sharma',
            'biography' => 'Eminent classical and modern flute player and composer from Assam with multiple albums.',
            'genres' => ['Assamese Folk', 'Classical'],
            'languages' => ['Assamese'],
            'artist_information' => 'Solo musician and performing artist with 15 years studio experience.',
            'rights_declaration' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('artist_applications', [
            'user_id' => $user->id,
            'artist_name' => 'Dipak Sharma',
            'status' => 'PENDING',
            'rights_declaration' => true,
        ]);
    }

    public function test_admin_can_approve_artist_application_and_elevate_role(): void
    {
        $admin = User::factory()->create(['role' => 'SUPER_ADMIN']);
        $applicant = User::factory()->create(['role' => 'LISTENER']);

        $application = ArtistApplication::create([
            'user_id' => $applicant->id,
            'artist_name' => 'Dipak Sharma',
            'biography' => 'Eminent classical and modern flute player and composer from Assam.',
            'genres' => ['Assamese Folk'],
            'languages' => ['Assamese'],
            'artist_information' => 'Performing artist.',
            'rights_declaration' => true,
            'status' => 'PENDING',
        ]);

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/applications/{$application->id}/review", [
            'action' => 'APPROVE',
            'admin_notes' => 'Verified credentials and sound recordings.',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('APPROVED', $application->fresh()->status);
        $this->assertEquals('ARTIST', $applicant->fresh()->role);
        $this->assertDatabaseHas('artists', ['user_id' => $applicant->id, 'name' => 'Dipak Sharma']);
    }

    public function test_admin_can_review_and_publish_release(): void
    {
        $admin = User::factory()->create(['role' => 'ADMIN']);
        $artistUser = User::factory()->create(['role' => 'ARTIST']);
        $artist = Artist::create([
            'user_id' => $artistUser->id,
            'name' => 'Dipak Sharma',
            'slug' => 'dipak-sharma',
            'genres' => ['Assamese Folk'],
            'languages' => ['Assamese'],
        ]);

        $release = Release::create([
            'artist_id' => $artist->id,
            'title' => 'Echoes of Brahmaputra',
            'release_type' => 'SINGLE',
            'genre' => 'Assamese Folk',
            'language' => 'Assamese',
            'status' => 'UNDER_REVIEW',
            'rights_declaration' => true,
        ]);

        $response = $this->actingAs($admin)->postJson("/api/v1/admin/releases/{$release->id}/review", [
            'action' => 'PUBLISH',
            'notes' => 'Approved for release onto streaming catalog.',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('PUBLISHED', $release->fresh()->status);
    }
}
