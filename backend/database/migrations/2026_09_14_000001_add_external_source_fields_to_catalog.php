<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            if (!Schema::hasColumn('songs', 'source_type')) {
                $table->string('source_type', 20)->default('INTERNAL')->index();
            }
            if (!Schema::hasColumn('songs', 'external_source')) {
                $table->string('external_source', 50)->nullable();
            }
            if (!Schema::hasColumn('songs', 'external_id')) {
                $table->string('external_id', 255)->nullable()->index();
            }
            if (!Schema::hasColumn('songs', 'external_url')) {
                $table->string('external_url', 1024)->nullable();
            }
        });

        Schema::table('artists', function (Blueprint $table) {
            if (!Schema::hasColumn('artists', 'source_type')) {
                $table->string('source_type', 20)->default('INTERNAL')->index();
            }
            if (!Schema::hasColumn('artists', 'external_source')) {
                $table->string('external_source', 50)->nullable();
            }
            if (!Schema::hasColumn('artists', 'external_id')) {
                $table->string('external_id', 255)->nullable()->index();
            }
        });

        Schema::table('albums', function (Blueprint $table) {
            if (!Schema::hasColumn('albums', 'source_type')) {
                $table->string('source_type', 20)->default('INTERNAL')->index();
            }
            if (!Schema::hasColumn('albums', 'external_source')) {
                $table->string('external_source', 50)->nullable();
            }
            if (!Schema::hasColumn('albums', 'external_id')) {
                $table->string('external_id', 255)->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn(['source_type', 'external_source', 'external_id']);
        });

        Schema::table('artists', function (Blueprint $table) {
            $table->dropColumn(['source_type', 'external_source', 'external_id']);
        });

        Schema::table('songs', function (Blueprint $table) {
            $table->dropColumn(['source_type', 'external_source', 'external_id', 'external_url']);
        });
    }
};
