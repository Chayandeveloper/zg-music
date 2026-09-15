<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('songs')
            ->where('stream_url', 'like', '%actions.google.com%')
            ->update([
                'stream_url' => DB::raw("COALESCE(hls_master_url, '/storage/hls/songs/1/master.m3u8')")
            ]);
    }

    public function down(): void
    {
        // No-op
    }
};
