<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('game_user', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->boolean('is_guest')->default(false)->after('user_id');
            $table->string('display_name')->after('is_guest');
        });

        // Trigger: user_id obligatorio si no es invitado
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

        // También para UPDATE
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
};
