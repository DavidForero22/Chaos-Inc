# Guía: crear una carta nueva

Guía paso a paso para añadir una carta a Chaos Inc., de principio a fin: configuración, reglas, efecto, base de datos, frontend y pruebas.

> Antes de empezar, conviene leer [`cards-system.md`](cards-system.md) para entender cómo funcionan el catálogo, el mazo y el flujo de «jugar una carta». Esta guía asume ese contexto.

**Archivos que se tocan habitualmente**

| Capa | Archivo | Cuándo |
| --- | --- | --- |
| Backend | `config/game/cards.php` | **Siempre**: define la carta. |
| Backend | `app/Services/Game/Engine/CardValidationService.php` | **Siempre**: reglas de uso. |
| Backend | `app/Services/Game/Actions/CardEffectService.php` | **Siempre**: efecto. |
| Backend | `app/Services/Game/Actions/GameActionService.php` | **Siempre**: enlaza la carta con su validación y su efecto. |
| Backend | `database/seeders/CardSeeder.php` (se ejecuta, no se edita) | **Siempre**: registra la carta en MySQL. |
| Backend | `LiveGameService`, `PlayActionRequest`, `config/game/perks.php`, `MyDataResource`, `GameDataResource` | Si es una **pasiva** nueva. |
| Backend | `GameReactionService`, un *Job* nuevo, recursos | Si requiere una **respuesta** de otro jugador. |
| Frontend | `public/cards/{imagen}` | **Siempre**. |
| Frontend | `data/game/cardNotifications.ts` | **Siempre**. |
| Frontend | `hooks/game/players/useCardPlayability.ts` y `useOpponentTargeting.ts` | Si la carta tiene condiciones de uso. |
| Frontend | `data/game/perks.ts`, `data/game/passiveCards.ts`, `types/live-game.ts`, … | Si es una **pasiva** nueva. |

---

## Índice

