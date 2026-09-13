<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lyric extends Model
{
    protected $fillable = [
        'song_id',
        'lyrics_text',
        'language',
        'synced_data',
    ];

    protected $casts = [
        'synced_data' => 'array',
    ];

    public function song()
    {
        return $this->belongsTo(Song::class);
    }
}
