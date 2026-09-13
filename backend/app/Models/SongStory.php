<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SongStory extends Model
{
    protected $fillable = [
        'song_id',
        'movie',
        'release_year',
        'composer',
        'lyricist',
        'producer',
        'singer',
        'description',
        'story',
    ];

    public function song()
    {
        return $this->belongsTo(Song::class);
    }
}
