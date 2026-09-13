<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReleaseSong extends Model
{
    protected $fillable = [
        'release_id',
        'song_id',
        'title',
        'original_master_path',
        'duration_seconds',
        'track_number',
        'processing_status',
        'error_log',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
        'track_number' => 'integer',
    ];

    public function release()
    {
        return $this->belongsTo(Release::class);
    }

    public function song()
    {
        return $this->belongsTo(Song::class);
    }
}
