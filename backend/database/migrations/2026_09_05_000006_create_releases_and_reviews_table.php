<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('releases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained('artists')->onDelete('cascade');
            $table->string('title');
            $table->enum('release_type', ['SINGLE', 'ALBUM', 'EP'])->default('SINGLE');
            $table->string('cover_image_path', 1024)->nullable();
            $table->string('genre', 100);
            $table->string('language', 100);
            $table->string('composer', 255)->nullable();
            $table->string('lyricist', 255)->nullable();
            $table->string('producer', 255)->nullable();
            $table->date('release_date')->nullable();
            $table->text('description')->nullable();
            $table->longText('lyrics')->nullable();
            $table->boolean('rights_declaration')->default(false);
            $table->timestamp('rights_declared_at')->nullable();
            $table->enum('status', [
                'DRAFT',
                'UPLOADING',
                'PROCESSING',
                'READY_FOR_REVIEW',
                'UNDER_REVIEW',
                'CHANGES_REQUESTED',
                'APPROVED',
                'REJECTED',
                'PUBLISHED',
                'TAKEDOWN_REQUESTED',
                'TAKEN_DOWN'
            ])->default('DRAFT')->index();
            $table->text('admin_feedback')->nullable();
            $table->timestamps();
        });

        Schema::create('release_songs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('release_id')->constrained('releases')->onDelete('cascade');
            $table->foreignId('song_id')->nullable()->constrained('songs')->onDelete('set null');
            $table->string('title');
            $table->string('original_master_path', 1024)->nullable();
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->unsignedSmallInteger('track_number')->default(1);
            $table->enum('processing_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])->default('PENDING')->index();
            $table->text('error_log')->nullable();
            $table->timestamps();
        });

        Schema::create('release_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('release_id')->constrained('releases')->onDelete('cascade');
            $table->foreignId('reviewer_id')->constrained('users')->onDelete('cascade');
            $table->enum('action', ['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'PUBLISH', 'TAKEDOWN']);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('release_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('release_id')->constrained('releases')->onDelete('cascade');
            $table->string('from_status');
            $table->string('to_status');
            $table->foreignId('changed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('release_status_history');
        Schema::dropIfExists('release_reviews');
        Schema::dropIfExists('release_songs');
        Schema::dropIfExists('releases');
    }
};
