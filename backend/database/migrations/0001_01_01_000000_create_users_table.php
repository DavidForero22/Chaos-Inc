<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabla principal de Identidad (Usuarios)
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            $table->string('username')->unique();
            $table->string('email')->unique()->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->enum('role', ['admin', 'user'])->default('user');
            $table->boolean('is_guest')->default(false);
            $table->string('avatar')->nullable();
            $table->unsignedInteger('total_xp')->default(0);

            $table->rememberToken();
            $table->softDeletes();
            $table->timestamps();

            // ÍNDICES PARA ANALÍTICAS
            $table->index('created_at');
            $table->index('is_guest');
            $table->index(['created_at', 'is_guest']);
        });

        // Tabla relacional de Métodos de Acceso (Google, Discord...)
        Schema::create('social_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->string('provider_name'); // 'google' o 'discord'
            $table->string('provider_id'); // La ID que da el proveedor
            $table->string('provider_avatar')->nullable(); // Foto de perfil en esa red social

            $table->timestamps();

            // Un usuario solo puede tener una cuenta de Google y una de Discord vinculadas
            $table->unique(['user_id', 'provider_name']);
            // Una cuenta de Discord no puede estar vinculada a dos usuarios distintos
            $table->unique(['provider_name', 'provider_id']);

            // ÍNDICE PARA ANALÍTICAS
            $table->index('provider_name');
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

    public function down(): void
    {
        Schema::dropIfExists('social_accounts');
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
