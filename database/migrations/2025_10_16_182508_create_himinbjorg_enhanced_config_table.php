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
        Schema::create('himinbjorg_enhanced_config', function (Blueprint $table) {
            $table->id();

            // Soft reference to items table (no FK constraint for backward compatibility)
            $table->unsignedBigInteger('item_id');

            // Himinbjörg-specific settings
            $table->integer('poll_interval')->default(300); // Seconds (5 minutes default)
            $table->boolean('enable_background_polling')->default(true);
            $table->boolean('notify_on_error')->default(false);
            $table->json('custom_settings')->nullable(); // App-specific extras

            $table->timestamps();

            // Indexes
            $table->unique('item_id');
            $table->index('enable_background_polling');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('himinbjorg_enhanced_config');
    }
};
