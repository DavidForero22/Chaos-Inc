# Chaos Inc. — Frontend

Aplicación de una sola página (SPA) de **Chaos Inc.**, construida con **React 19 + TypeScript + Vite**. Consume la API REST de Laravel y recibe los eventos de la partida en tiempo real mediante WebSockets.

Para una visión general del proyecto, consulta el [README principal](../README.md).

---

## Índice

1. [Tecnologías](#tecnologías)
2. [Puesta en marcha](#puesta-en-marcha)
3. [Variables de entorno](#variables-de-entorno)
4. [Estructura de carpetas](#estructura-de-carpetas)
5. [Enrutado](#enrutado)
6. [Gestión del estado](#gestión-del-estado)
7. [Capa de red (API)](#capa-de-red-api)
8. [Tiempo real (WebSockets)](#tiempo-real-websockets)
9. [Flujos principales](#flujos-principales)
10. [Almacenamiento local](#almacenamiento-local)
11. [Estilos y diseño](#estilos-y-diseño)
12. [Compilación y despliegue](#compilación-y-despliegue)
13. [Documentación relacionada](#documentación-relacionada)

---

## Tecnologías

| Tecnología | Uso |
| --- | --- |
| **React 19** + **TypeScript** (modo `strict`) | Interfaz de usuario con tipado estático. |
| **Vite 6** | Servidor de desarrollo y empaquetado. |
| **React Router 7** | Enrutado, con carga perezosa (*lazy*) de páginas. |
| **Zustand** | Estado global (sesión, sala, partida, interfaz). |
| **Axios** | Cliente HTTP con interceptores. |
| **Laravel Echo** + **pusher-js** | Cliente de WebSockets compatible con Laravel Reverb. |
| **Tailwind CSS 4** + **CSS Modules** | Utilidades para el desarrollo rápido y módulos CSS para componentes con diseños complejos. |
| **ECharts** (`echarts-for-react`) | Gráficas del perfil y del panel de administración. |
| **react-icons** | Iconografía. |
| **Bun** | Gestor de paquetes y *runtime* (`bun.lock`). |
| **ESLint** (`typescript-eslint`, `react-hooks`, `react-refresh`) | Análisis estático. |

---

## Puesta en marcha

### Con Docker (recomendado)

Desde la raíz del repositorio, `docker compose up -d --build` levanta todo el entorno, incluido este frontend con recarga en caliente en <http://localhost:5173>. Consulta el [README principal](../README.md#puesta-en-marcha).

### Sin Docker

Requiere [Bun](https://bun.sh) y el backend en marcha (ver [`backend/README.md`](../backend/README.md)).

```bash
cd frontend
cp .env.example .env     # y completa VITE_REVERB_APP_KEY
bun install
bun run dev              # http://localhost:5173
```

### Scripts

| Comando | Descripción |
| --- | --- |
| `bun run dev` | Servidor de desarrollo con recarga en caliente (*polling* de archivos activado, necesario dentro de Docker). |
| `bun run build` | Compilación de producción en `dist/`. |
| `bun run preview` | Sirve localmente la compilación de producción. |
| `bun run lint` | Ejecuta ESLint. |
| `bunx tsc --noEmit` | Comprobación de tipos (no forma parte de `build`). |

> `vite.config.ts` usa `strictPort: true`: si el puerto 5173 está ocupado, Vite falla en lugar de cambiar de puerto (el backend tiene ese origen permitido en CORS).

---

## Variables de entorno

Plantilla en [`.env.example`](.env.example). Vite solo expone las variables con prefijo `VITE_`, y se **incrustan en la compilación**: cambiarlas exige recompilar.

| Variable | Descripción | Valor local |
| --- | --- | --- |
| `VITE_API_URL` | URL base del backend, sin `/api/v1`. Opcional. | `http://localhost:8000` (por defecto) |
| `VITE_REVERB_APP_KEY` | Clave pública de Reverb. **Debe coincidir** con `REVERB_APP_KEY` del backend. | — |
| `VITE_REVERB_HOST` | Host del servidor de WebSockets, sin protocolo. | `localhost` |
| `VITE_REVERB_PORT` | Puerto de Reverb. | `8080` |
| `VITE_REVERB_SCHEME` | `http` en local, `https` en producción. | `http` |

---

## Estructura de carpetas

```text
frontend/
├── public/                   # Imágenes estáticas: cartas, roles, logros, guía, extras…
├── src/
│   ├── main.tsx              # Punto de entrada
│   ├── App.tsx               # Router, rutas y componentes globales
│   ├── bootstrap.ts          # Configura axios global e inicializa Echo
│   ├── echo.ts               # Instancia de Laravel Echo (Reverb)
│   ├── api/axios.ts          # Cliente HTTP e interceptores
│   ├── pages/                # Una por ruta: MainMenu, Rooms, GameBoard, Profile, Admin,
│   │   ├── errors/           #   Leaderboard, info (cómo jugar, saber más) y páginas de error
│   │   └── …
│   ├── layouts/              # NotebookLayout (libreta), WallLayout, ErrorLayout, overlay animado
│   ├── components/
│   │   ├── game/             # Tablero: board, player, overlays (modales), ui, debug
│   │   ├── lobby/            # Gestor global de sala, sala de espera, modales de acceso
│   │   ├── rooms/            # Lista de salas y formularios de crear/editar sala
│   │   ├── profile/          # Perfil: información, amigos, galería, historial, estadísticas
│   │   ├── admin/            # Panel de administración y analíticas
│   │   ├── how-to-play/      # Guía de juego
│   │   └── ui/               # Navbar, modales, toasts, loader, notificaciones de logros
│   ├── hooks/                # Lógica reutilizable agrupada por dominio
│   │   ├── auth/ lobby/ room/ profile/ leaderboard/ admin/ ui/
│   │   └── game/             # core/ (partida, temporizadores), network/ (sockets, reconexión),
│   │                         # players/ (acciones, cartas jugables), ui/ y utils/ (debug)
│   ├── store/                # Stores de Zustand por dominio (ver más abajo)
│   ├── types/                # Tipos compartidos con la API (api, live-game, user, xp, gallery)
│   ├── data/                 # Datos estáticos: roles, perks, logros, versiones, notificaciones
│   └── utils/                # Avatar, experiencia, logger, salida de sala
├── index.html
├── vite.config.ts
├── eslint.config.js
└── tsconfig.json
```

---

## Enrutado

Definido en [`src/App.tsx`](src/App.tsx). Las páginas se cargan de forma perezosa (`React.lazy`) con un *loader* de transición.

| Ruta | Página | Notas |
| --- | --- | --- |
| `/` | Menú principal | Layout de libreta |
| `/rooms` | Lista de salas | Layout de libreta |
| `/rooms/:id` | `RoomJoinInterceptor` | Guarda el ID de sala y redirige a `/rooms`; la entrada real la gestiona `GlobalRoomManager`. Es el enlace que se comparte. |
| `/game/:id` | Tablero de juego | Layout propio, pantalla completa |
| `/leaderboard` | Clasificación | Layout de libreta |
| `/profile`, `/profile/:userId` | Perfil propio y público | Los invitados ven una vista reducida |
| `/how-to-play`, `/know-more` | Guía y novedades (*changelog*) | Layout de libreta |
| `/admin` | Panel de administración | Protegida por `AdminGuard` (rol `admin`) |
| `/social-error` | Error de autenticación social | Lee `?error=` (`email_taken`, `provider_taken`, `oauth_failed`) |
| `/room-not-found`, `/room-full`, `/game-already-started`, `/already-in-another-room`, `/unauthorized`, `/user-not-found` | Páginas de error | A ellas se redirige según el `type` que devuelve la API |
| `*` | 404 | `/rooms/*` redirige a `/room-not-found` |

Siempre montados fuera del enrutado: `GlobalRoomManager` (panel de la sala actual), `AchievementNotification`, `Toast` y `GlobalLoader`.

---

## Gestión del estado

Se usa **Zustand** (un *store* por dominio, en `src/store/`).

| Store | Responsabilidad |
| --- | --- |
| `auth/useAuthStore` | Usuario autenticado (id, nombre, avatar, rol, cuentas sociales). Persiste en `localStorage` y se sincroniza entre pestañas. |
| `auth/useFriendsStore` | Amigos y solicitudes pendientes (recibidas y enviadas). |
| `room/useRoomStore` | Sala actual: unirse, salir, empezar, expulsar, *game token* y estado de la sala de espera. |
| `game/useGameStore` | Estado de la partida (`gameData`), `syncGame()` y fin de partida. Es la vista que devuelve `/sync`. |
| `game/useGameActions` | Acciones del jugador (jugar carta, reaccionar, terminar turno, descartar) con bloqueo mientras hay una petición en vuelo. |
| `game/useGameUIStore`, `game/useTimerStore` | Estado puramente visual de la partida y temporizadores. |
| `profile/*`, `leaderboard/*`, `admin/*` | Datos de perfil, clasificación y administración. |
| `ui/*` | Toasts, notificaciones y registro de la partida, *loader* global y logros. |

**Principio de diseño:** el cliente **no calcula** el resultado de las jugadas. Las acciones envían la intención al servidor y la respuesta (`applyGameData`) reemplaza el estado local completo.

---

## Capa de red (API)

[`src/api/axios.ts`](src/api/axios.ts) exporta una instancia de Axios con `baseURL = {VITE_API_URL}/api/v1`, `withCredentials` y `withXSRFToken` (autenticación por cookies de Sanctum).

**Interceptor de petición**

- Activa el *loader* global (salvo que la petición pase `hideLoader: true`).
- Añade la cabecera **`X-Game-Token`** con el token guardado en `localStorage`.

**Interceptor de respuesta**

| Estado | Comportamiento |
| --- | --- |
| `429` | Avisa de que se está yendo demasiado rápido. |
| `401` / `419` en rutas de sala (`/sync`, `/leave`, `/join`, `/report-disconnect`, `/broadcasting/auth`) | Solo borra el *game token*. |
| `401` / `419` en otras rutas (salvo login/registro/invitado) | Cierra la sesión local. |

`getCsrfCookie()` solicita `/sanctum/csrf-cookie` y se invoca antes de login, registro y operaciones sensibles.

---

## Tiempo real (WebSockets)

[`src/echo.ts`](src/echo.ts) configura Laravel Echo con el *broadcaster* `reverb`. El autorizador de canales reutiliza la instancia de Axios (`POST /broadcasting/auth`), de modo que la autorización viaja con la cookie de sesión.

| Canal | Hook | Eventos | Qué hace |
| --- | --- | --- | --- |
| `lobby` (público) | `useLobbySockets` | `RoomListUpdated` | Recarga la lista de salas. |
| `room.{id}` (presencia) | `useRoomSockets` (sala de espera) | `RoomStateUpdated`, `GameStarted` | Recarga la sala, detecta expulsiones y navega a `/game/:id` al empezar. |
| `room.{id}` (presencia) | `useGameSockets` (partida) | `RoomStateUpdated` + eventos de presencia | Notificaciones, logros y **resincronización** con `/sync`. |
| `users.{id}` (privado) | `useGameSockets` | `GameFinalized` | Resumen de experiencia al acabar la partida (solo usuarios registrados). |

**Patrón de sincronización:** el evento `RoomStateUpdated` no transporta el estado completo; solo avisa. Al recibirlo, el cliente espera 100 ms (para agrupar ráfagas de eventos) y llama a `POST /rooms/{id}/sync`.

**Presencia y desconexiones:** cuando un jugador sale del canal de presencia (`leaving`), los clientes que siguen conectados avisan al servidor con `POST /rooms/{id}/report-disconnect`. Además, al cerrar la pestaña se envía un `sendBeacon` a `/leave` (`useLeaveOnUnload`). Echo se desconecta en `pagehide` y se reconecta en `pageshow` si la página venía de la caché.

---

## Flujos principales

- **Sesión:** al arrancar, `useSessionGuard` comprueba si hay rastro local de sesión (o un retorno de OAuth con `?login=success`) y valida la sesión con `GET /me`; si falla, limpia el estado.
- **Entrar a una sala:** `GlobalRoomManager` decide qué mostrar según el estado: modal de contraseña, modal de nombre de invitado (si no hay sesión), panel de la sala de espera o banner de partida en curso. `useRoomSession` intenta unirse automáticamente y traduce los `type` de error de la API a páginas de error.
- **Partida:** `useLiveGame` hace `join` (reconexión), `sync` inicial, escucha los sockets y avisa al servidor al salir. Al terminar, limpia el *game token* y el estado.
- **Orientación:** en móviles en vertical, `OrientationWarning` pide girar el dispositivo.

Los detalles de cómo responde el servidor a cada paso están en [`docs/rooms.md`](../docs/rooms.md).

---

## Almacenamiento local

| Clave en `localStorage` | Contenido |
| --- | --- |
| `game_token` | Token de la partida (se envía como `X-Game-Token`). |
| `active_room_id` | Sala actual, para recuperarla tras recargar. |
| `role_reveal_shown:{roomId}` | Evita repetir la animación de revelación de rol. |
| `death_modal_shown:{roomId}` | Evita repetir el modal de eliminación. |
| `userId`, `user`, `avatar`, `isGuest`, `role`, `socialAccounts`, `joinedAt`, `achievements` | Caché de la sesión (se valida siempre con `/me`). |

> `localStorage` es solo una caché de conveniencia: la autenticación real es la cookie de sesión del servidor.

---

## Estilos y diseño

- **Tailwind CSS 4** (plugin `@tailwindcss/vite`) para utilidades y **CSS Modules** (`*.module.css`) para los componentes con diseño complejo (tablero, cartas, modales).
- Tipografía manuscrita **Kalam** (Google Fonts) y estética *bureaucratic-punk*: libreta, papel, sellos y madera. Las páginas principales comparten `NotebookLayout`.
- El tablero está pensado en **horizontal** (*landscape-first*) y las pantallas portátiles tienen ajustes específicos.
- Se ha cuidado la accesibilidad (etiquetas ARIA, `useFocusTrap` en modales, navegación con teclado).

---

## Compilación y despliegue

`bun run build` genera `dist/` con *code-splitting* manual (`vendor-react`, `vendor-echarts`, `vendor-icons` y `vendor`).

En producción, [`docker/Dockerfile.prod`](../docker/Dockerfile.prod) compila el frontend con Bun y lo sirve con **Nginx** ([`docker/nginx.conf`](../docker/nginx.conf)): *fallback* a `index.html` para la SPA, `index.html` sin caché y recursos estáticos con caché inmutable de 6 meses. Las variables `VITE_*` se pasan como `ARG` en el *build*. Ver [`DEPLOYMENT.md`](../DEPLOYMENT.md).

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
