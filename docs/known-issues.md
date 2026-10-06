# Posibles bugs detectados

Lista de comportamientos del código que **parecen incorrectos** y conviene revisar. Se detectaron leyendo el código al redactar la documentación; **ninguno está verificado ejecutando el proyecto**, así que cada punto indica cómo comprobarlo.

**Severidad:** 🔴 alta (rompe una funcionalidad) · 🟠 media (comportamiento incorrecto) · 🟡 baja (cosmético o de bajo impacto).

| # | Sev. | Resumen | Área |
| :-: | :-: | --- | --- |
| 1 | 🔴 | Victoria por abandono mal resuelta (`CheckVictoryJob`) | Partida |
| 2 | 🟠 | Las cartas caóticas nunca entran al mazo | Cartas |
| 3 | 🔴 | El salto automático por tiempo no actúa tras jugar una carta | Turnos |
| 4 | 🟠 | El Jefe no gana si el Secretario sigue vivo | Partida |
| 5 | 🟡 | `return_to` del login social sin validar (open redirect) | Seguridad |
| 6 | 🟡 | `cards_played` se cuenta de más | Estadísticas |
| 7 | 🟡 | `has_potato_launcher` inconsistente entre cliente y servidor | Cartas |
| 8 | 🟡 | La Evasión se puede jugar por `/action` y se consume sin efecto | Cartas |
| 9 | 🟡 | Etiquetas de rango distintas en perfil y fin de partida | UI |
| 10 | 🟡 | 4 logros registrados sin lógica | Logros |

---

## 1. Victoria por abandono mal resuelta 🔴

- **Dónde:** `backend/app/Jobs/CheckVictoryJob.php` → `GameFinalizationService::finalizeVictory`.
- **Problema:** el *job* llama a `finalizeVictory($this->roomId, true)`, pero la firma es `finalizeVictory(string $roomId, string $winnerRole, bool $isDisconnection = false)`. El `true` se interpreta como rol ganador (`"1"`) y `isDisconnection` queda en `false`. No se calcula el ganador real ni se aplica la regla de «ronda ≥ 3» para victorias por abandono.
- **Efecto probable:** al cerrarse una partida por abandono, `winner_role` valdría `"1"`, que no es un valor válido del `enum` de `games.winner_role`, por lo que el guardado de la partida podría fallar.
- **Cómo verificar:** en una sala de depuración con 3 jugadores, avanzar hasta la ronda 3, desconectar a todos menos a un bando y esperar los 12 s de gracia. Revisar `winner_role` en Redis y el log.
- **Solución sugerida:** calcular el rol ganador antes de llamar (reutilizando la lógica de `checkDisconnectionVictory`) y llamar a `finalizeVictory($roomId, $winnerRole, true)`.

## 2. Las cartas caóticas nunca entran al mazo 🟠

- **Dónde:** `backend/app/Services/Game/Engine/DeckService.php`, `maybeInjectChaoticCard`.
- **Problema:** lee `config('game.game.cards.cards')`, una ruta que no existe. La correcta es `game.cards.cards` (el archivo es `config/game/cards.php`). La lista de cartas caóticas queda vacía y no se inyecta ninguna.
- **Cómo verificar:** `php artisan tinker` → `config('game.game.cards.cards')` devuelve `null`; `config('game.cards.cards')` devuelve el catálogo.
- **Solución sugerida:** cambiar la ruta a `config('game.cards.cards', [])`. Después, probar el equilibrio (15 % por mazo construido).

## 3. El salto automático por tiempo no actúa tras jugar una carta 🔴

- **Dónde:** `backend/app/Services/Game/Actions/GameActionService.php` (`playAction`) y `backend/app/Jobs/AutoEndTurnJob.php`.
- **Problema:** tras cada carta jugada se asigna un nuevo `current_turn_id`, pero no se reprograma ningún `AutoEndTurnJob` con ese ID. El *job* original compara el ID y, al no coincidir, no hace nada. Solo se vuelve a programar al reanudar tras una reacción (`resumeTurnTimer`).
- **Efecto probable:** un jugador que juega una carta y luego no hace nada **no pierde el turno por tiempo** (el reloj del cliente llega a 0, pero el servidor no avanza).
- **Cómo verificar:** jugar una carta sin reacción (p. ej. Té), dejar vencer el temporizador y comprobar si el turno avanza.
- **Solución sugerida:** no regenerar `current_turn_id` salvo cuando se pause por una reacción; o, si se regenera, programar un nuevo `AutoEndTurnJob` para el tiempo restante.

## 4. El Jefe no gana si el Secretario sigue vivo 🟠

- **Dónde:** `backend/app/Services/Game/Status/GameFinalizationService.php`, `checkAndFinalizeVictory`.
- **Problema:** la victoria del Jefe exige `boss && !secretary && !intern && !union`. Con Jefe y Secretario vivos y el resto eliminados no se declara victoria, aunque las reglas dicen que el Secretario gana con el Jefe. La rama de abandono (`checkDisconnectionVictory`) sí contempla `hasBoss || hasSecretary`.
- **Cómo verificar:** en sala de depuración (4 jugadores), matar a Sindicalista y Becaria con `set_is_dead` y comprobar que la partida no termina.
- **Solución sugerida:** que gane el bando del Jefe cuando no queden Sindicalistas ni Becaria vivos, sin exigir que el Secretario haya muerto.

