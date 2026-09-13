<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArtistApplication extends Model
{
    protected $fillable = [
        'user_id',
        'artist_name',
        'biography',
        'profile_image_path',
        'banner_image_path',
        'genres',
        'languages',
        'social_links',
        'website',
        'artist_information',
        'rights_declaration',
        'rights_declared_at',
        'status',
        'admin_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'genres' => 'array',
        'languages' => 'array',
        'social_links' => 'array',
        'rights_declaration' => 'boolean',
        'rights_declared_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
