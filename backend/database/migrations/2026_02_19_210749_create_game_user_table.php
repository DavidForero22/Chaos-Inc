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
        Schema::create('game_user', function (Blueprint $table) {
            $table->id();

            // FK1 y FK2 (Laravel crea índices para estas automáticamente al usar constrained)
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('game_id')->constrained()->onDelete('cascade');

            // Atributos de la partida para gráficos
            $table->boolean('has_won');
            // Añadir ->index() por si luego se filtran estadísticas por rol
            $table->enum('role', ['boss', 'secretary', 'intern', 'union'])->index();
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
        Schema::dropIfExists('game_user');
    }
};
