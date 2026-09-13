<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayHistory extends Model
{
    public $timestamps = false;
    protected $table = 'play_history';

    protected $fillable = [
        'user_id',
        'song_id',
        'playback_duration_seconds',
        'completed',
        'played_at',
    ];

    protected $casts = [
        'completed' => 'boolean',
        'played_at' => 'datetime',
        'playback_duration_seconds' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function song()
    {
        return $this->belongsTo(Song::class);
    }
}
