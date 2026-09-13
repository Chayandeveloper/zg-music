<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('playlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('cover_url', 1024)->nullable();
            $table->enum('visibility', ['PUBLIC', 'PRIVATE'])->default('PUBLIC')->index();
            $table->unsignedInteger('songs_count')->default(0);
            $table->timestamps();
        });

        Schema::create('playlist_songs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('playlist_id')->constrained('playlists')->onDelete('cascade');
            $table->foreignId('song_id')->constrained('songs')->onDelete('cascade');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
            $table->unique(['playlist_id', 'song_id']);
        });

        Schema::create('likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('song_id')->constrained('songs')->onDelete('cascade');
            $table->timestamps();
            $table->unique(['user_id', 'song_id']);
        });

        Schema::create('follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('artist_id')->constrained('artists')->onDelete('cascade');
            $table->timestamps();
            $table->unique(['user_id', 'artist_id']);
        });

        Schema::create('play_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('song_id')->constrained('songs')->onDelete('cascade');
            $table->unsignedInteger('playback_duration_seconds')->default(0);
            $table->boolean('completed')->default(false);
            $table->timestamp('played_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('play_history');
        Schema::dropIfExists('follows');
        Schema::dropIfExists('likes');
        Schema::dropIfExists('playlist_songs');
        Schema::dropIfExists('playlists');
    }
};
