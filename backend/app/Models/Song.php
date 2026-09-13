<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Song extends Model
{
    protected $fillable = [
        'artist_id',
        'album_id',
        'title',
        'slug',
        'artwork_url',
        'duration_seconds',
        'genre',
        'language',
        'stream_url',
        'hls_master_url',
        'play_count',
        'like_count',
        'track_number',
        'status',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
        'play_count' => 'integer',
        'like_count' => 'integer',
        'track_number' => 'integer',
    ];

    public function artist()
    {
        return $this->belongsTo(Artist::class);
    }

    public function album()
    {
        return $this->belongsTo(Album::class);
    }

    public function story()
    {
        return $this->hasOne(SongStory::class);
    }

    public function lyrics()
    {
        return $this->hasOne(Lyric::class);
    }

    public function variants()
    {
        return $this->hasMany(AudioVariant::class);
    }

    public function audioFile()
    {
        return $this->hasOne(AudioFile::class);
    }

    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    public function streamEvents()
    {
        return $this->hasMany(StreamEvent::class);
    }
}
