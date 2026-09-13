<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('song_stories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('song_id')->unique()->constrained('songs')->onDelete('cascade');
            $table->string('movie', 255)->nullable();
            $table->unsignedSmallInteger('release_year')->nullable();
            $table->string('composer', 255)->nullable();
            $table->string('lyricist', 255)->nullable();
            $table->string('producer', 255)->nullable();
            $table->string('singer', 255)->nullable();
            $table->text('description')->nullable();
            $table->longText('story')->nullable();
            $table->timestamps();
        });

        Schema::create('lyrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('song_id')->unique()->constrained('songs')->onDelete('cascade');
            $table->longText('lyrics_text');
            $table->string('language', 50)->nullable();
            $table->json('synced_data')->nullable(); // schema: [{ "time_ms": 12000, "text": "..." }]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lyrics');
        Schema::dropIfExists('song_stories');
    }
};
