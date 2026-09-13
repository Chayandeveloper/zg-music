<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('albums', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained('artists')->onDelete('cascade');
            $table->string('title')->index();
            $table->string('slug')->unique();
            $table->string('cover_url', 1024)->nullable();
            $table->text('description')->nullable();
            $table->string('genre', 100)->nullable()->index();
            $table->string('language', 100)->nullable()->index();
            $table->unsignedSmallInteger('release_year')->index();
            $table->date('release_date')->nullable();
            $table->unsignedInteger('songs_count')->default(0);
            $table->enum('status', ['PUBLISHED', 'TAKEN_DOWN'])->default('PUBLISHED')->index();
            $table->timestamps();
        });

        Schema::create('songs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained('artists')->onDelete('cascade');
            $table->foreignId('album_id')->nullable()->constrained('albums')->onDelete('set null');
            $table->string('title')->index();
            $table->string('slug')->index();
            $table->string('artwork_url', 1024)->nullable();
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->string('genre', 100)->nullable()->index();
            $table->string('language', 100)->nullable()->index();
            $table->string('stream_url', 1024)->nullable();
            $table->string('hls_master_url', 1024)->nullable();
            $table->unsignedBigInteger('play_count')->default(0)->index();
            $table->unsignedBigInteger('like_count')->default(0)->index();
            $table->unsignedSmallInteger('track_number')->default(1);
            $table->enum('status', ['PUBLISHED', 'TAKEN_DOWN'])->default('PUBLISHED')->index();
            $table->timestamps();
        });

        Schema::create('album_songs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('album_id')->constrained('albums')->onDelete('cascade');
            $table->foreignId('song_id')->constrained('songs')->onDelete('cascade');
            $table->unsignedSmallInteger('track_number')->default(1);
            $table->unique(['album_id', 'song_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('album_songs');
        Schema::dropIfExists('songs');
        Schema::dropIfExists('albums');
    }
};
