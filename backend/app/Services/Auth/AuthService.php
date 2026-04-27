<?php
// App/Services/Auth/AuthService.php

namespace App\Services\Auth;

use App\Exceptions\UserException;
use App\Models\User;
use App\Services\Admin\UserService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AuthService
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function register(array $data)
    {
        $data['role'] = 'user';

        try {
            $user = $this->userService->createUser($data);
            return $user;
        } catch (QueryException $e) {
            $message = strtolower($e->getMessage());

            if (str_contains($message, 'users_email_unique')) {
                throw new UserException(
                    UserException::EMAIL_ALREADY_EXISTS,
                    'El correo electrónico ya está en uso.'
                );
            }

            if (str_contains($message, 'users_username_unique')) {
                throw new UserException(
                    UserException::USERNAME_ALREADY_EXISTS,
                    'El nombre de usuario ya está en uso.'
                );
            }

            throw new UserException(
                UserException::GENERAL_ERROR,
                'Ha ocurrido un error al registrar el usuario.'
            );
        } catch (UserException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new UserException(
                UserException::GENERAL_ERROR,
                'Ha ocurrido un error al registrar el usuario.'
            );
        }
    }

    public function login(array $credentials): User
    {
        $login = trim($credentials['login']);
        $password = $credentials['password'];

        $field = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $ok = Auth::guard('web')->attempt([
            $field => $login,
            'password' => $password,
        ]);

        if (!$ok) {
            throw new UserException(
                UserException::INVALID_DATA,
                'Credenciales incorrectas.',
                401
            );
        }

        return Auth::guard('web')->user();
    }

    public function guestLogin(string $baseName)
    {
        // Limpiar el nombre
        $cleanName = preg_replace('/[^A-Za-z0-9]/', '', $baseName) ?: 'Guest';

        // Generar un username único
        do {
            $username = $cleanName . '_' . rand(1000, 9999);
        } while (User::where('username', $username)->exists());

        // Generar datos ficticios para cumplir las restricciones de la base de datos
        $fakeEmail = strtolower($username) . '@guest.chaosinc';
        $fakePassword = Str::random(16);

        $user = $this->userService->createUser([
            'username' => $username,
            'email'    => $fakeEmail,
            'password' => $fakePassword,
            'role'     => 'user',
            'is_guest' => true,
        ]);

        return $user;
    }
}
