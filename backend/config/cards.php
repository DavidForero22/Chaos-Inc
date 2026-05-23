<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Definición de Cartas (Chaos Inc.)
    |--------------------------------------------------------------------------
    |
    |
    */

    'cards' => [
        // ─── 1. ATACAR  ───────────────────────────────
        [
            'id'           => 1,
            'type'         => 'attack',
            'target'       => 'opponent',
            'base_name'    => 'Atacar',
            'display_name' => 'Ataque',
            'description'  => 'Inflige 1 punto de estrés a un oponente vivo dentro de tu rango de visión.',
            'lore'         => 'Al contable le cayó una grapadora en la cabeza.',
            'icons'        => ['opponent', 'attack'],
            'count'        => 28,
            'image'        => 'attack.png',
            'category'     => 'normal',
        ],

        // ─── 2. CURAR  ────────────────────────────────
        [
            'id'           => 2,
            'type'         => 'heal',
            'target'       => 'self',
            'base_name'    => 'Curar',
            'display_name' => 'Té',
            'description'  => 'Reduce tu propio estrés en 1 punto.',
            'lore'         => 'Tomas una taza de té y te lo bebes tranquilamente entre todo el caós de la oficina. Te sientes tan británico que podrias robar artefactos egipcios.',
            'icons'        => ['self', 'heal'],
            'count'        => 7,
            'image'        => 'heal.png',
            'category'     => 'normal',
        ],

        // ─── 3. ESQUIVAR  ─────────────────────────────
        [
            'id'           => 3,
            'type'         => 'default',
            'target'       => 'self',
            'base_name'    => 'Esquivar',
            'display_name' => 'Evasión',
            'description'  => 'Evita un ataque contra ti.',
            'lore'         => 'Si lo piensas bien, los impuestos son un ataque contra tu persona.',
            'icons'        => ['self', 'dodge'],
            'count'        => 11,
            'image'        => 'dodge.png',
            'category'     => 'normal',
        ],

        // ─── 4. ROBAR  ──────────────────────────────
        [
            'id'           => 4,
            'type'         => 'default',
            'target'       => 'opponent',
            'base_name'    => 'Robar',
            'display_name' => 'Robo',
            'description'  => 'Roba una carta aleatoria de la mano de un oponente.',
            'lore'         => 'Pensaba que el nombre del tupper era el nombre del plato...',
            'icons'        => ['opponent', 'steal'],
            'count'        => 5,
            'image'        => 'steal.png',
            'category'     => 'normal',
        ],

        // ─── 5. ESCUDO  ────────────────────────────────
        [
            'id'           => 5,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Escudo',
            'display_name' => 'Escudo',
            'description'  => 'Bloquea el siguiente ataque que recibas.',
            'lore'         => '"¡Escudo para siempre, me rebota todo!"',
            'icons'        => ['self', 'perk'],
            'count'        => 4,
            'image'        => 'shield.png',
            'category'     => 'normal',
        ],

        // ─── 6. BLOQUEO  ────────────────────────────
        [
            'id'           => 6,
            'type'         => 'default',
            'target'       => 'opponent',
            'base_name'    => 'Bloqueo',
            'display_name' => 'Laxante',
            'description'  => 'Bloquea el siguiente turno de un rival. El jugador afectado tiene un 25% de probabilidad de evadir el bloqueo en su turno.',
            'lore'         => '¡Codigo marrón, codigo marrón!',
            'icons'        => ['opponent', 'block'],
            'count'        => 4,
            'image'        => 'block.png',
            'category'     => 'normal',
        ],

        // ─── 7. ATAQUE MASIVO  ──────────────────────
        [
            'id'           => 7,
            'type'         => 'attack',
            'target'       => 'opponents',
            'base_name'    => 'Ataque Masivo',
            'display_name' => 'Inspección Sorpresa',
            'description'  => 'Ataca a todos los oponentes vivos a la vez.',
            'lore'         => 'Una presencia terrorifica ha entrado en la sala...',
            'icons'        => ['opponents', 'attack'],
            'count'        => 6,
            'image'        => 'multi_attack.png',
            'category'     => 'normal',
        ],

        // ─── 8. CURACIÓN MASIVA  ────────────────────
        [
            'id'           => 8,
            'type'         => 'heal',
            'target'       => 'all',
            'base_name'    => 'Curación Masiva',
            'display_name' => 'Viernes de Cañas',
            'description'  => 'Cura a todos los jugadores vivos 1 punto de estrés, tú incluido.',
            'lore'         => 'Sin tele y sin cerveza, todos pierden la cabeza.',
            'icons'        => ['all', 'heal'],
            'count'        => 3,
            'image'        => 'multi_heal.png',
            'category'     => 'normal',
        ],

        // ─── 9. SABOTAJE  ────────────────────
        [
            'id'           => 9,
            'type'         => 'default',
            'target'       => 'opponent',
            'base_name'    => 'Sabotaje',
            'display_name' => 'Sabotaje',
            'description'  => 'Obliga a un rival a descartar una carta de su mano.',
            'lore'         => '"¡Es que no quedaba más papel higiénico!"',
            'icons'        => ['opponent', 'discard'],
            'count'        => 6,
            'image'        => 'discard.png',
            'category'     => 'normal',
        ],

        // ─── 10. VISIÓN  ───────────────────────────────
        [
            'id'           => 10,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Visión',
            'display_name' => 'Catalejo',
            'description'  => 'Te da +1 punto de rango de visión.',
            'lore'         => 'Ahh, por eso les llaman piratas informáticos...',
            'icons'        => ['self', 'perk'],
            'count'        => 3,
            'image'        => 'vision.png',
            'category'     => 'normal',
        ],

        // ─── 11. LEJANÍA  ──────────────────────────────
        [
            'id'           => 11,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Lejanía',
            'display_name' => 'Teletrabajo',
            'description'  => 'Los jugadores te ven a +1 de distancia.',
            'lore'         => 'Llevas 3 horas jugando y el único "trabajo" que has hecho es avisar por el chat de la empresa que estás en linea.',
            'icons'        => ['self', 'perk'],
            'count'        => 3,
            'image'        => 'distance.png',
            'category'     => 'normal',
        ],

        // ─── 12. RECORTE  ──────────────────────────
        [
            'id'           => 12,
            'type'         => 'default',
            'target'       => 'opponent',
            'base_name'    => 'Recorte',
            'display_name' => 'Recorte',
            'description'  => 'Descarta una pasiva a elegir de cualquier oponente.',
            'lore'         => 'Te han recortado hasta la ropa... Esto si que es un corte de manga.',
            'icons'        => ['opponent', 'discard'],
            'count'        => 8,
            'image'        => 'clean.png',
            'category'     => 'normal',
        ],

        // ─── 13. ALMACÉN  ──────────────────────────────
        [
            'id'           => 13,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Almacén',
            'display_name' => 'Riñonera',
            'description'  => 'Aumenta tu límite máximo de cartas en la mano en 1.',
            'lore'         => '"¡Mirad que pedazo riñonera me he traido! Son las bragas de mi mujer."',
            'icons'        => ['self', 'perk'],
            'count'        => 3,
            'image'        => 'storage.png',
            'category'     => 'normal',
        ],

        // ─── 14. SUERTE  ───────────────────────────────
        [
            'id'           => 14,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Suerte',
            'display_name' => 'Suerte',
            'description'  => 'Al inicio de tu turno, tienes un 50% de probabilidad de tomar una carta extra.',
            'lore'         => 'Es la 10º rifa de la oficina que has ganado este año.',
            'icons'        => ['self', 'perk'],
            'count'        => 3,
            'image'        => 'luck.png',
            'category'     => 'normal',
        ],

        // ─── 15. CAOS ACCIONARIO (Caótica) ──────────────────
        [
            'id'               => 15,
            'type'             => 'action',
            'target'           => 'self',
            'base_name'        => 'Caos Accionario',
            'display_name'     => 'Caos Accionario',
            'description'      => 'Roba una carta por cada jugador vivo. Debes descartar 1 carta de tu mano para activar este efecto.',
            'lore'             => 'El mercado se desploma y la desesperación se apodera de la sala...',
            'icons'            => ['opponents', 'discard'],
            'count'            => 1,
            'image'            => 'chaotic_action.png',
            'category'         => 'chaotic',
        ],
        // ─── 16. CAOS PASIVO (Caótica) ──────────────────────
        [
            'id'               => 16,
            'type'             => 'perk',
            'target'           => 'self',
            'base_name'        => 'Caos Pasivo',
            'display_name'     => 'Caos Pasivo',
            'description'      => 'Permite realizar ataques básicos ilimitados en este turno (solo a distancia 1). Debes descartar 1 carta de tu mano para activarlo.',
            'lore'             => 'La burocracia se vuelve loca... hoy puedes despedir a todo el mundo.',
            'icons'            => ['self', 'perk'],
            'count'            => 1,
            'image'            => 'chaotic_passive.png',
            'category'         => 'chaotic',
        ],
        // ─── 17. RECONTRATACIÓN DE EMERGENCIA ─────
        [
            'id'               => 17,
            'type'             => 'action',
            'target'           => 'opponent',
            'base_name'        => 'Re-contratación',
            'display_name'     => 'Re-contratación',
            'description'      => 'Revive a un jugador eliminado con 2 puntos de vida. No gasta tu turno. Debes descartar 1 carta de tu mano.',
            'lore'             => 'Te despidieron, pero al día siguiente te llaman para un puesto mejor...',
            'icons'            => ['opponent'],
            'count'            => 1,
            'image'            => 'chaotic_revive.png',
            'category'         => 'chaotic',
        ],
    ],

    'chaotic' => [
        'enabled'          => true,
        'chance_per_cycle' => 15,
        'min_position'     => 40,
    ],
];
