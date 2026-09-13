<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stream_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('song_id')->constrained('songs')->onDelete('cascade');
            $table->foreignId('artist_id')->constrained('artists')->onDelete('cascade');
            $table->unsignedInteger('duration_played_seconds');
            $table->boolean('completed')->default(false);
            $table->string('bitrate_streamed', 20)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });

        Schema::create('artist_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('artist_id')->constrained('artists')->onDelete('cascade');
            $table->date('metric_date')->index();
            $table->unsignedBigInteger('daily_streams')->default(0);
            $table->unsignedBigInteger('daily_listeners')->default(0);
            $table->unsignedBigInteger('new_followers')->default(0);
            $table->unsignedBigInteger('total_duration_seconds')->default(0);
            $table->timestamps();
            $table->unique(['artist_id', 'metric_date']);
        });

        Schema::create('copyright_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('song_id')->constrained('songs')->onDelete('cascade');
            $table->enum('reason', ['COPYRIGHT', 'UNAUTHORIZED_UPLOAD', 'IMPERSONATION', 'OTHER'])->default('COPYRIGHT');
            $table->text('description');
            $table->json('infringing_urls')->nullable();
            $table->enum('status', ['PENDING', 'UNDER_INVESTIGATION', 'RESOLVED', 'DISMISSED'])->default('PENDING')->index();
            $table->string('admin_action', 100)->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action', 100)->index();
            $table->string('auditable_type', 150)->nullable()->index();
            $table->unsignedBigInteger('auditable_id')->nullable()->index();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('copyright_reports');
        Schema::dropIfExists('artist_analytics');
        Schema::dropIfExists('stream_events');
    }
};
