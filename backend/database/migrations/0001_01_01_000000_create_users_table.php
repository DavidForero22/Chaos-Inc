<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('username')->unique();
            $table->string('email')->unique()->nullable(); // Nullable: Discord puede no dar email
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();        // Nullable: usuarios OAuth no tienen contraseña
            $table->enum('role', ['admin', 'user'])->default('user');
            $table->boolean('is_guest')->default(false);

            $table->string('provider')->nullable();        // 'google' | 'discord'
            $table->string('provider_id')->nullable();     // ID único en el proveedor
            $table->string('avatar')->nullable();          // URL del avatar

            $table->rememberToken();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
