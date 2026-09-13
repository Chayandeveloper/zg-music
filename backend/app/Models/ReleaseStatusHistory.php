<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReleaseStatusHistory extends Model
{
    protected $table = 'release_status_history';

    protected $fillable = [
        'release_id',
        'from_status',
        'to_status',
        'changed_by',
        'comment',
    ];

    public function release()
    {
        return $this->belongsTo(Release::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
