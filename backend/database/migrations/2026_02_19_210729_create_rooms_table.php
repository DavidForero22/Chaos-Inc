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
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();

            // FK conectada a Users
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');

            $table->string('name');
            $table->boolean('is_private')->default(false);
            $table->string('password')->nullable();
            $table->enum('status', ['waiting', 'playing', 'finished'])->default('waiting');
            $table->integer('max_players')->default(4);
            $table->integer('turn_timeout')->default(30);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rooms');
    }
};
