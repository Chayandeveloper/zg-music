<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Playlist extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'cover_url',
        'visibility',
        'songs_count',
    ];

    protected $casts = [
        'songs_count' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function songs()
    {
        return $this->belongsToMany(Song::class, 'playlist_songs')
                    ->withPivot('position')
                    ->orderBy('playlist_songs.position');
    }
}
