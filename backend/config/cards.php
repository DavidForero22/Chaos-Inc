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
            'display_name' => 'Empujón Pasivo-Agresivo',
            'description'  => 'Inflige 1 punto de estrés a un oponente vivo dentro de tu rango de visión.',
            'lore'         => 'En toda oficina hay tensión acumulada. A veces, un empujón bien dado puede ser la gota que colme el vaso de tu rival.',
            'icons'        => ['opponent', 'attack'],
            'count'        => 22,
        ],

        // ─── 2. CURAR  ────────────────────────────────
        [
            'id'           => 2,
            'type'         => 'heal',
            'target'       => 'self',
            'base_name'    => 'Curar',
            'display_name' => 'Pausa para el Café',
            'description'  => 'Reduce tu propio estrés en 1 punto.',
            'lore'         => 'Respira hondo, tómate un café y recuerda que esto es solo un trabajo. El estrés baja cuando te lo propones.',
            'icons'        => ['self', 'heal'],
            'count'        => 10,
        ],

        // ─── 3. ESQUIVAR  ─────────────────────────────
        [
            'id'           => 3,
            'type'         => 'default',
            'target'       => 'self',
            'base_name'    => 'Esquivar',
            'display_name' => 'Escaqueo Maestro',
            'description'  => 'Evita un ataque contra ti.',
            'lore'         => 'Llevas años esquivando reuniones innecesarias. Esquivar un ataque directo no es tan diferente.',
            'icons'        => ['self', 'dodge'],
            'count'        => 16,
        ],

        // ─── 4. ROBAR  ──────────────────────────────
        [
            'id'           => 4,
            'type'         => 'default',
            'target'       => 'opponent',
            'base_name'    => 'Robar',
            'display_name' => 'Espionaje Corporativo',
            'description'  => 'Roba una carta aleatoria de la mano de un oponente.',
            'lore'         => 'La información es poder. Y las cartas de los demás, también. Una ojeada a su monitor nunca viene mal.',
            'icons'        => ['opponent', 'steal'],
            'count'        => 5,
        ],

        // ─── 5. ESCUDO  ────────────────────────────────
        [
            'id'           => 5,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Escudo',
            'display_name' => 'Filtro Anti-Spam',
            'description'  => 'Bloquea el siguiente ataque que recibas.',
            'lore'         => 'Pusiste un escudo en tu perfil de LinkedIn. Ahora tienes uno de verdad que rebota mágicamente los marrones ajenos.',
            'icons'        => ['self', 'perk'],
            'count'        => 4,
        ],

        // ─── 6. BLOQUEO  ────────────────────────────
        [
            'id'           => 6,
            'type'         => 'default',
            'target'       => 'opponent',
            'base_name'    => 'Bloqueo',
            'display_name' => 'Auditoría Sorpresa',
            'description'  => 'Bloquea el siguiente turno de un rival. El jugador afectado tiene un 25% de probabilidad de evadir el bloqueo en su turno.',
            'lore'         => 'Una auditoría inesperada puede paralizar a cualquiera. Tu rival tendrá que perder todo su tiempo buscando facturas perdidas.',
            'icons'        => ['opponent', 'block'],
            'count'        => 4,
        ],

        // ─── 7. ATAQUE MASIVO  ──────────────────────
        [
            'id'           => 7,
            'type'         => 'attack',
            'target'       => 'all',
            'base_name'    => 'Ataque Masivo',
            'display_name' => 'Reunión General',
            'description'  => 'Ataca a todos los oponentes vivos a la vez.',
            'lore'         => 'Todos a la sala de reuniones. Nadie sale hasta que esto termine y todos pierden la paciencia por igual.',
            'icons'        => ['all', 'attack'],
            'count'        => 4,
        ],

        // ─── 8. CURACIÓN MASIVA  ────────────────────
        [
            'id'           => 8,
            'type'         => 'heal',
            'target'       => 'all',
            'base_name'    => 'Curación Masiva',
            'display_name' => 'Viernes de Pizza',
            'description'  => 'Cura a todos los jugadores vivos 1 punto de estrés, tú incluido.',
            'lore'         => 'La empresa invita. Las porciones son pequeñas y están frías, pero milagrosamente todos se sienten un poco mejor.',
            'icons'        => ['all', 'heal'],
            'count'        => 3,
        ],

        // ─── 9. SABOTAJE  ────────────────────
        [
            'id'           => 9,
            'type'         => 'default',
            'target'       => 'opponent',
            'base_name'    => 'Sabotaje',
            'display_name' => 'Desorganización Estratégica',
            'description'  => 'Obliga a un rival a descartar una carta de su mano.',
            'lore'         => 'Has movido algunos archivos de sitio. Tu rival no encontrará lo que busca cuando más lo necesite.',
            'icons'        => ['opponent', 'discard'],
            'count'        => 6,
        ],

        // ─── 10. VISIÓN  ───────────────────────────────
        [
            'id'           => 10,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Visión',
            'display_name' => 'Gafas de Empresa',
            'description'  => 'Te da +1 punto de rango de visión.',
            'lore'         => 'Te han graduado la vista en la mutua y ahora ves más lejos en el tablero. Nadie escapa a tu mirada fiscalizadora.',
            'icons'        => ['self', 'perk'],
            'count'        => 4,
        ],

        // ─── 11. LEJANÍA  ──────────────────────────────
        [
            'id'           => 11,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Lejanía',
            'display_name' => 'Teletrabajo Aprobado',
            'description'  => 'Los jugadores te ven a +1 de distancia.',
            'lore'         => 'Has conseguido firmar el anexo de trabajo remoto. A tus rivales les costará mucho más alcanzarte a través de la pantalla.',
            'icons'        => ['self', 'perk'],
            'count'        => 3,
        ],

        // ─── 12. LIMPIEZA  ──────────────────────────
        [
            'id'           => 12,
            'type'         => 'default',
            'target'       => 'opponent',
            'base_name'    => 'Limpieza',
            'display_name' => 'Política de Mesa Limpia',
            'description'  => 'Descarta una pasiva a elegir de cualquier oponente.',
            'lore'         => 'Recursos Humanos ha implementado la estricta política de "mesas despejadas". Despídete de ese bonito equipamiento personal.',
            'icons'        => ['opponent', 'discard'],
            'count'        => 6,
        ],

        // ─── 13. ALMACÉN  ──────────────────────────────
        [
            'id'           => 13,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Almacén',
            'display_name' => 'Archivador Extra',
            'description'  => 'Aumenta tu límite máximo de cartas en la mano en 1.',
            'lore'         => 'Has conseguido requisar un archivador de tres cajones que nadie usaba. Tienes mucho más espacio para guardar tus "herramientas".',
            'icons'        => ['self', 'perk'],
            'count'        => 4,
        ],

        // ─── 14. SUERTE  ───────────────────────────────
        [
            'id'           => 14,
            'type'         => 'perk',
            'target'       => 'self',
            'base_name'    => 'Suerte',
            'display_name' => 'El Favorito de RRHH',
            'description'  => 'Al inicio de tu turno, tienes un 50% de probabilidad de tomar una carta extra.',
            'lore'         => 'Hoy es tu día de suerte en la empresa. El jefe no ha mirado tu pantalla y la máquina de café te ha devuelto cambio de más.',
            'icons'        => ['self', 'perk'],
            'count'        => 3,
        ],
    ],
];
