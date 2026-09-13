<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'password',
        'role',
        'avatar_url',
        'bio',
        'phone_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isArtist(): bool
    {
        return $this->role === 'ARTIST' || $this->role === 'ADMIN' || $this->role === 'SUPER_ADMIN';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'ADMIN' || $this->role === 'SUPER_ADMIN';
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'SUPER_ADMIN';
    }

    public function artist()
    {
        return $this->hasOne(Artist::class);
    }

    public function artistApplication()
    {
        return $this->hasOne(ArtistApplication::class);
    }

    public function playlists()
    {
        return $this->hasMany(Playlist::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function follows()
    {
        return $this->hasMany(Follow::class);
    }

    public function playHistories()
    {
        return $this->hasMany(PlayHistory::class);
    }

    public function userNotifications()
    {
        return $this->hasMany(Notification::class);
    }
}
