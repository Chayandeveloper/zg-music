<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_listener_can_register_with_valid_details(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Himanta Deka',
            'email' => 'himanta@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email', 'role'],
                    'token',
                ],
                'message',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'himanta@example.com',
            'role' => 'LISTENER',
        ]);
    }

    public function test_listener_can_login_with_correct_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'bhupen@example.com',
            'password' => bcrypt('Secret123!'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'bhupen@example.com',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'user',
                    'token',
                ],
            ]);
    }

    public function test_listener_cannot_login_with_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'bhupen@example.com',
            'password' => bcrypt('Secret123!'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'bhupen@example.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(422);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $user = User::factory()->create(['name' => 'Jitul Sonowal']);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('data.user.name', 'Jitul Sonowal');
    }
}
