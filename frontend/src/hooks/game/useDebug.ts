// src/hooks/game/useDebug.ts

import { useState, useCallback, useEffect } from "react";
import api from "../../api/axios";
import type { CardCatalogItem } from "../../types/api";

interface DebugState {
	playerModifications: {
		set_stress?: number;
		add_cards?: Record<number, number>;
		set_is_dead?: boolean;
	};
	roomActions: {
		force_win?: string;
	};
}

const initialState: DebugState = {
	playerModifications: {},
	roomActions: {},
};

export function useDebug(roomId: string, myPlayerId?: string) {
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

	const updateIsDead = useCallback((isDead: boolean | undefined) => {
		setDebugState((prev) => ({
			...prev,
			playerModifications: {
				...prev.playerModifications,
				set_is_dead: isDead,
			},
		}));
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

	const handleSubmit = async (action: string) => {
		if (!myPlayerId) {
			setMessage("Error: No se pudo identificar al jugador local.");
			return;
		}

		setIsSubmitting(true);
		setMessage(null);

		try {
			const payload: any = {
				player_id: myPlayerId,
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
				if (!debugState.roomActions.force_win) {
					setMessage("Selecciona una acción de sala");
					setIsSubmitting(false);
					return;
				}

				payload.room_actions = { ...debugState.roomActions };

				Object.keys(payload.room_actions).forEach((key) => {
					if (
						!payload.room_actions[key] ||
						(Array.isArray(payload.room_actions[key]) &&
							payload.room_actions[key].length === 0)
					) {
						delete payload.room_actions[key];
					}
				});
			}

			await api.post(`/rooms/${roomId}/debug`, payload);
			setMessage("Acción ejecutada correctamente");

			setDebugState(initialState); // Resetear el estado para limpiar UI
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
		updateIsDead,
		updateModification,
		updateCardQuantity,
		updateRoomAction,
		handleSubmit,
	};
}
