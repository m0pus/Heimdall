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
        Schema::create('himinbjorg_poll_logs', function (Blueprint $table) {
            $table->id();

            // Soft reference to items table (no FK constraint for backward compatibility)
            $table->unsignedBigInteger('item_id');

            // Poll result
            $table->enum('status', ['success', 'error', 'timeout']);
            $table->integer('response_time_ms')->nullable();
            $table->text('error_message')->nullable();

            // When this poll happened
            $table->timestamp('polled_at');

            // Indexes for querying logs
            $table->index(['item_id', 'polled_at']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('himinbjorg_poll_logs');
    }
};
