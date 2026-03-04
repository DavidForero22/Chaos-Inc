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
    |  - count: cuántas copias habrá en el mazo inicial
    |
    | De momento solo usamos una carta de prueba "Atacar"
    | con muchas copias para poder testear la mecánica.
    */

    'cards' => [
        [
            'id' => 1,
            'name' => 'Atacar',
            'description' => 'Inflige 1 punto de estrés a un rival.',
            'count' => 15,
        ],
        [
            'id' => 2,
            'name' => 'Curar',
            'description' => 'Reduce tu propio estrés en 1 punto.',
            'count' => 15,
        ],
        [
            'id' => 3,
            'name' => 'Esquivar',
            'description' => 'Evita el efecto de un ataque contra ti.',
            'count' => 10,
        ],
    ],
];

