<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AudioFile extends Model
{
    protected $fillable = [
        'song_id',
        'original_name',
        'storage_disk',
        'storage_path',
        'mime_type',
        'file_size',
        'duration_seconds',
        'sample_rate',
        'channels',
    ];

    public function song()
    {
        return $this->belongsTo(Song::class);
    }
}
