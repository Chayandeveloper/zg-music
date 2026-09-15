<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE songs MODIFY COLUMN status ENUM('DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'TAKEN_DOWN', 'REJECTED') NOT NULL DEFAULT 'UNDER_REVIEW'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE songs MODIFY COLUMN status ENUM('PUBLISHED', 'TAKEN_DOWN') NOT NULL DEFAULT 'PUBLISHED'");
        }
    }
};
