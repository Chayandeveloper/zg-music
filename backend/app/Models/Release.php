<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Release extends Model
{
    protected $fillable = [
        'artist_id',
        'title',
        'release_type',
        'cover_image_path',
        'genre',
        'language',
        'composer',
        'lyricist',
        'producer',
        'release_date',
        'description',
        'lyrics',
        'rights_declaration',
        'rights_declared_at',
        'status',
        'admin_feedback',
    ];

    protected $casts = [
        'rights_declaration' => 'boolean',
        'rights_declared_at' => 'datetime',
        'release_date' => 'date',
    ];

    public function artist()
    {
        return $this->belongsTo(Artist::class);
    }

    public function releaseSongs()
    {
        return $this->hasMany(ReleaseSong::class);
    }

    public function reviews()
    {
        return $this->hasMany(ReleaseReview::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(ReleaseStatusHistory::class);
    }
}
