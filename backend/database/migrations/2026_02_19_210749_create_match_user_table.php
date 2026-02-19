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
        Schema::create('match_user', function (Blueprint $table) {
            $table->id();

            // FK1 y FK2
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('match_id')->constrained()->onDelete('cascade');

            // Atributos de la partida para ECharts
            $table->boolean('has_won');
            $table->enum('role', ['boss', 'secretary', 'intern', 'union']);
            $table->integer('damage_dealt');
            $table->integer('damage_received');
            $table->integer('cards_played');
            $table->integer('eliminations');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('match_user');
    }
};
