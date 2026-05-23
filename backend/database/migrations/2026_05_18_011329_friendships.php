<?php
// database/migrations/xxxx_create_friendships_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('friendships', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sender_id')
                ->constrained('users')
                ->onDelete('cascade');

            $table->foreignId('receiver_id')
                ->constrained('users')
                ->onDelete('cascade');

            $table->enum('status', ['pending', 'accepted'])
                ->default('pending');

            $table->timestamps();

            // Un usuario no puede enviar dos solicitudes al mismo usuario
            $table->unique(['sender_id', 'receiver_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('friendships');
    }
};
