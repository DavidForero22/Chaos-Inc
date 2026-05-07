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

            $table->boolean('has_won');
            $table->enum('role', ['boss', 'secretary', 'intern', 'union'])->index();

            // Estadísticas de Combate y Soporte
            $table->integer('damage_dealt')->default(0);
            $table->integer('damage_received')->default(0);
            $table->integer('healing_done')->default(0);

            // Estadísticas de Inventario/Estrategia
            $table->integer('cards_played')->default(0);
            $table->integer('passives_played')->default(0);

            // Rendimiento letal
            $table->integer('eliminations')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_user');
    }
};
