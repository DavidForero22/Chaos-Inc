<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Definición de cartas del juego
    |--------------------------------------------------------------------------
    |
    | Aquí se definen las cartas disponibles en el mazo:
    |  - id: identificador numérico interno
    |  - name: nombre legible para mostrar en UI/logs
    |  - description: descripcion de lo que hace la carta   
    |  - count: cuántas copias habrá en el mazo inicial
    |
    | De momento solo usamos una carta de prueba "Atacar"
    | con muchas copias para poder testear la mecánica.
    */

    'cards' => [
        [
            'id'                => 1,
            'name'              => 'Atacar',
            'description'       => 'Inflige 1 punto de estrés a un rival.',
            'count'             => 12,
        ],
        [
            'id'                => 2,
            'name'              => 'Curar',
            'description'       => 'Reduce tu propio estrés en 1 punto.',
            'count'             => 6,
        ],
        [
            'id'                => 3,
            'name'              => 'Esquivar',
            'description'       => 'Evita el efecto de un ataque contra ti.',
            'count'             => 10,
        ],
        [
            'id'                => 4,
            'name'              => 'Robar',
            'description'       => 'Roba una carta aleatoria de la mano de un rival.',
            'count'             => 0,
        ],
        [
            'id'                => 5,
            'name'              => 'Escudo',
            'description'       => 'Bloquea automáticamente el siguiente ataque que recibas.',
            'count'             => 6,
        ],
        [
            'id'                => 6,
            'name'              => 'Bloqueo',
            'description'       => 'Bloquea el siguiente turno de un rival.',
            'count'             => 0,
        ],
        [
            'id'                => 7,
            'name'              => 'Ataque Masivo',
            'description'       => 'Ataca a todos los jugadores a la vez.',
            'count'             => 0,
        ],
        [
            'id'                => 8,
            'name'              => 'Curación Masiva',
            'description'       => 'Cura a todos los jugadores en 1 punto de estrés.',
            'count'             => 0,
        ],
        [
            'id'                => 9,
            'name'              => 'Sabotaje',
            'description'       => 'Obliga a un rival a descartar una carta de su mano.',
            'count'             => 0,
        ],
        [
            'id'                => 10,
            'name'              => 'Visión',
            'description'       => 'Te da +1 punto de rango de visión.',
            'count'             => 6,
        ],
        [
            'id'                => 11,
            'name'              => 'Lejania',
            'description'       => 'Los jugadores te ven a +1 de distancia.',
            'count'             => 6,
        ],
        [
            'id'                => 12,
            'name'              => 'Limpieza',
            'description'       => 'Destruye un equipamiento activo de cualquier compañero.',
            'count'             => 0,
        ],
        [
            'id'                => 13,
            'name'              => 'Almacen',
            'description'       => 'Aumenta tu límite máximo de cartas en la mano en 1.',
            'count'             => 6, 
        ],
    ],
];
