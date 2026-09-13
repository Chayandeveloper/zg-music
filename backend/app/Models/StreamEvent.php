<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StreamEvent extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'song_id',
        'artist_id',
        'duration_played_seconds',
        'completed',
        'bitrate_streamed',
        'ip_address',
        'created_at',
    ];

    protected $casts = [
        'completed' => 'boolean',
        'duration_played_seconds' => 'integer',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function song()
    {
        return $this->belongsTo(Song::class);
    }

    public function artist()
    {
        return $this->belongsTo(Artist::class);
    }
}
