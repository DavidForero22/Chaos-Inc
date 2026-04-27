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
        Schema::create('games', function (Blueprint $table) {
            $table->id();

            // Añadir ->index() aquí para búsquedas instantáneas
            $table->enum('winner_role', ['boss', 'secretary', 'intern', 'union'])->index();
            $table->integer('total_rounds');
            $table->integer('total_eliminations');

            $table->timestamps();

            // Añadir un índice compuesto o simple para ordenar rápido por fecha
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
