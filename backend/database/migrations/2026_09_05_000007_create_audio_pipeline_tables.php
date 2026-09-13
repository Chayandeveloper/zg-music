<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audio_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('song_id')->constrained('songs')->onDelete('cascade');
            $table->string('original_name');
            $table->string('storage_disk')->default('local');
            $table->string('storage_path', 1024);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size');
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->unsignedInteger('sample_rate')->default(44100);
            $table->unsignedSmallInteger('channels')->default(2);
            $table->timestamps();
        });

        Schema::create('audio_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('song_id')->constrained('songs')->onDelete('cascade');
            $table->enum('bitrate', ['64k', '128k', '192k', '320k'])->index();
            $table->string('format', 20)->default('aac');
            $table->string('hls_playlist_url', 1024);
            $table->unsignedInteger('bandwidth')->default(128000);
            $table->unsignedBigInteger('file_size')->default(0);
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audio_variants');
        Schema::dropIfExists('audio_files');
    }
};
