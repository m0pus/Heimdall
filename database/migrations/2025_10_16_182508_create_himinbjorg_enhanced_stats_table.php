<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('himinbjorg_enhanced_stats', function (Blueprint $table) {
            $table->id();

            // Soft reference to items table (no FK constraint for backward compatibility)
            $table->unsignedBigInteger('item_id');

            // Cached stats from background polling
            $table->json('stats')->nullable();
            $table->enum('status', ['active', 'inactive', 'error'])->default('inactive');
            $table->text('error_message')->nullable();
            $table->integer('response_time_ms')->nullable();

            // Polling metadata
            $table->timestamp('last_polled_at')->nullable();
            $table->timestamp('next_poll_at')->nullable();
            $table->integer('poll_count')->default(0);

            $table->timestamps();

            // Indexes for performance
            $table->index('item_id');
            $table->index('next_poll_at');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('himinbjorg_enhanced_stats');
    }
};
