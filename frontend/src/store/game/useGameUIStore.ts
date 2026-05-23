// src/store/useGameUIStore.ts

import { create } from "zustand";

export type ActiveModalType =
	| "none"
	| "log"
	| "guide"
	| "card_detail"
	| "debug";

interface GameUIState {
	selectedCardId: string | null;
	isDiscardMode: boolean;

	isInfoMode: boolean;
	cardsToDiscard: string[];
	perksToDiscard: string[];
	luckResult: "success" | "fail" | null;

	isFolderExpanded: boolean;
	activeModal: ActiveModalType;
	showActingBossModal: boolean;
	matchAchievements: string[];

	isSacrificeMode: boolean;
	sacrificeCardId: string | null; // ID de la carta elegida para sacrificar
	setSacrificeMode: (active: boolean) => void;
	setSacrificeCard: (cardId: string | null) => void;
	clearSacrifice: () => void;

	setSelectedCardId: (id: string | null) => void;
	setIsDiscardMode: (active: boolean) => void;
	setIsInfoMode: (active: boolean) => void;
	toggleDiscardCard: (id: string, maxCards?: number) => void;
	toggleDiscardPerk: (id: string, maxCards?: number) => void;
	clearDiscardSelection: () => void;

	handleLuckResult: (success: boolean) => void;
	toggleFolder: () => void;
	setFolderExpanded: (expanded: boolean) => void;
	setActiveModal: (modal: ActiveModalType) => void;

	setShowActingBossModal: (show: boolean) => void;
	addMatchAchievement: (achievementId: string) => void;
	clearMatchAchievements: () => void;
	resetGameUI: () => void;
}

export const useGameUIStore = create<GameUIState>((set) => ({
	showActingBossModal: false,
	matchAchievements: [],

	selectedCardId: null,
	isDiscardMode: false,
	isInfoMode: false,
	cardsToDiscard: [],
	perksToDiscard: [],
	luckResult: null,
	isFolderExpanded: false,
	activeModal: "none",

	isSacrificeMode: false,
	sacrificeCardId: null,

	setSelectedCardId: (id) => set({ selectedCardId: id }),

	setIsDiscardMode: (active) =>
		set({
			isDiscardMode: active,
			isInfoMode: false,
			cardsToDiscard: [],
			perksToDiscard: [],
			selectedCardId: null,
		}),

	setIsInfoMode: (active) =>
		set({
			isInfoMode: active,
			isDiscardMode: false,
			selectedCardId: null,
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
			isInfoMode: false,
			cardsToDiscard: [],
			perksToDiscard: [],
			selectedCardId: null,
			isSacrificeMode: false,
			sacrificeCardId: null,
		}),

	handleLuckResult: (success: boolean) => {
		set({ luckResult: success ? "success" : "fail" });
		setTimeout(() => set({ luckResult: null }), 4000);
	},

	toggleFolder: () =>
		set((state) => ({ isFolderExpanded: !state.isFolderExpanded })),
	setFolderExpanded: (expanded) => set({ isFolderExpanded: expanded }),

	setActiveModal: (modal) => set({ activeModal: modal }),
	setShowActingBossModal: (show) => set({ showActingBossModal: show }),
	addMatchAchievement: (achievementId) =>
		set((state) => ({
			matchAchievements: state.matchAchievements.includes(achievementId)
				? state.matchAchievements
				: [...state.matchAchievements, achievementId],
		})),
	clearMatchAchievements: () => set({ matchAchievements: [] }),
	resetGameUI: () =>
		set({
			showActingBossModal: false,
			matchAchievements: [],
			selectedCardId: null,
			isDiscardMode: false,
			isInfoMode: false,
			cardsToDiscard: [],
			perksToDiscard: [],
			luckResult: null,
			activeModal: "none",
		}),

	setSacrificeMode: (active) =>
		set({ isSacrificeMode: active, sacrificeCardId: null }),
	setSacrificeCard: (cardId) => set({ sacrificeCardId: cardId }),
	clearSacrifice: () => set({ isSacrificeMode: false, sacrificeCardId: null }),
}));
