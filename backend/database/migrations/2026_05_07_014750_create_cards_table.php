<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cards', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();

            $table->string('base_name');
            $table->enum('type', ['attack', 'heal', 'default', 'perk']);
            $table->enum('category', ['normal', 'chaotic'])->default('normal');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cards');
    }
};
