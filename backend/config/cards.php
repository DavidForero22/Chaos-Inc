<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Definición de Cartas (Chaos Inc.)
    |--------------------------------------------------------------------------
    |
    | Cartas agrupadas por número de variantes:
    |   - 1 variante:  11 cartas  →  11 variantes totales
    |   - 2 variantes: 3 cartas  → 6 variantes totales
    |
    */

    'cards' => [
        // ─── 1. ATACAR (Básica - 2 Variantes) ───────────────────────────────
        [
            'id'                   => 1,
            'type'                 => 'attack',
            'target'               => 'opponent',
            'base_name'            => 'Atacar',
            'description'          => 'Inflige 1 punto de estrés a un oponente vivo dentro de tu rango de visión.',
            'icons'                => ['opponent', 'attack'],
            'count'                => 22,
            'variants'             => [
                [
                    'name'  => 'Empujón Pasivo-Agresivo',
                    # 'image' => 'attack_1.webp',
                    'lore'  => 'En toda oficina hay tensión acumulada. A veces, un empujón bien dado puede ser la gota que colme el vaso de tu rival.',
                ],
                [
                    'name'  => 'Café Derramado',
                    # 'image' => 'attack_2.webp',
                    'lore'  => 'Un "accidente" fortuito sobre el teclado de tu compañero. Las manchas no salen, y su enfado tampoco.',
                ]
            ]
        ],

        // ─── 2. CURAR (Básica - 2 Variantes) ────────────────────────────────
        [
            'id'                   => 2,
            'type'                 => 'heal',
            'target'               => 'self',
            'base_name'            => 'Curar',
            'description'          => 'Reduce tu propio estrés en 1 punto.',
            'icons'                => ['self', 'heal'],
            'count'                => 10,
            'variants'             => [
                [
                    'name'  => 'Pausa para el Café',
                    # 'image' => 'heal_1.webp',
                    'lore'  => 'Respira hondo, tómate un café y recuerda que esto es solo un trabajo. El estrés baja cuando te lo propones.',
                ],
                [
                    'name'  => 'Charla en el Pasillo',
                    # 'image' => 'heal_2.webp',
                    'lore'  => 'Cinco minutos criticando a la gerencia en la máquina de agua hacen maravillas por la salud mental.',
                ]
            ]
        ],

        // ─── 3. ESQUIVAR (Básica - 2 Variantes) ─────────────────────────────
        [
            'id'                   => 3,
            'type'                 => 'default',
            'target'               => 'self',
            'base_name'            => 'Esquivar',
            'description'          => 'Evita un ataque contra ti.',
            'icons'                => ['self', 'dodge'],
            'count'                => 16,
            'variants'             => [
                [
                    'name'  => 'Escaqueo Maestro',
                    # 'image' => 'dodge_1.webp',
                    'lore'  => 'Llevas años esquivando reuniones innecesarias. Esquivar un ataque directo no es tan diferente.',
                ],
                [
                    'name'  => 'Derivar al Becario',
                    # 'image' => 'dodge_2.webp',
                    'lore'  => 'Ese marrón no es de tu departamento. Con un rápido reenvío de correo, el problema desaparece de tu mesa.',
                ]
            ]
        ],

        // ─── 4. ROBAR (Compleja - 1 Variante) ──────────────────────────────
        [
            'id'                   => 4,
            'type'                 => 'default',
            'target'               => 'opponent',
            'base_name'            => 'Robar',
            'description'          => 'Roba una carta aleatoria de la mano de un oponente.',
            'icons'                => ['opponent', 'steal'],
            'count'                => 5,
            'variants'             => [
                [
                    'name'  => 'Espionaje Corporativo',
                    # 'image' => 'steal_1.webp',
                    'lore'  => 'La información es poder. Y las cartas de los demás, también. Una ojeada a su monitor nunca viene mal.',
                ]
            ]
        ],

        // ─── 5. ESCUDO (Pasiva - 1 Variante) ────────────────────────────────
        [
            'id'                   => 5,
            'type'                 => 'perk',
            'target'               => 'self',
            'base_name'            => 'Escudo',
            'description'          => 'Bloquea el siguiente ataque que recibas.',
            'icons'                => ['self', 'perk'],
            'count'                => 4,
            'variants'             => [
                [
                    'name'  => 'Filtro Anti-Spam',
                    # 'image' => 'shield_1.webp',
                    'lore'  => 'Pusiste un escudo en tu perfil de LinkedIn. Ahora tienes uno de verdad que rebota mágicamente los marrones ajenos.',
                ]
            ]
        ],

        // ─── 6. BLOQUEO (Compleja - 1 Variante) ────────────────────────────
        [
            'id'                   => 6,
            'type'                 => 'default',
            'target'               => 'opponent',
            'base_name'            => 'Bloqueo',
            'description'          => 'Bloquea el siguiente turno de un rival. El jugador afectado tiene un 25% de probabilidad de evadir el bloqueo en su turno.',
            'icons'                => ['opponent', 'block'],
            'count'                => 4,
            'variants'             => [
                [
                    'name'  => 'Auditoría Sorpresa',
                    # 'image' => 'block_1.webp',
                    'lore'  => 'Una auditoría inesperada puede paralizar a cualquiera. Tu rival tendrá que perder todo su tiempo buscando facturas perdidas.',
                ]
            ]
        ],

        // ─── 7. ATAQUE MASIVO (Compleja - 1 Variante) ──────────────────────
        [
            'id'                   => 7,
            'type'                 => 'attack',
            'target'               => 'all',
            'base_name'            => 'Ataque Masivo',
            'description'          => 'Ataca a todos los oponentes vivos a la vez.',
            'icons'                => ['all', 'attack'],
            'count'                => 4,
            'variants'             => [
                [
                    'name'  => 'Reunión General',
                    # 'image' => 'multi_attack_1.webp',
                    'lore'  => 'Todos a la sala de reuniones. Nadie sale hasta que esto termine y todos pierden la paciencia por igual.',
                ]
            ]
        ],

        // ─── 8. CURACIÓN MASIVA (Compleja - 1 Variante) ────────────────────
        [
            'id'                   => 8,
            'type'                 => 'heal',
            'target'               => 'all',
            'base_name'            => 'Curación Masiva',
            'description'          => 'Cura a todos los jugadores vivos 1 punto de estrés, tú incluido.',
            'icons'                => ['all', 'heal'],
            'count'                => 3,
            'variants'             => [
                [
                    'name'  => 'Viernes de Pizza',
                    # 'image' => 'multi_heal_1.webp',
                    'lore'  => 'La empresa invita. Las porciones son pequeñas y están frías, pero milagrosamente todos se sienten un poco mejor.',
                ]
            ]
        ],

        // ─── 9. SABOTAJE (Compleja - 1 Variante) ────────────────────
        [
            'id'                   => 9,
            'type'                 => 'default',
            'target'               => 'opponent',
            'base_name'            => 'Sabotaje',
            'description'          => 'Obliga a un rival a descartar una carta de su mano.',
            'icons'                => ['opponent', 'discard'],
            'count'                => 6,
            'variants'             => [
                [
                    'name'  => 'Desorganización Estratégica',
                    # 'image' => 'sabotage_1.webp',
                    'lore'  => 'Has movido algunos archivos de sitio. Tu rival no encontrará lo que busca cuando más lo necesite.',
                ]
            ]
        ],

        // ─── 10. VISIÓN (Pasiva - 1 Variante) ───────────────────────────────
        [
            'id'                   => 10,
            'type'                 => 'perk',
            'target'               => 'self',
            'base_name'            => 'Visión',
            'description'          => 'Te da +1 punto de rango de visión.',
            'icons'                => ['self', 'perk'],
            'count'                => 4,
            'variants'             => [
                [
                    'name'  => 'Gafas de Empresa',
                    # 'image' => 'vision_1.webp',
                    'lore'  => 'Te han graduado la vista en la mutua y ahora ves más lejos en el tablero. Nadie escapa a tu mirada fiscalizadora.',
                ]
            ]
        ],

        // ─── 11. LEJANÍA (Pasiva - 1 Variante) ──────────────────────────────
        [
            'id'                   => 11,
            'type'                 => 'perk',
            'target'               => 'self',
            'base_name'            => 'Lejanía',
            'description'          => 'Los jugadores te ven a +1 de distancia.',
            'icons'                => ['self', 'perk'],
            'count'                => 3,
            'variants'             => [
                [
                    'name'  => 'Teletrabajo Aprobado',
                    # 'image' => 'distance_1.webp',
                    'lore'  => 'Has conseguido firmar el anexo de trabajo remoto. A tus rivales les costará mucho más alcanzarte a través de la pantalla.',
                ]
            ]
        ],

        // ─── 12. LIMPIEZA (Compleja - 1 Variante) ──────────────────────────
        [
            'id'                   => 12,
            'type'                 => 'default',
            'target'               => 'opponent',
            'base_name'            => 'Limpieza',
            'description'          => 'Descarta una pasiva a elegir de cualquier oponente.',
            'icons'                => ['opponent', 'discard'],
            'count'                => 6,
            'variants'             => [
                [
                    'name'  => 'Política de Mesa Limpia',
                    # 'image' => 'clean_1.webp',
                    'lore'  => 'Recursos Humanos ha implementado la estricta política de "mesas despejadas". Despídete de ese bonito equipamiento personal.',
                ]
            ]
        ],

        // ─── 13. ALMACÉN (Pasiva - 1 Variante) ──────────────────────────────
        [
            'id'                   => 13,
            'type'                 => 'perk',
            'target'               => 'self',
            'base_name'            => 'Almacén',
            'description'          => 'Aumenta tu límite máximo de cartas en la mano en 1.',
            'icons'                => ['self', 'perk'],
            'count'                => 4,
            'variants'             => [
                [
                    'name'  => 'Archivador Extra',
                    # 'image' => 'storage_1.webp',
                    'lore'  => 'Has conseguido requisar un archivador de tres cajones que nadie usaba. Tienes mucho más espacio para guardar tus "herramientas".',
                ]
            ]
        ],

        // ─── 14. SUERTE (Pasiva - 1 Variante) ───────────────────────────────
        [
            'id'                   => 14,
            'type'                 => 'perk',
            'target'               => 'self',
            'base_name'            => 'Suerte',
            'description'          => 'Al inicio de tu turno, tienes un 50% de probabilidad de tomar una carta extra.',
            'icons'                => ['self', 'perk'],
            'count'                => 3,
            'variants'             => [
                [
                    'name'  => 'El Favorito de RRHH',
                    # 'image' => 'luck_1.webp',
                    'lore'  => 'Hoy es tu día de suerte en la empresa. El jefe no ha mirado tu pantalla y la máquina de café te ha devuelto cambio de más.',
                ]
            ]
        ],
    ],
];