1. [Antes de empezar: decide qué tipo de carta es](#1-antes-de-empezar-decide-qué-tipo-de-carta-es)
2. [Paso 1: definir la carta en el catálogo](#2-paso-1-definir-la-carta-en-el-catálogo)
3. [Paso 2: reglas de uso (validación)](#3-paso-2-reglas-de-uso-validación)
4. [Paso 3: efecto](#4-paso-3-efecto)
5. [Paso 4: enlazarla en `GameActionService`](#5-paso-4-enlazarla-en-gameactionservice)
6. [Paso 5: registrarla en la base de datos](#6-paso-5-registrarla-en-la-base-de-datos)
7. [Paso 6: el frontend](#7-paso-6-el-frontend)
8. [Variantes](#8-variantes)
9. [Paso 7: probar](#9-paso-7-probar)
10. [Ejemplo completo: «Café Doble»](#10-ejemplo-completo-café-doble)
11. [Lista de comprobación final](#11-lista-de-comprobación-final)
12. [Errores frecuentes](#12-errores-frecuentes)

---

## 1. Antes de empezar: decide qué tipo de carta es

El trabajo necesario depende del tipo de carta:

| Tipo de carta | Ejemplos actuales | Trabajo extra respecto a la base |
| --- | --- | --- |
| **Efecto inmediato** | Té, Robo, Viernes de Cañas | Ninguno: validación + efecto + frontend. |
| **Con respuesta de otro jugador** | Ataque, Inspección Sorpresa, Sabotaje | Estado pendiente, *job* de resolución y endpoint/acción de reacción ([8.2](#82-carta-con-ventana-de-respuesta)). |
| **Pasiva (equipamiento)** | Escudo, Catalejo, Suerte | Nuevo estado en el hash de pasivas y varios puntos de registro ([8.1](#81-pasiva-nueva)). |
| **Caótica** | Monos Locos, Resurrección | `category = chaotic` y validación del sacrificio ([8.3](#83-carta-caótica)). |

Y antes de tocar código, define sus **reglas** con precisión: ¿a quién afecta? ¿cuándo **no** se puede jugar? ¿qué pasa si el objetivo está muerto, desconectado, sin cartas…? Cada «no se puede» será una comprobación en el servidor **y** otra en el cliente.

---

## 2. Paso 1: definir la carta en el catálogo

Añade una entrada al final del array `cards` de [`config/game/cards.php`](../backend/config/game/cards.php):

```php
// ─── 18. CAFÉ DOBLE ──────────────────────────
[
    'id'           => 18,
    'type'         => 'heal',
    'target'       => 'self',
    'base_name'    => 'Café Doble',
    'display_name' => 'Café Doble',
    'description'  => 'Reduce tu propio estrés en 2 puntos.',
    'lore'         => 'Ya no recuerdas el último día en que dormiste ocho horas.',
    'icons'        => ['self', 'heal'],
    'count'        => 3,
    'image'        => 'double_coffee.png',
    'category'     => 'normal',
],
```

Reglas para rellenarla:

| Campo | Cómo elegirlo |
| --- | --- |
| `id` | El **siguiente entero libre** (hoy, el 18). Es la identidad permanente de la carta: **nunca se renumera ni se reutiliza**, porque queda guardada en `game_card_usage` y `user_discovered_cards` y está escrita en el código. |
| `type` | Uno de `attack`, `heal`, `default`, `perk`. Un valor distinto exige una **migración** (es un `enum` de MySQL) y un nuevo color en `Card.tsx`. |
| `target` | `self`, `opponent`, `opponents`, `all` o `none`. Decide cómo se juega en la interfaz. |
| `icons` | Subconjunto de `self`, `opponent`, `opponents`, `all`, `attack`, `heal`, `dodge`, `block`, `steal`, `discard`, `perk`. Convención: primero el objetivo y luego la acción (`['opponent', 'attack']`). |
| `count` | Copias en el mazo. **Cambia el equilibrio**: el mazo base tiene 94 cartas; añadir 3 copias reduce un poco la probabilidad de todas las demás. Ignorado si es caótica. |
| `image` | Nombre del archivo que añadirás a `frontend/public/cards/` (paso 6). |
| `category` | `normal` o `chaotic`. |

> `base_name`, `type` y `category` son lo que se copia a la tabla `cards`; el resto solo vive en la configuración.

---

## 3. Paso 2: reglas de uso (validación)

En [`CardValidationService`](../backend/app/Services/Game/Engine/CardValidationService.php) añade un método que **lance una `GameException` si la jugada no es legal** y no devuelva nada si lo es. Si la carta reutiliza reglas de otra, puedes llamar directamente al método existente (por ejemplo `validateHeal` para cualquier carta de curación propia) y saltarte este paso.

```php
public function validateDoubleHeal(string $roomId, int $playerId): void
{
    $stress = (int) (Redis::hget("room:{$roomId}:player:{$playerId}:info", 'stress') ?? 0);

    if ($stress <= 0) {
        throw new GameException(
            GameException::INVALID_ACTION,
            "No tienes estrés que curar.",
            422
        );
    }
}
```

Convenciones:

- Usa `GameException` con la constante adecuada (`INVALID_TARGET` para objetivos erróneos, `INVALID_ACTION` para reglas de uso) y un código HTTP `422`.
- **No modifiques estado en la validación.** Solo lee y lanza excepciones.
- `playAction` ya comprueba, antes de llegar aquí: que es tu turno, que no hay un ataque o sabotaje pendiente, que el objetivo está en la sala y que la carta está en tu mano. No lo repitas.
- Comprobaciones habituales según la carta: no a uno mismo, objetivo vivo (`is_dead`), conectado (`is_online`), con cartas, en alcance (`CombatService::getDistance` y `getPlayerRange`), límite de pasivas (`checkPerkLimit`), carta sacrificada (`CardHelper::checkSacrificeCardExists`).

---

## 4. Paso 3: efecto

En [`CardEffectService`](../backend/app/Services/Game/Actions/CardEffectService.php) añade el método que **aplica** el efecto, escribiendo en Redis:

```php
public function applyDoubleHeal(string $roomId, int $playerId): void
{
    $infoKey = "room:{$roomId}:player:{$playerId}:info";

    $healed = min(2, (int) (Redis::hget($infoKey, 'stress') ?? 0));

    if ($healed > 0) {
        Redis::hincrby($infoKey, 'stress', -$healed);
        Redis::hincrby("room:{$roomId}:player:{$playerId}:stats", 'healing_done', $healed);
    }
}
```

Convenciones:

- El efecto se ejecuta **después** de validar y **antes** de retirar la carta de la mano; si lanza una excepción, la carta no se consume.
- **Daño:** nunca modifiques `stress` directamente para dañar; usa `CombatService::applyDamageAndCheck($roomId, $atacante, $objetivo)`, que gestiona el máximo de estrés, la eliminación, las estadísticas y la comprobación de victoria.
- **Estadísticas:** actualiza las que correspondan en `room:{id}:player:{pid}:stats` (`damage_dealt`, `healing_done`, `cards_stolen`, `dodged_or_defended`…). `cards_played`, `passives_played` y el uso por carta ya los registra `playAction`.
- Si **mueves cartas** entre manos, registra el descubrimiento de la carta recibida (ver `applySteal`: añadir a `new_cards` si no está en `known_cards`).
- Los mensajes de registro que ve el jugador los genera el frontend a partir de `card_action` (paso 6). Solo necesitas `lang/es/game.php` si emites tú mismo un `RoomStateUpdated` con un mensaje propio.

---

## 5. Paso 4: enlazarla en `GameActionService`

En [`GameActionService::playAction`](../backend/app/Services/Game/Actions/GameActionService.php) hay **dos bloques `match`** sobre `$cardBaseId`. Añade una rama en cada uno:

```php
// Match de validación
match ($cardBaseId) {
    // …
    17 => $this->cardValidationService->validateChaoticRevive($roomId, $playerId, $targetId, $sacrificeCardId),
    18 => $this->cardValidationService->validateDoubleHeal($roomId, $playerId),   // ← nueva
    default => null,
};

// Match de efecto
match ($cardBaseId) {
    // …
    17 => $this->cardEffectService->applyChaoticRevive($roomId, $targetId),
    18 => $this->cardEffectService->applyDoubleHeal($roomId, $playerId),           // ← nueva
    default => null,
};
```

> **Si te olvidas de una rama, no verás ningún error**: `default => null` ignora el `card_id` desconocido y la carta se consume sin hacer nada. Es el fallo más común (ver [errores frecuentes](#12-errores-frecuentes)).

---

## 6. Paso 5: registrarla en la base de datos

La tabla `cards` debe contener la carta, porque `game_card_usage` y `user_discovered_cards` tienen **claves foráneas** hacia `cards.id`. Si la carta no está en la tabla, **guardar una partida donde se haya usado fallará** (la inserción de `game_card_usage` rompería la transacción y la partida no se registraría).

`CardSeeder` lee el catálogo y hace `updateOrCreate` por `id`, por lo que es **idempotente**:

```bash
# En local
php artisan db:seed --class=CardSeeder

# Con Docker (desarrollo)
docker compose exec backend php artisan db:seed --class=CardSeeder
```

En el despliegue con Docker, el *entrypoint* ejecuta `php artisan migrate --force --seed` en cada arranque del contenedor `backend`, de modo que **un redespliegue ya registra las cartas nuevas**.

Después, **reinicia los procesos de larga duración** para que lean el catálogo nuevo: `backend` (FrankenPHP en modo *worker*), `worker` (cola) y `reverb`. En Docker: `docker compose restart backend worker reverb`.

> Las partidas **ya iniciadas** conservan el mazo que tenían en Redis: la carta nueva solo aparecerá en partidas nuevas.

---

## 7. Paso 6: el frontend

### 7.1 Imagen

Añade el archivo con el nombre indicado en `image` a [`frontend/public/cards/`](../frontend/public/cards/) (PNG, mismo formato y proporción que las existentes). Se sirve como `/cards/{image}` en la mano, en la galería y en los modales de información.

### 7.2 Notificación (obligatorio)

En [`data/game/cardNotifications.ts`](../frontend/src/data/game/cardNotifications.ts) añade la carta al diccionario. **Sin esta entrada, jugar la carta no genera ninguna notificación ni línea en el registro** para el resto de jugadores.

```ts
18: { type: "heal", name: "Café Doble", icon: "heal", scope: "self" },
```

| Campo | Valores |
| --- | --- |
| `type` | `attack` \| `heal` \| `perk` \| `default`: elige la plantilla de mensaje en `useGameEventParser`. |
| `name` | Nombre que aparece en el mensaje. |
| `icon` | Icono de la notificación (`attack`, `heal`, `dodge`, `block`, `steal`, `discard`, `perk`, `all`…). |
| `scope` | `single` \| `all` \| `opponents` \| `self`: ajusta la redacción. |

Si ninguna plantilla de `useGameEventParser` encaja con tu carta, añade un caso específico (como el de Resurrección, `cardId === 17`).

### 7.3 Cuándo se puede jugar

En [`useCardPlayability.ts`](../frontend/src/hooks/game/players/useCardPlayability.ts) añade la condición que deshabilita la carta. Es el **reflejo en cliente** de tu validación del servidor:

```ts
const isDoubleHealDisabled = card.card_id === 18 && me.stress <= 0;

const isCardSpecificDisabled =
    isHealDisabled ||
    // …
    isDoubleHealDisabled;   // ← añadirla a la lista
```

> Si no la añades, la carta aparecerá jugable y el servidor la rechazará con un `422` (que el cliente muestra como alerta). Funciona, pero es una mala experiencia.

Para cartas con **objetivo** (`target: 'opponent'`) con reglas especiales sobre *quién* puede ser objetivo, replica también la condición en [`useOpponentTargeting.ts`](../frontend/src/hooks/game/players/useOpponentTargeting.ts) y en el filtro de [`OpponentsBoard.tsx`](../frontend/src/components/game/board/OpponentsBoard.tsx).

### 7.4 Lo que ya funciona solo

Con lo anterior, no hace falta tocar nada más para que:

- La carta se **dibuje** (`Card.tsx` usa `type`, `category`, `icons` e `image` de la propia instancia).
- Se **juegue**: `target` decide si es botón «usar» (`self`, `all`, `opponents`, `none`) o selección de rival (`opponent`).
- Aparezca en la **galería** (bloqueada hasta que se descubra) y en el **catálogo** `GET /cards`, que usa la herramienta de depuración.
- Entre en las **estadísticas y gráficas** de cartas más usadas.

---

## 8. Variantes

### 8.1 Pasiva nueva

Una pasiva guarda su estado en el hash `room:{id}:player:{pid}:perks`. Ejemplo: una pasiva `has_headphones` (clave nueva). Hay que registrar la clave en estos puntos:

**Backend**

1. [`LiveGameService::assignRolesAndCards`](../backend/app/Services/Game/LiveGameService.php): inicializar la clave a 0 en el hash `perks` al crear al jugador.
2. [`config/game/perks.php`](../backend/config/game/perks.php): añadirla a `allowed_keys` (`'has_headphones' => 'Auriculares'`). Esto permite descartarla voluntariamente.
3. [`PlayActionRequest`](../backend/app/Http/Requests/Game/PlayActionRequest.php): añadirla a la regla `in:` de `perk_key`. Esto permite que *Recorte* la elija como objetivo.
4. [`MyDataResource`](../backend/app/Http/Resources/MyDataResource.php) y [`GameDataResource`](../backend/app/Http/Resources/GameDataResource.php): exponerla en el bloque `perks` (propio y de oponentes), con `CastHelper::toBool`.
5. [`CardValidationService::checkPerkLimit`](../backend/app/Services/Game/Engine/CardValidationService.php): sumarla al recuento de huecos y llamar a `checkPerkLimit` desde la validación de la carta. Además, impedir equiparla si ya se tiene.
6. Y, por supuesto, **donde tenga efecto**: el código que lee `has_headphones` (por ejemplo, en `validateSabotage`) y el efecto de la carta, que hace `hset … has_headphones 1`.

**Frontend**

1. [`types/live-game.ts`](../frontend/src/types/live-game.ts): añadir `has_headphones: boolean` a `PlayerPerks`.
2. [`data/game/perks.ts`](../frontend/src/data/game/perks.ts): entrada en `PERKS_DICTIONARY` (icono, título, `cardType` = **id de la carta**, nombre y *lore*).
3. [`data/game/passiveCards.ts`](../frontend/src/data/game/passiveCards.ts): añadir el ID a `PASSIVE_CARD_IDS`.
4. [`useCardPlayability.ts`](../frontend/src/hooks/game/players/useCardPlayability.ts): sumarla a `myActivePerksCount`, a `anyOpponentHasPerks` (para *Recorte*) y deshabilitar la carta si ya está equipada.
5. [`usePlayerActions.ts`](../frontend/src/hooks/game/players/usePlayerActions.ts): sumarla a `hasEquippedPerks` para poder abrir el modo descarte.

> Hoy hay pequeñas incoherencias entre cliente y servidor con `has_potato_launcher` (ver los puntos a revisar de [`cards-system.md`](cards-system.md#12-puntos-a-revisar)). Cuídalo en tu pasiva.

### 8.2 Carta con ventana de respuesta

Si otro jugador debe poder responder (como con el *Sabotaje* o un ataque), sigue el patrón existente:

1. En el **efecto**, guarda un estado pendiente en Redis (`room:{id}:pending_…`) con un **token único** (`uniqid`) y programa un *job* de resolución con retardo de **18 s**: `ResolveXxxJob::dispatch(...)->delay(18)`.
2. Crea el **job** (`app/Jobs/`): al ejecutarse, debe comprobar que el estado pendiente **sigue existiendo y que el token coincide**; si no, se ignora (la respuesta llegó a tiempo). Si coincide, aplica la consecuencia por defecto.
3. Crea la **acción de respuesta** (método en `GameReactionService`, método en `LiveGameController` y ruta en `routes/api.php`) que valida que quien responde es el afectado, aplica el resultado, borra el estado pendiente y llama a `TurnService::resumeTurnTimer`.
4. `playAction` ya **pausa el reloj del turno** si existe `pending_attack`, `pending_sabotage` o `pending_multi_attack`. Si tu estado pendiente es otro, añádelo a esa comprobación (`$needsReaction`) y también a las de «hay algo pendiente» al jugar y terminar turno.
5. Expón el estado pendiente en [`GameDataResource`](../backend/app/Http/Resources/GameDataResource.php) / [`MyDataResource`](../backend/app/Http/Resources/MyDataResource.php) y consúmelo en el frontend (modal de reacción, `useGameTimers`, `useCardPlayability`).

Las ventanas de respuesta y sus tiempos se describen en [`rooms.md`](rooms.md#64-reacciones).

### 8.3 Carta caótica

1. `'category' => 'chaotic'` en el catálogo. Su `count` se ignora y no entra al mazo base: la fuente de cartas caóticas es `config/game/chaotic.php` (ver [`cards-system.md`](cards-system.md#9-cartas-caóticas)).
2. En su método de validación, empieza por `CardHelper::checkSacrificeCardExists($roomId, $playerId, $sacrificeCardId)`.
3. En el frontend funciona sola: `Card.tsx` la pinta en magenta y `PlayerHand` activa el modo sacrificio.

---

## 9. Paso 7: probar

Las **salas de depuración** (`is_debug`, solo administradores) permiten probar sin esperar a que la carta salga en el mazo:

1. Como administrador, crea una sala marcando la opción de depuración e inicia la partida con 3 jugadores (puedes usar varios navegadores o ventanas de incógnito con invitados).
2. Abre las herramientas de depuración del tablero: el selector de cartas se alimenta de `GET /api/v1/cards`, así que **tu carta nueva aparece automáticamente** y puedes añadirla a la mano de cualquier jugador (`player_modifications.add_cards` en `POST /rooms/{id}/debug`).
3. También puedes fijar el estrés de un jugador, matarlo o forzar una victoria para probar casos límite (objetivo muerto, estrés 0…).
4. En las salas de depuración, `RoomLogger` escribe en el log de Laravel (`storage/logs`) lo que ocurre durante la partida.

**Qué probar siempre**

| Prueba | Qué comprobar |
| --- | --- |
| Caso normal | Se juega, hace lo que dice, se retira de la mano y se notifica a todos. |
| Cada regla de validación | El servidor la rechaza con `422` **y** el cliente deshabilita la carta. |
| Fuera de turno | `403 NOT_YOUR_TURN`. |
| Objetivos límite | Muerto, desconectado, sin cartas, uno mismo. |
| Con Escudo / Evasión | Si afecta a ataques, interacción con las defensas. |
| Desconexión durante el efecto | Si hay estado pendiente, que el *job* lo resuelva. |
| Fin de partida | Que se guarde (`game_card_usage` incluye la carta) y aparezca como descubierta en la galería. |
| Galería | Aparece como `???` hasta descubrirla. |

---

## 10. Ejemplo completo: «Café Doble»

> Carta **ilustrativa**: no existe en el repositorio. Resume los cambios del ejemplo; el código de cada paso está en las secciones anteriores.

**Objetivo:** una carta de curación de efecto inmediato que reduce 2 puntos el estrés propio.

| # | Archivo | Cambio |
| :-: | --- | --- |
| 1 | `config/game/cards.php` | Entrada `id => 18`, `type => heal`, `target => self`, `count => 3`. |
| 2 | `CardValidationService` | `validateDoubleHeal` (o reutilizar `validateHeal`). |
| 3 | `CardEffectService` | `applyDoubleHeal`: −2 estrés (máximo lo que tenga) y `healing_done`. |
| 4 | `GameActionService` | `18 => …validateDoubleHeal(…)` y `18 => …applyDoubleHeal(…)` en los dos `match`. |
| 5 | Base de datos | `php artisan db:seed --class=CardSeeder` y reiniciar `backend`, `worker`, `reverb`. |
| 6 | `public/cards/double_coffee.png` | Imagen. |
| 7 | `cardNotifications.ts` | `18: { type: "heal", name: "Café Doble", icon: "heal", scope: "self" }`. |
| 8 | `useCardPlayability.ts` | Deshabilitada si `me.stress <= 0`. |

**Y una variante pasiva**, «Auriculares» (`has_headphones`, *«Inmune al Sabotaje»*), añadiría además los registros de la sección [8.1](#81-pasiva-nueva) y una comprobación en `validateSabotage` que rechace sabotear a quien tenga la pasiva.

---

## 11. Lista de comprobación final

**Backend**

- [ ] Entrada en `config/game/cards.php` con un `id` nuevo y único.
- [ ] Método de validación (o reutilizado) y rama en el primer `match`.
- [ ] Método de efecto y rama en el segundo `match`.
- [ ] `CardSeeder` ejecutado y `backend`/`worker`/`reverb` reiniciados.
- [ ] Si es pasiva: clave inicializada, en `perks.php`, en `PlayActionRequest`, en los dos *Resources* y en `checkPerkLimit`.
- [ ] Si tiene respuesta: estado pendiente con token, *job*, acción de reacción y pausa del turno.

**Frontend**

- [ ] Imagen en `public/cards/`.
- [ ] Entrada en `cardNotifications.ts`.
- [ ] Condiciones de uso en `useCardPlayability.ts` (y de objetivo, si procede).
- [ ] Si es pasiva: tipos, `perks.ts`, `passiveCards.ts` y recuentos de pasivas.
- [ ] Si usa un icono nuevo: `CardIconType`, `ICON_MAP` de `Card.tsx` y `iconGuide.ts`.

**Pruebas**

- [ ] Probada en una sala de depuración, con casos límite.
- [ ] La partida se guarda y la carta aparece descubierta en la galería.

---

## 12. Errores frecuentes

| Síntoma | Causa probable |
| --- | --- |
| La carta se usa, desaparece de la mano y **no hace nada**. | Falta la rama en uno de los dos `match` de `GameActionService`. |
| Al terminar la partida **no se guarda** y aparece un error de clave foránea. | No se ejecutó `CardSeeder`; la carta no existe en la tabla `cards`. |
| La carta nueva **no sale** en las partidas. | No se reiniciaron los procesos, o la partida ya tenía el mazo creado. Recuerda que el `count` puede dar baja probabilidad. |
| Se juega pero **nadie ve notificación** ni registro. | Falta la entrada en `cardNotifications.ts`. |
| La imagen sale rota. | El nombre de `image` no coincide con el archivo de `public/cards/`. |
| La carta aparece jugable pero el servidor responde `422`. | Falta replicar la regla en `useCardPlayability.ts`. |
| La carta caótica no aparece nunca en el mazo. | Es la inyección de `DeckService` (ver puntos a revisar de [`cards-system.md`](cards-system.md#12-puntos-a-revisar)); en pruebas, añádela con la herramienta de depuración. |
| *Recorte* no puede elegir mi pasiva nueva. | Falta la clave en la regla `in:` de `PlayActionRequest` o en `anyOpponentHasPerks` del cliente. |
| Falla el `type` al ejecutar migraciones/seeders. | Se usó un `type` que no está en el `enum` de `cards`: requiere una migración nueva. |
