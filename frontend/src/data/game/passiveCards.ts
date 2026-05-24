// src/data/game/passiveCards.ts

export const PASSIVE_CARD_IDS = new Set([
	5, // Escudo
	11, // Lejanía
	13, // Depósito
	14, // Suerte
	16, // Lanzapatatas
]);

// Cartas cuya pasiva puede apilarse (no ocupa slot nuevo si ya la tienes)
export const STACKABLE_PASSIVE_CARD_IDS = new Set([10]); // Visión
