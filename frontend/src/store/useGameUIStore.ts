// src/store/useGameUIStore.ts

import { create } from "zustand";

interface GameUIState {
	selectedCardId: string | null;
	isDiscardMode: boolean;
	cardsToDiscard: string[];
	perksToDiscard: string[];
	luckResult: "success" | "fail" | null;
	isFolderExpanded: boolean;

	setSelectedCardId: (id: string | null) => void;
	setIsDiscardMode: (active: boolean) => void;
	toggleDiscardCard: (id: string, maxCards?: number) => void;
	toggleDiscardPerk: (id: string, maxCards?: number) => void;
	clearDiscardSelection: () => void;
	handleLuckResult: (success: boolean) => void;
	toggleFolder: () => void;
	setFolderExpanded: (expanded: boolean) => void;
}

export const useGameUIStore = create<GameUIState>((set) => ({
	selectedCardId: null,
	isDiscardMode: false,
	cardsToDiscard: [],
	perksToDiscard: [],
	luckResult: null,
	isFolderExpanded: false,

	setSelectedCardId: (id) => set({ selectedCardId: id }),

	setIsDiscardMode: (active) =>
		set({
			isDiscardMode: active,
			cardsToDiscard: [], // Limpiar al entrar/salir del modo
			perksToDiscard: [],
			selectedCardId: null, // Deseleccionar cualquier carta activa
		}),

	toggleDiscardCard: (id, maxCards) =>
		set((state) => {
			const prev = state.cardsToDiscard;

			// Si ya está seleccionada, quitar la carta
			if (prev.includes(id)) {
				return { cardsToDiscard: prev.filter((cardId) => cardId !== id) };
			}

			// Si hay un límite (ej. 1 en sabotaje) y ya se ha alcanzado, sustituir la carta
			if (maxCards !== undefined && prev.length >= maxCards) {
				return { cardsToDiscard: [id] };
			}

			// Si no hay límite o no se ha alcanzado, añadirla
			return { cardsToDiscard: [...prev, id] };
		}),

	toggleDiscardPerk: (id) =>
		set((state) => {
			const prev = state.perksToDiscard;
			if (prev.includes(id)) {
				return { perksToDiscard: prev.filter((perkId) => perkId !== id) };
			}
			return { perksToDiscard: [...prev, id] };
		}),

	clearDiscardSelection: () =>
		set({
			isDiscardMode: false,
			cardsToDiscard: [],
			perksToDiscard: [],
			selectedCardId: null, // Limpiar todo de golpe
		}),

	handleLuckResult: (success: boolean) => {
		set({ luckResult: success ? "success" : "fail" });

		// El store se limpia a sí mismo después de 4 segundos
		setTimeout(() => {
			set({ luckResult: null });
		}, 4000);
	},

	toggleFolder: () =>
		set((state) => ({ isFolderExpanded: !state.isFolderExpanded })),
	setFolderExpanded: (expanded) => set({ isFolderExpanded: expanded }),
}));
