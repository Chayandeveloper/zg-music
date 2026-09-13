<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AudioVariant extends Model
{
    protected $fillable = [
        'song_id',
        'bitrate',
        'format',
        'hls_playlist_url',
        'bandwidth',
        'file_size',
        'duration_seconds',
    ];

    public function song()
    {
        return $this->belongsTo(Song::class);
    }
}
