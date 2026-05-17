// src/store/game/useGameActions.ts

import { create } from "zustand";
import api from "../../api/axios";
import { logWithTime } from "../../utils/logger";
import { useGameStore } from "./useGameStore";
import { useRoomStore } from "../room/useRoomStore";

interface GameActionsState {
	// --- Estado ---
	isActionLocked: boolean;

	// --- Acciones ---
	setIsActionLocked: (locked: boolean) => void;
	playTurn: (
		cardId: string,
		targetId: string,
		perkKey?: string,
	) => Promise<boolean>;
	reactToAttack: (
		reaction: "dodge" | "accept",
		cardId?: string,
	) => Promise<boolean>;
	reactToMultiAttack: (
		reaction: "dodge" | "accept",
		cardId?: string,
	) => Promise<boolean>;
	endTurn: () => Promise<void>;
	discardCards: (cardIds: string[]) => Promise<void>;
	discardPerks: (perkIds: string[]) => Promise<void>;
	resolveSabotage: (cardId: string) => Promise<void>;
}

export const useGameActions = create<GameActionsState>((set, get) => ({
	isActionLocked: false,

	setIsActionLocked: (locked) => set({ isActionLocked: locked }),

	playTurn: async (cardId, targetId, perkKey) => {
		const roomId = useRoomStore.getState().room?.room_id;
		const { applyGameData } = useGameStore.getState();
		const isActionLocked = get().isActionLocked;

		if (!roomId || isActionLocked) return false;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/action`,
				{
					card_id: cardId,
					target_id: targetId,
					...(perkKey && { perk_key: perkKey }),
				},
			);
			applyGameData(res.data);
			set({ isActionLocked: false })
			return true;
		} catch (error: any) {
			set({ isActionLocked: false });
			logWithTime(
				"useGameActions.ts::playTurn() - Error al jugar el turno. ",
				error.response,
				"error",
			);
			alert(error.response?.data?.message || "Error al jugar la carta.");
			return false;
		}
	},

	reactToAttack: async (reaction, cardId) => {
		const roomId = useRoomStore.getState().room?.room_id;
		const { applyGameData } = useGameStore.getState();
		const isActionLocked = get().isActionLocked;

		if (!roomId || isActionLocked) return false;

		set({ isActionLocked: true });
		try {
			const res = await api.post(`/rooms/${encodeURIComponent(roomId)}/react`, {
				reaction,
				card_id: cardId,
			});
			applyGameData(res.data);
			set({ isActionLocked: false }); 
			return true;
		} catch (error: any) {
			set({ isActionLocked: false });
			logWithTime(
				"useGameActions.ts::reactToAttack() - Error al reaccionar al ataque. ",
				error.response,
				"error",
			);
			alert(error.response?.data?.message || "Error al reaccionar al ataque.");
			return false;
		}
	},

	reactToMultiAttack: async (reaction, cardId) => {
		const roomId = useRoomStore.getState().room?.room_id;
		const { applyGameData } = useGameStore.getState();
		const isActionLocked = get().isActionLocked;

		if (!roomId || isActionLocked) return false;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/react-multi`,
				{
					reaction,
					card_id: cardId,
				},
			);
			applyGameData(res.data);
			set({ isActionLocked: false }); 
			return true;
		} catch (error: any) {
			set({ isActionLocked: false });
			if (error.response?.status === 422) return false;
			logWithTime(
				"useGameActions.ts::reactToMultiAttack() - Error al reaccionar al ataque masivo. ",
				error.response,
			);
			alert(
				error.response?.data?.message ||
					"Error al reaccionar al ataque masivo.",
			);
			return false;
		}
	},

	endTurn: async () => {
		const roomId = useRoomStore.getState().room?.room_id;
		const { applyGameData } = useGameStore.getState();
		const isActionLocked = get().isActionLocked;

		if (!roomId || isActionLocked) return;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/end-turn`,
				{},
			);
			applyGameData(res.data);
			set({ isActionLocked: false }); 
		} catch (error) {
			set({ isActionLocked: false });
		}
	},

	discardCards: async (cardIds: string[]) => {
		const roomId = useRoomStore.getState().room?.room_id;
		const { applyGameData } = useGameStore.getState();
		const isActionLocked = get().isActionLocked;

		if (!roomId || isActionLocked) return;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/discard`,
				{
					card_ids: cardIds,
				},
			);
			applyGameData(res.data);
			set({ isActionLocked: false }); 
		} catch (error: any) {
			set({ isActionLocked: false });
			alert(error.response?.data?.message || "Error al descartar cartas.");
		}
	},

	discardPerks: async (perkIds: string[]) => {
		const roomId = useRoomStore.getState().room?.room_id;
		const { applyGameData } = useGameStore.getState();
		const isActionLocked = get().isActionLocked;

		if (!roomId || isActionLocked) return;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/discard-perks`,
				{
					perk_ids: perkIds,
				},
			);
			applyGameData(res.data);
			set({ isActionLocked: false }); 
		} catch (error: any) {
			set({ isActionLocked: false });
			alert(
				error.response?.data?.message || "Error al descartar el equipamiento.",
			);
		}
	},

	resolveSabotage: async (cardId: string) => {
		const roomId = useRoomStore.getState().room?.room_id;
		const { applyGameData } = useGameStore.getState();
		const isActionLocked = get().isActionLocked;

		if (!roomId || isActionLocked) return;

		set({ isActionLocked: true });
		try {
			const res = await api.post(
				`/rooms/${encodeURIComponent(roomId)}/react-discard`,
				{
					card_id: cardId,
				},
			);
			applyGameData(res.data);
			set({ isActionLocked: false });
		} catch (error) {
			set({ isActionLocked: false });
			console.error("Error al descartar por sabotaje:", error);
		}
	},
}));
