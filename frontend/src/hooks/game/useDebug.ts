// src/hooks/game/useDebug.ts

import { useState, useCallback, useEffect } from "react";
import api from "../../api/axios";

export interface CardCatalogItem {
	id: number;
	type: string;
	target: string;
	base_name: string;
	display_name: string;
	description: string;
	lore: string;
	icons: string[];
	image_path: string | null;
}

interface DebugState {
	playerModifications: {
		set_stress?: number;
		add_cards?: Record<number, number>;
		set_role?: string;
	};
	roomActions: {
		force_win?: string;
		remove_ghost?: string;
	};
	spawnGhost: {
		username: string;
		role: string;
	};
}

const initialState: DebugState = {
	playerModifications: {},
	roomActions: {},
	spawnGhost: { username: "", role: "intern" },
};

export function useDebug(roomId: string, playerId: string) {
	const [debugState, setDebugState] = useState<DebugState>(initialState);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	// Estado del catálogo de cartas
	const [cardCatalog, setCardCatalog] = useState<CardCatalogItem[]>([]);
	const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

	useEffect(() => {
		const fetchCatalog = async () => {
			setIsLoadingCatalog(true);
			try {
				const response = await api.get("/cards");
				setCardCatalog(response.data.data);
			} catch (error) {
				console.error("Error cargando el catálogo de cartas:", error);
			} finally {
				setIsLoadingCatalog(false);
			}
		};
		fetchCatalog();
	}, []);

	const updateModification = useCallback(
		(key: keyof DebugState["playerModifications"], value: any) => {
			setDebugState((prev) => ({
				...prev,
				playerModifications: {
					...prev.playerModifications,
					[key]: value,
				},
			}));
		},
		[],
	);

	// Helper específico para actualizar la cantidad de una carta concreta
	const updateCardQuantity = useCallback((cardId: number, change: number) => {
		setDebugState((prev) => {
			const currentCards = prev.playerModifications.add_cards || {};
			const currentQty = currentCards[cardId] || 0;
			const newQty = Math.max(0, currentQty + change);

			const newCards = { ...currentCards, [cardId]: newQty };

			if (newQty === 0) {
				delete newCards[cardId];
			}

			return {
				...prev,
				playerModifications: {
					...prev.playerModifications,
					add_cards: newCards,
				},
			};
		});
	}, []);

	const updateRoomAction = useCallback(
		(key: keyof DebugState["roomActions"], value: any) => {
			setDebugState((prev) => ({
				...prev,
				roomActions: {
					...prev.roomActions,
					[key]: value,
				},
			}));
		},
		[],
	);

	const updateSpawnGhost = useCallback(
		(key: keyof DebugState["spawnGhost"], value: any) => {
			setDebugState((prev) => ({
				...prev,
				spawnGhost: {
					...prev.spawnGhost,
					[key]: value,
				},
			}));
		},
		[],
	);

	const handleSubmit = async (action: string) => {
		setIsSubmitting(true);
		setMessage(null);

		try {
			const payload: any = {
				player_id: playerId,
			};

			if (action === "modify_player") {
				payload.player_modifications = { ...debugState.playerModifications };

				// Transformar el mapa {1: 2, 5: 1} en array plano [1, 1, 5] antes de enviarlo
				if (payload.player_modifications.add_cards) {
					const flatCardsArray: number[] = [];
					Object.entries(payload.player_modifications.add_cards).forEach(
						([idStr, qty]) => {
							const id = Number(idStr);
							for (let i = 0; i < (qty as number); i++) {
								flatCardsArray.push(id);
							}
						},
					);

					if (flatCardsArray.length > 0) {
						payload.player_modifications.add_cards = flatCardsArray;
					} else {
						delete payload.player_modifications.add_cards;
					}
				}

				Object.keys(payload.player_modifications).forEach((key) => {
					if (
						payload.player_modifications[key] === undefined ||
						payload.player_modifications[key] === "" ||
						(Array.isArray(payload.player_modifications[key]) &&
							payload.player_modifications[key].length === 0)
					) {
						delete payload.player_modifications[key];
					}
				});

				if (Object.keys(payload.player_modifications).length === 0) {
					setMessage("Selecciona al menos una modificación");
					setIsSubmitting(false);
					return;
				}
			} else if (action === "room_action") {
				if (
					!debugState.roomActions.force_win &&
					!debugState.roomActions.remove_ghost
				) {
					setMessage("Selecciona una acción de sala");
					setIsSubmitting(false);
					return;
				}
				payload.room_actions = { ...debugState.roomActions };
				Object.keys(payload.room_actions).forEach((key) => {
					if (!payload.room_actions[key]) {
						delete payload.room_actions[key];
					}
				});
			} else if (action === "spawn_ghost") {
				if (!debugState.spawnGhost.username || !debugState.spawnGhost.role) {
					setMessage("Completa todos los campos del fantasma");
					setIsSubmitting(false);
					return;
				}
				payload.spawn_ghost = { ...debugState.spawnGhost };
			}

			await api.post(`/rooms/${roomId}/debug`, payload);
			setMessage("Acción ejecutada correctamente");

			// Resetear el estado para que los contadores de cartas vuelvan a 0
			setDebugState(initialState);
		} catch (error: any) {
			const errorMsg =
				error.response?.data?.message || error.message || "Error desconocido";
			setMessage(`Error: ${errorMsg}`);
		} finally {
			setIsSubmitting(false);
			setTimeout(() => setMessage(null), 4000);
		}
	};

	return {
		debugState,
		isSubmitting,
		message,
		cardCatalog,
		isLoadingCatalog,
		updateModification,
		updateCardQuantity,
		updateRoomAction,
		updateSpawnGhost,
		handleSubmit,
	};
}
