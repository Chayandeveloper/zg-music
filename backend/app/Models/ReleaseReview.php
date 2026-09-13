<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReleaseReview extends Model
{
    protected $fillable = [
        'release_id',
        'reviewer_id',
        'action',
        'notes',
    ];

    public function release()
    {
        return $this->belongsTo(Release::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
