<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Crear la tabla completa desde cero
        Schema::create('game_user', function (Blueprint $table) {
            $table->id();

            // FK1 y FK2 (user_id nullable desde el principio)
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('game_id')->constrained()->onDelete('cascade');

            // Datos de identidad temporal (vital para invitados)
            $table->boolean('is_guest')->default(false);
            $table->string('display_name');

            // Datos del resultado
            $table->boolean('has_won');
            $table->enum('role', ['boss', 'secretary', 'intern', 'union'])->index();
            $table->boolean('is_dead')->default(false);

            // Estadísticas de Combate y Soporte
            $table->integer('damage_dealt')->default(0);
            $table->integer('damage_received')->default(0);
            $table->integer('healing_done')->default(0);

            // Estadísticas de Inventario/Estrategia
            $table->integer('cards_played')->default(0);
            $table->integer('passives_played')->default(0);

            // Rendimiento letal y habilidades tácticas
            $table->integer('eliminations')->default(0);
            $table->integer('dodged_attacks')->default(0); 
            $table->integer('cards_stolen')->default(0);   

            $table->timestamps();
        });

        // Trigger: user_id obligatorio si no es invitado (INSERT)
        DB::unprepared('
            CREATE TRIGGER enforce_user_id_if_not_guest
            BEFORE INSERT ON game_user
            FOR EACH ROW
            BEGIN
                IF NEW.is_guest = 0 AND NEW.user_id IS NULL THEN
                    SIGNAL SQLSTATE "45000"
                    SET MESSAGE_TEXT = "user_id is required when is_guest is false";
                END IF;
            END
        ');

        // Trigger: user_id obligatorio si no es invitado (UPDATE)
        DB::unprepared('
            CREATE TRIGGER enforce_user_id_if_not_guest_update
            BEFORE UPDATE ON game_user
            FOR EACH ROW
            BEGIN
                IF NEW.is_guest = 0 AND NEW.user_id IS NULL THEN
                    SIGNAL SQLSTATE "45000"
                    SET MESSAGE_TEXT = "user_id is required when is_guest is false";
                END IF;
            END
        ');
    }

    public function down(): void
    {
        // Eliminar los triggers primero
        DB::unprepared('DROP TRIGGER IF EXISTS enforce_user_id_if_not_guest');
        DB::unprepared('DROP TRIGGER IF EXISTS enforce_user_id_if_not_guest_update');

        // Eliminar la tabla completa
        Schema::dropIfExists('game_user');
    }
};
