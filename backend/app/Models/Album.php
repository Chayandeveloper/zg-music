<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Album extends Model
{
    protected $fillable = [
        'artist_id',
        'title',
        'slug',
        'cover_url',
        'description',
        'genre',
        'language',
        'release_year',
        'release_date',
        'songs_count',
        'status',
    ];

    protected $casts = [
        'release_year' => 'integer',
        'songs_count' => 'integer',
        'release_date' => 'date',
    ];

    public function artist()
    {
        return $this->belongsTo(Artist::class);
    }

    public function songs()
    {
        return $this->belongsToMany(Song::class, 'album_songs')
                    ->withPivot('track_number')
                    ->orderBy('album_songs.track_number');
    }
}
