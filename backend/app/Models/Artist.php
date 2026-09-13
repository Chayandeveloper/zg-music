<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Artist extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'profile_image_url',
        'banner_image_url',
        'biography',
        'genres',
        'languages',
        'website',
        'social_links',
        'verified',
        'total_streams',
        'monthly_listeners',
        'followers_count',
        'is_rising',
    ];

    protected $casts = [
        'genres' => 'array',
        'languages' => 'array',
        'social_links' => 'array',
        'verified' => 'boolean',
        'is_rising' => 'boolean',
        'total_streams' => 'integer',
        'monthly_listeners' => 'integer',
        'followers_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function songs()
    {
        return $this->hasMany(Song::class);
    }

    public function albums()
    {
        return $this->hasMany(Album::class);
    }

    public function releases()
    {
        return $this->hasMany(Release::class);
    }

    public function followers()
    {
        return $this->hasMany(Follow::class);
    }

    public function analytics()
    {
        return $this->hasMany(ArtistAnalytic::class);
    }
}
