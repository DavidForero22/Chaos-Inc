<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_card_usage', function (Blueprint $table) {
            $table->id();

            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->unsignedInteger('card_id');
            $table->foreign('card_id')->references('id')->on('cards')->cascadeOnDelete();

            $table->string('card_name');

            $table->integer('times_played')->default(1);

            $table->timestamps();

            $table->index(['card_id', 'times_played']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_card_usage');
    }
};