## 5. `return_to` del login social sin validar 🟡

- **Dónde:** `backend/app/Http/Controllers/Auth/SocialAuthController.php` (`redirect` y `callback`).
- **Problema:** el valor se guarda tal cual en sesión y se concatena a `FRONTEND_URL` (`{FRONTEND_URL}{return_to}?login=success`). Un valor que no empiece por `/` (p. ej. `@sitio.com` o `.sitio.com`) podría llevar a otro dominio tras el login (open redirect).
- **Cómo verificar:** `/auth/google/redirect?return_to=@example.com` y completar el login.
- **Solución sugerida:** aceptar solo valores que empiecen por `/` y no por `//` ni contengan `\`; si no, usar `/`.

## 6. `cards_played` se cuenta de más 🟡

- **Dónde:** `PlayerHandService::findAndRemoveCard` y `GameActionService::playAction`.
- **Problema:** `findAndRemoveCard` hace `hincrby cards_played` y `playAction` lo vuelve a hacer: cada carta jugada suma 2. Además, esquivar, descartar por sabotaje o sacrificar también suma 1 sin ser «jugar».
- **Cómo verificar:** jugar una carta y leer `room:{id}:player:{pid}:stats` → `cards_played`.
- **Solución sugerida:** retirar el incremento de `findAndRemoveCard` (o del `playAction`) y decidir explícitamente qué acciones cuentan.

## 7. `has_potato_launcher` inconsistente 🟡

- **Dónde:** `CardValidationService::checkPerkLimit` (backend), `useCardPlayability.ts` y `data/game/perks.ts` (frontend).
- **Problema:** el servidor no cuenta `has_potato_launcher` en el límite de 3 pasivas, pero el cliente sí. Además, en `perks.ts` la entrada apunta a `cardType: 14` (Suerte) en vez de `16`, por lo que muestra la información de otra carta. `usePlayerActions.hasEquippedPerks` tampoco la contempla, así que quien solo la lleva no puede abrir el modo descarte.
- **Cómo verificar:** equipar Lanzapatatas más 3 pasivas normales; abrir su info desde la ranura.
- **Solución sugerida:** unificar el criterio (¿ocupa hueco o no?) en ambos lados y corregir `cardType` a 16.

## 8. La Evasión se puede jugar por `/action` 🟡

- **Dónde:** `GameActionService::playAction`.
- **Problema:** los `match` no tienen rama para el `card_id` 3, así que `default => null` no valida ni aplica nada, pero la carta se retira de la mano. Solo el frontend impide jugarla fuera de una reacción. Lo mismo ocurre con cualquier `card_id` sin rama.
- **Cómo verificar:** `POST /rooms/{id}/action` con una Evasión en mano.
- **Solución sugerida:** rama de validación que lance `INVALID_ACTION` para el id 3, y un `default` que lance excepción en lugar de ignorar.

## 9. Etiquetas de rango distintas 🟡

- **Dónde:** `frontend/src/utils/experience.ts` (`getRankLabel`) y `components/game/overlays/game-over/XPSummaryCard.tsx`.
- **Problema:** mismos umbrales (10 y 25), pero nombres distintos: *Principiante / Veterano / Prejubilado* frente a *Becario / Empleado del Mes / CEO Legendario*.
- **Solución sugerida:** que `XPSummaryCard` use `getRankLabel`.

## 10. Logros registrados sin lógica 🟡

- **Dónde:** `AchievementSeeder.php`, `AchievementService.php` y `frontend/src/data/app/achievements.ts`.
- **Problema:** `ach_triple_kill`, `ach_failed_mass_attack`, `ach_play_10` y `ach_play_25` existen en la base de datos y en el frontend (`active: false`), pero ninguna condición los concede.
- **Solución sugerida:** implementarlos con las recetas de [`achievements.md`](achievements.md#8-recetas-según-el-tipo-de-logro) o retirarlos hasta que se hagan.

---

## Otros puntos menores detectados

| Dónde | Observación |
| --- | --- |
| `ReconnectionService::handleReconnection` | Compara `acting_boss_grace_period` con el ID del jugador, pero esa clave guarda un token (`grace_acting_…`). La rama «el jefe interino vuelve a tiempo» nunca se cumple. |
| `LiveGameService::startGame`, `LiveRoomService::kickPlayer` | No comprueban que la sala siga en `waiting`. |
| `StoreRoomRequest::messages` | Los mensajes de `turn_timeout` dicen 30–90 s; la regla real es 60–120 s. |
| `GameFinalizationService::finalize` | Los logros se evalúan antes de guardar la partida (`createGame`); afecta a logros basados en historial. |
| `ExperienceService` / `experience.ts` | La fórmula de niveles está duplicada sin comprobación automática de que coincidan. |

Más contexto sobre cada área en [`rooms.md`](rooms.md#12-puntos-a-revisar), [`cards-system.md`](cards-system.md#12-puntos-a-revisar), [`achievements.md`](achievements.md#11-puntos-a-revisar), [`levels.md`](levels.md#8-puntos-a-revisar) y [`social-auth.md`](social-auth.md#11-consideraciones-de-seguridad-y-limitaciones).
