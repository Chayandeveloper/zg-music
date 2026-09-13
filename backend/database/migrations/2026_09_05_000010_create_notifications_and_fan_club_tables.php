<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('type', 100)->index();
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::create('fan_clubs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->unique()->constrained('artists')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('banner_url', 1024)->nullable();
            $table->unsignedBigInteger('member_count')->default(0);
            $table->timestamps();
        });

        Schema::create('fan_club_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fan_club_id')->constrained('fan_clubs')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('joined_at')->useCurrent();
            $table->unique(['fan_club_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fan_club_members');
        Schema::dropIfExists('fan_clubs');
        Schema::dropIfExists('notifications');
    }
};
