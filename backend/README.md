# Chaos Inc. — Backend

API REST, servidor de eventos en tiempo real y procesamiento en segundo plano de **Chaos Inc.**, construido con **Laravel 11**.

Para una visión general del proyecto, consulta el [README principal](../README.md).

---

## Índice

1. [Tecnologías](#tecnologías)
2. [Arquitectura](#arquitectura)
3. [Estructura de carpetas](#estructura-de-carpetas)
4. [Puesta en marcha](#puesta-en-marcha)
5. [Variables de entorno](#variables-de-entorno)
6. [Almacenamiento de datos](#almacenamiento-de-datos)
7. [API REST](#api-rest)
8. [Autenticación y seguridad](#autenticación-y-seguridad)
9. [Tiempo real (Reverb)](#tiempo-real-reverb)
10. [Jobs y tareas programadas](#jobs-y-tareas-programadas)
11. [Configuración del juego](#configuración-del-juego)
12. [Gestión de errores](#gestión-de-errores)
13. [Comandos útiles](#comandos-útiles)
14. [Documentación relacionada](#documentación-relacionada)

---

## Tecnologías

| Paquete | Uso |
| --- | --- |
| `laravel/framework` ^11 (PHP ^8.2) | Framework base. La imagen Docker usa PHP 8.4. |
| `laravel/sanctum` | Autenticación *stateful* para SPA (cookies de sesión + CSRF). |
| `laravel/socialite` + `socialiteproviders/discord` | Inicio de sesión con Google y Discord. |
| `laravel/reverb` | Servidor de WebSockets. |
| `intervention/image` | Procesado de avatares subidos por los usuarios. |
| Extensión `phpredis` | Cliente de Redis. |
| `laravel/pint`, `phpunit` | Estilo de código y pruebas. |

Servicios externos: **MySQL 8** y **Redis** (en Docker, [Valkey](https://valkey.io) 8, compatible con Redis).

---

## Arquitectura

El código se organiza en capas con responsabilidades claras:

```text
Petición HTTP
   │
   ▼
Controller ──► FormRequest (validación)        Controladores finos: solo traducen HTTP ⇄ servicios
   │
   ▼
Service ──────► Redis (estado de partidas)      Toda la lógica de negocio vive aquí
   │      └──► Eloquent / MySQL (persistencia)
   ├────────► Event  ──► Reverb (WebSocket)     Notifica a los clientes conectados
   └────────► Job    ──► Cola (Redis)           Resoluciones diferidas y temporizadores
```

- **Controladores** (`app/Http/Controllers`): reciben la petición, delegan en un servicio y devuelven JSON.
- **Servicios** (`app/Services`): contienen las reglas del juego, de las salas y de la autenticación.
- **Recursos** (`app/Http/Resources`): dan forma a las respuestas JSON (`MyDataResource`, `GameDataResource`, `RoomResource`, `UserResource`…).
- **Eventos** (`app/Events`): se emiten por WebSocket tras cada cambio de estado.
- **Jobs** (`app/Jobs`): temporizadores y resoluciones diferidas (fin de turno automático, desconexiones, ataques sin respuesta…).
- **Excepciones de dominio** (`app/Exceptions`): `RoomException`, `GameException` y `UserException`, con respuesta JSON propia.

### Modelo de ejecución en tiempo real

Las partidas **no** se guardan en MySQL mientras se juegan: su estado vive en Redis. Cada endpoint de juego valida la jugada, modifica Redis y emite `RoomStateUpdated`; los clientes responden llamando a `/sync` para obtener su vista del estado. Cuando la partida acaba, `GameFinalizationService` persiste el resultado en MySQL y programa la limpieza de Redis.

---

## Estructura de carpetas

```text
backend/
├── app/
│   ├── Events/               # RoomListUpdated, RoomStateUpdated, GameStarted, GameFinalized
│   ├── Exceptions/           # RoomException, GameException, UserException
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/         # AuthController, SocialAuthController, FriendshipController
│   │   │   ├── Lobby/        # LiveRoomController, LiveGameController, DebugController
│   │   │   ├── Admin/        # User, Game, Room y Analytics (también sirven rutas públicas)
│   │   │   └── GalleryController.php
│   │   ├── Middleware/       # IsAdmin, IsDebugRoom
│   │   ├── Requests/         # FormRequests agrupados por dominio (Auth, Room, Game, User)
│   │   └── Resources/        # Transformadores de respuesta JSON
│   ├── Jobs/                 # Temporizadores y resoluciones diferidas
│   ├── Models/               # User, Game, GameUser, Card, Achievement, Friendship, SocialAccount…
│   ├── Policies/             # UserPolicy
│   ├── Providers/            # AppServiceProvider (rate limiters, Socialite)
│   ├── Services/
│   │   ├── Admin/            # UserService, GameService, RoomService, AnalyticsService
│   │   ├── Auth/             # AuthService, SocialAuthService, FriendshipService, TokenService
│   │   ├── Lobby/            # LiveRoomService
│   │   └── Game/
│   │       ├── LiveGameService.php   # Inicio de partida y vista de estado (/sync)
│   │       ├── DebugService.php      # Herramientas de salas de prueba
│   │       ├── Actions/              # GameActionService, GameReactionService, CardEffectService
│   │       ├── Engine/               # TurnService, DeckService, CombatService, CardValidationService,
│   │       │                         # PlayerHandService, ExperienceService, AchievementService
│   │       └── Status/               # DisconnectionService, ReconnectionService, GameFinalizationService
│   └── Support/              # CardHelper, CastHelper, LiveGameHelper, RoomLogger
├── bootstrap/app.php         # Rutas, middleware (statefulApi, CSRF) y excepciones
├── config/                   # Config de Laravel + config/game/* (cartas, perks, cartas caóticas)
├── database/
│   ├── migrations/
│   └── seeders/              # DatabaseSeeder (superadmin), CardSeeder, AchievementSeeder
├── lang/es/game.php          # Mensajes del registro de partida (en español)
├── routes/
│   ├── api.php               # API REST (prefijo /api/v1)
│   ├── web.php               # Rutas OAuth (/auth/{provider}/…)
│   ├── channels.php          # Autorización de canales de WebSocket
│   └── console.php           # Comando y tarea programada de purga de invitados
└── tests/
```

---

## Puesta en marcha

La forma recomendada es **Docker Compose** desde la raíz del repositorio (ver el [README principal](../README.md#puesta-en-marcha)). Si prefieres ejecutarlo sin Docker:

**Requisitos:** PHP 8.2+ con las extensiones `pdo_mysql`, `mbstring`, `exif`, `pcntl`, `bcmath`, `gd` y `redis`; Composer; MySQL 8; Redis.

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Edita `.env` apuntando a tus servicios locales (`DB_HOST=127.0.0.1`, `REDIS_HOST=127.0.0.1`, `DB_PASSWORD`, `REDIS_PASSWORD`, credenciales de Reverb y `SUPER_ADMIN_*`). Después:

```bash
php artisan migrate --seed       # Crea las tablas, cartas, logros y el superadministrador
php artisan storage:link         # Enlace público para los avatares

# Cada proceso en una terminal distinta:
php artisan serve                # API en http://localhost:8000
php artisan reverb:start         # WebSockets en el puerto 8080
php artisan queue:work           # Procesa jobs (imprescindible para el juego)
php artisan schedule:work        # Tareas programadas (purga de invitados)
```

> El **worker de cola es imprescindible**: sin él no se agotan los turnos, no se resuelven los ataques sin respuesta ni se gestionan las desconexiones.

---

## Variables de entorno

Plantilla completa y comentada en [`.env.example`](.env.example). Las más relevantes:

| Variable | Descripción |
| --- | --- |
| `APP_KEY`, `APP_URL`, `FRONTEND_URL` | Clave de la aplicación y URLs del backend y del frontend (usada en CORS y en las redirecciones OAuth). |
| `DB_*` | Conexión a MySQL. |
| `REDIS_*` | Conexión a Redis. Se usa para el estado de partidas **y** para la cola (`QUEUE_CONNECTION=redis`). |
| `SESSION_DRIVER`, `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS` | Sesión y dominios autorizados para autenticación por cookies. En producción deben contener el dominio real. |
| `BROADCAST_CONNECTION=reverb`, `REVERB_*` | Servidor de WebSockets. `REVERB_APP_KEY` debe coincidir con `VITE_REVERB_APP_KEY` del frontend. |
| `GOOGLE_*`, `DISCORD_*` | Credenciales y URIs de retorno OAuth (ver [autenticación social](../docs/social-auth.md)). |
| `SUPER_ADMIN_USERNAME / EMAIL / PASSWORD` | Cuenta de administrador que crea el *seeder* inicial. |

---

## Almacenamiento de datos

### MySQL (persistencia)

Guarda lo que debe sobrevivir a una partida.

| Tabla | Contenido |
| --- | --- |
| `users` | Usuarios registrados e invitados (`is_guest`), rol (`admin` / `user`), avatar y `total_xp`. Usa *soft delete*. |
| `social_accounts` | Cuentas de Google/Discord vinculadas a un usuario. |
| `friendships` | Relaciones de amistad (`pending` / `accepted`). |
| `games` | Una fila por partida terminada: rol ganador, rondas y eliminaciones (`winner_role` incluye `canceled`). |
| `game_user` | Participación de cada jugador en una partida: rol, resultado y estadísticas. `user_id` admite nulos, pero un *trigger* de MySQL obliga a informarlo cuando el jugador no es invitado. |
| `game_card_usage` | Veces que cada usuario registrado jugó cada carta en una partida. |
| `cards`, `user_discovered_cards` | Catálogo de cartas y colección descubierta por cada usuario (galería). |
| `achievements`, `achievement_user` | Catálogo de logros y logros desbloqueados. |
| `sessions`, `password_reset_tokens`, `personal_access_tokens`, `cache`, `jobs` | Tablas estándar de Laravel. |

### Redis (estado efímero)

Salas y partidas en curso, con caducidad de 24 horas. Convención de claves: `room:{roomId}:…`.

| Clave | Tipo | Contenido |
| --- | --- | --- |
| `active_rooms` | set | IDs de las salas existentes. |
| `player:{playerId}:room` | string | Sala en la que está el jugador (evita estar en dos a la vez). |
| `room:{id}:info` | hash | Datos de configuración: nombre, dueño, privacidad, contraseña (hash), aforo, tiempo por turno, `is_debug`. |
| `room:{id}:state` | hash | Estado: `status` (`waiting`/`in_game`), `game_over`, `winner_role`, `round_number`, turno actual y su expiración. |
| `room:{id}:players` | set | IDs de los jugadores de la sala. |
| `room:{id}:token:{uuid}` | string | *Game token* → ID del jugador. |
| `room:{id}:turn_order`, `room:{id}:deck` | string (JSON) | Orden de turnos y mazo. |
| `room:{id}:player:{pid}:info / stats / turn_state / perks` | hash | Rol, estrés y conexión; estadísticas; límites del turno; pasivas equipadas. |
| `room:{id}:player:{pid}:hand` | string (JSON) | Mano del jugador. |
| `room:{id}:pending_attack`, `…:pending_multi_attack`, `…:pending_sabotage`, `…:luck_challenge:{pid}` | hash / string | Acciones pendientes de respuesta. |
| `room:{id}:boss_grace_period`, `…:acting_boss_grace_period`, `…:ending_grace_period` | string | Ventanas de gracia por desconexión. |

El detalle de cómo se usan estas claves está en [`docs/rooms.md`](../docs/rooms.md).

---

## API REST

Todas las rutas cuelgan de `/api/v1` (excepto las de OAuth y `sanctum/csrf-cookie`). Las respuestas son JSON. Rutas definidas en [`routes/api.php`](routes/api.php).

| Grupo | Rutas | Acceso |
| --- | --- | --- |
| **Salud** | `GET /api/health`, `GET /up` | Público |
| **Autenticación** | `POST /register`, `/login`, `/guest-login` | Público (límite `auth`) |
| **Datos públicos** | `GET /rooms`, `/rooms/{id}`, `/cards`, `/leaderboard` | Público (límite `api`) |
| **Salas** | `POST /rooms`, `PUT /rooms/{id}`, `POST /rooms/{id}/join`, `/leave`, `/kick`, `/report-disconnect` | Autenticado (límite `game-actions`) |
| **Partida** | `POST /rooms/{id}/start`, `/sync`, `/action`, `/end-turn`, `/react`, `/react-multi`, `/react-discard`, `/discard`, `/discard-perks`, `/luck-challenge` | Autenticado + *game token* |
| **Depuración** | `POST /rooms/{id}/debug` | Autenticado + sala de depuración |
| **Sesión y perfil** | `GET /me`, `GET /me/games`, `POST /logout`, `/logout-all`, `GET/PUT /users/{user}`, `POST /users/{user}/avatar`, `DELETE /users/{user}` | Autenticado |
| **Autenticación social** | `DELETE /users/{user}/social/{provider}` (más las rutas `/auth/{provider}/…` de `web.php`) | Autenticado |
| **Amistades** | `GET /friends`, `/friends/pending`, `/friends/sent`, `POST /friends/{user}/request\|accept\|reject\|cancel`, `DELETE /friends/{user}` | Autenticado |
| **Partidas e historial** | `GET /games`, `/games/{game}`, `/users/{user}/games` | Autenticado |
| **Galería** | `GET /gallery` | Autenticado |
| **Administración** | `GET /analytics`, `POST /users`, `POST /games`, `POST /users/{user}/temp-password`, `DELETE /rooms/{id}` | Administrador |

La referencia detallada de cada endpoint de salas y partida está en [`docs/rooms.md`](../docs/rooms.md); la de amistades, en [`docs/friendships.md`](../docs/friendships.md); y la de OAuth, en [`docs/social-auth.md`](../docs/social-auth.md).

### Límites de peticiones (*rate limiting*)

Definidos en `AppServiceProvider`:

| Limitador | Límite | Clave |
| --- | --- | --- |
| `api` | 50 / minuto | ID de usuario o IP |
| `auth` | 10 / minuto | IP |
| `game-actions` | 60 / minuto | `X-Game-Token` o IP |

Al superarlos, la API responde `429`.

---

## Autenticación y seguridad

- **Sanctum en modo SPA** (`statefulApi`): la sesión viaja en una cookie y las peticiones que modifican datos exigen el token CSRF (`GET /sanctum/csrf-cookie` previo). Las excepciones al CSRF son `broadcasting/auth` y `rooms/*/leave` (este último está protegido por el *game token*, y permite `navigator.sendBeacon` al cerrar la pestaña).
- **CORS** restringido a `FRONTEND_URL` y a los orígenes de desarrollo, con `supports_credentials`.
- **Tres tipos de usuario:** administrador (`role = admin`), usuario registrado e **invitado** (`is_guest`). Los invitados pueden jugar pero no crear ni editar salas, y no acumulan progreso.
- **Autorización:** middleware `IsAdmin` para rutas de administración, `IsDebugRoom` para el endpoint de depuración y `UserPolicy` para editar/borrar usuarios (un administrador no puede borrarse a sí mismo).
- **Contraseñas** con *hash* (`bcrypt`); las contraseñas de las salas privadas también se almacenan con *hash*, incluso en Redis.
- **Game token:** UUID por jugador y sala (cabecera `X-Game-Token`) que identifica al jugador en los endpoints de partida.

---

## Tiempo real (Reverb)

| Canal | Tipo | Eventos | Uso |
| --- | --- | --- | --- |
| `lobby` | público | `RoomListUpdated` | Refrescar la lista de salas. |
| `room.{roomId}` | **presencia** | `RoomStateUpdated`, `GameStarted` | Estado de la sala y de la partida. La presencia permite saber quién está conectado. |
| `users.{id}` | privado | `GameFinalized` | Resumen de experiencia al terminar una partida (solo al propio usuario). |

La autorización de canales está en [`routes/channels.php`](routes/channels.php). Los eventos `RoomStateUpdated` incluyen opcionalmente el mensaje de registro, la carta jugada, logros desbloqueados, carta extra robada y el jugador expulsado.

---

## Jobs y tareas programadas

Todos los *jobs* se ejecutan en la cola `redis`. Usan **tokens únicos** para ignorar ejecuciones obsoletas (un *job* programado para un turno que ya terminó no hace nada).

| Job | Cuándo se programa | Qué hace |
| --- | --- | --- |
| `AutoEndTurnJob` | Al empezar un turno (`timeout + 3 s`) | Salta el turno si el jugador no actuó a tiempo. |
| `ResolveSingleAttackJob` | Ataque que el objetivo puede esquivar (18 s) | Aplica el daño si no hubo reacción. |
| `ResolveMultiAttackJob` | Ataque masivo (18 s) | Aplica el daño a quien no reaccionó. |
| `ResolveSabotageJob` | Sabotaje (18 s) | Descarta una carta al azar si el objetivo no eligió. |
| `ResolveLuckChallengeJob` | Turno con prueba de suerte (18 s) | Salta el turno si no se respondió. |
| `ProcessDisconnectionJob` | Desconexión o salida (4 s) | Confirma la desconexión y procesa la salida del lobby o de la partida. |
| `InheritBossRoleJob` | Desconexión del Jefe (10 s) | Asigna el cargo de jefe interino. |
| `CheckVictoryJob` | Condición de victoria por abandono (12 s) | Confirma y cierra la partida. |
| `CleanupRoomJob` | Fin de partida (10 s) | Borra todas las claves de la sala en Redis. |

**Tarea programada** (`routes/console.php`): `purge-guests`, cada hora. Anonimiza (`DeletedGuest_{id}`) y archiva (*soft delete*) los invitados con más de 24 horas, manteniendo intactas las estadísticas de sus partidas. También se puede lanzar a mano: `php artisan guests:purge`.

---

## Configuración del juego

Las reglas basadas en datos están en `config/game/`:

| Archivo | Contenido |
| --- | --- |
| `cards.php` | Catálogo de cartas (17 definiciones): tipo, objetivo, texto, iconos, imagen y **cantidad en el mazo** (`count`). Las cartas de categoría `chaotic` no entran en el mazo base. |
| `perks.php` | Claves de pasivas permitidas y su nombre (`has_shield`, `vision_bonus`, `has_distance`, `has_storage`, `has_luck`, `has_potato_launcher`). |
| `chaotic.php` | Probabilidad (`chance_per_cycle`) y posición mínima (`min_position`) con la que se inyecta una carta caótica en el mazo. |

Constantes de reglas en el código: estrés máximo (5 Jefe / 4 resto), puntos de experiencia (`ExperienceService`: victoria 100, derrota 30, eliminación 20, MVP 15; nivel máximo 50) y distribución de roles (`LiveGameHelper`).

Los mensajes del registro de partida están en [`lang/es/game.php`](lang/es/game.php).

---

## Gestión de errores

Los errores de dominio se lanzan como excepciones propias que se renderizan solas en JSON:

```json
{ "error": "La sala está llena.", "type": "ROOM_FULL" }
```

El campo `type` es estable y lo usa el frontend para decidir qué hacer (por ejemplo, redirigir a una página de error concreta).

| Excepción | Tipos |
| --- | --- |
| `RoomException` | `ROOM_NOT_FOUND`, `NOT_IN_ROOM`, `PASSWORD_REQUIRED`, `INCORRECT_PASSWORD`, `ROOM_FULL`, `NOT_LEADER`, `CANNOT_KICK_SELF`, `ALREADY_IN_ROOM`, `PLAYER_NOT_FOUND`, `NOT_ENOUGH_PLAYERS`, `ALREADY_IN_ANOTHER_ROOM` |
| `GameException` | `GAME_ALREADY_STARTED`, `GAME_NOT_STARTED`, `NOT_YOUR_TURN`, `INVALID_TARGET`, `CARD_NOT_IN_HAND`, `INVALID_ACTION`, `CANNOT_SKIP_DURING_ENDING`, `GAME_OVER` |
| `UserException` | `EMAIL_ALREADY_EXISTS`, `USERNAME_ALREADY_EXISTS`, `INVALID_DATA`, `GENERAL_ERROR` |

Las excepciones de dominio no se reportan al log de errores (ver `bootstrap/app.php`). Para depurar una partida concreta existe `RoomLogger`, que **solo escribe en el log si la sala es de depuración** (`is_debug`).

---

## Comandos útiles

```bash
php artisan migrate --seed          # Migrar y sembrar datos iniciales
php artisan migrate:fresh --seed    # Reiniciar la base de datos
php artisan guests:purge            # Purgar invitados caducados a mano
php artisan queue:work              # Procesar la cola
php artisan reverb:start --debug    # WebSockets con trazas
php artisan route:list              # Ver todas las rutas
./vendor/bin/pint                   # Formatear el código
php artisan test                    # Ejecutar pruebas (hoy, solo las de ejemplo)
```

---

## Documentación relacionada

- [README principal](../README.md)
- [Sistema de salas y partidas](../docs/rooms.md)
- [Sistema de amistades](../docs/friendships.md)
- [Autenticación social](../docs/social-auth.md)
- [Sistema de cartas](../docs/cards-system.md) y [guía para crear cartas nuevas](../docs/new-cards.md)
- [Logros](../docs/achievements.md)
- [Niveles y experiencia](../docs/levels.md)
- [Guía de despliegue](../DEPLOYMENT.md)
