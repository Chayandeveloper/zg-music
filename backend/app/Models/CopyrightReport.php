<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CopyrightReport extends Model
{
    protected $fillable = [
        'reporter_id',
        'song_id',
        'reason',
        'description',
        'infringing_urls',
        'status',
        'admin_action',
        'admin_notes',
        'resolved_by',
        'resolved_at',
    ];

    protected $casts = [
        'infringing_urls' => 'array',
        'resolved_at' => 'datetime',
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function song()
    {
        return $this->belongsTo(Song::class);
    }

    public function resolver()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
