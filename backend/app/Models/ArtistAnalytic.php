<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArtistAnalytic extends Model
{
    protected $fillable = [
        'artist_id',
        'metric_date',
        'daily_streams',
        'daily_listeners',
        'new_followers',
        'total_duration_seconds',
    ];

    protected $casts = [
        'metric_date' => 'date',
        'daily_streams' => 'integer',
        'daily_listeners' => 'integer',
        'new_followers' => 'integer',
        'total_duration_seconds' => 'integer',
    ];

    public function artist()
    {
        return $this->belongsTo(Artist::class);
    }
}
