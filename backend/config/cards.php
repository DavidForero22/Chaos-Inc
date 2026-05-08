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
            'lore'         => 'Al contable le cayó una grapadora mientras caminaba por el pasillo.',
            'icons'        => ['opponent', 'attack'],
            'count'        => 28,
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
        ],

        // ─── 11. LEJANÍA  ──────────────────────────────
        [
            'id'           => 11,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Lejanía',
            'display_name' => 'Teletrabajo',
            'description'  => 'Los jugadores te ven a +1 de distancia.',
            'lore'         => '"Una partida más al LoL y vuelta al curro, esta vez sí."',
            'icons'        => ['self', 'perk'],
            'count'        => 3,
        ],

        // ─── 12. LIMPIEZA  ──────────────────────────
        [
            'id'           => 12,
            'type'         => 'default',
            'target'       => 'opponent',
            'base_name'    => 'Limpieza',
            'display_name' => 'Recorte',
            'description'  => 'Descarta una pasiva a elegir de cualquier oponente.',
            'lore'         => 'Te han recortado hasta la ropa... Esto si que es un corte de manga.',
            'icons'        => ['opponent', 'discard'],
            'count'        => 8,
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
        ],

        // ─── 14. SUERTE  ───────────────────────────────
        [
            'id'           => 14,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Suerte',
            'display_name' => 'Buenaventura Gitana',
            'description'  => 'Al inicio de tu turno, tienes un 50% de probabilidad de tomar una carta extra.',
            'lore'         => 'Les has devuelto los dos gallos y te han regalado una estampita de la Virgen de la Capilla.',
            'icons'        => ['self', 'perk'],
            'count'        => 3,
        ],
    ],
];
