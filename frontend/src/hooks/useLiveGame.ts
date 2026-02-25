import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios.ts";
import type { GameData } from "../types/types.ts";

export function useLiveGame(roomId: string | undefined) {
	const navigate = useNavigate();
	const location = useLocation();

	// Recuperamos identidad
	const myPlayerName =
		location.state?.playerName || sessionStorage.getItem("guestName");

	const [gameData, setGameData] = useState<GameData | null>(null);
	const [loading, setLoading] = useState(true);

	const syncGame = useCallback(async () => {
		if (!roomId) return;

		try {
			const res = await api.post(`/rooms/${roomId}/sync`);
			setGameData(res.data);
			setLoading(false);
		} catch (error: any) {
			const errorType = error.response?.data?.type;

			if (errorType === "GAME_NOT_STARTED") {
				console.warn("Waiting for Redis initialization...");
				return;
			}

			console.error("Error synchronizing game:", error);
			if (error.response?.status === 401) {
				alert("Game session expired.");
			}
			navigate("/");
			setLoading(false);
		}
	}, [roomId, navigate]);

	const playTurn = async (cardId: number, targetName: string) => {
		if (!roomId) return;

		try {
			// Enviar la jugada al servidor
			await api.post(`/rooms/${roomId}/action`, {
				card_id: cardId,
				target_name: targetName,
			});

			// Sincronizar para ver los cambios
			await syncGame();
		} catch (error: any) {
			console.error("Error playing turn:", error);
			// Mostrar error (ej. "No es tu turno", "Carta inválida")
			alert(error.response?.data?.message || "Error al jugar la carta.");
		}
	};

	useEffect(() => {
		if (!sessionStorage.getItem("game_token")) {
			navigate("/");
			return;
		}
		syncGame();
	}, [syncGame, navigate]);

	return {
		gameData,
		loading,
		myPlayerName,
		playTurn,
	};
}
