<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('name')->index();
            $table->string('slug')->unique();
            $table->string('profile_image_url', 1024)->nullable();
            $table->string('banner_image_url', 1024)->nullable();
            $table->text('biography')->nullable();
            $table->json('genres')->nullable();
            $table->json('languages')->nullable();
            $table->string('website', 512)->nullable();
            $table->json('social_links')->nullable();
            $table->boolean('verified')->default(false)->index();
            $table->unsignedBigInteger('total_streams')->default(0);
            $table->unsignedBigInteger('monthly_listeners')->default(0);
            $table->unsignedBigInteger('followers_count')->default(0);
            $table->boolean('is_rising')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('artist_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('artist_name');
            $table->text('biography');
            $table->string('profile_image_path', 1024)->nullable();
            $table->string('banner_image_path', 1024)->nullable();
            $table->json('genres')->nullable();
            $table->json('languages')->nullable();
            $table->json('social_links')->nullable();
            $table->string('website', 512)->nullable();
            $table->text('artist_information')->nullable();
            $table->boolean('rights_declaration')->default(false);
            $table->timestamp('rights_declared_at')->nullable();
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'])->default('PENDING')->index();
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artist_applications');
        Schema::dropIfExists('artists');
    }
};
