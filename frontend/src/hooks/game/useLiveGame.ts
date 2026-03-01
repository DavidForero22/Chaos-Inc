import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.ts";
import type { GameData } from "../../types/types.ts";
import { useGameSockets } from "./useGameSockets.ts";
import { usePlayerIdentity } from "../usePlayerIdentity.ts";

export function useLiveGame(roomId: string | undefined) {
	const navigate = useNavigate();
	const { myPlayerName } = usePlayerIdentity();

	const [gameData, setGameData] = useState<GameData | null>(null);
	const [loading, setLoading] = useState(true);

	const isKickedRef = useRef(false);

	const syncGame = useCallback(async () => {
		if (!roomId || !myPlayerName) return;

		try {
			const res = await api.post(`/rooms/${roomId}/sync`, {
				player_name: myPlayerName,
			});
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
				isKickedRef.current = true;
			}
			navigate("/");
			setLoading(false);
		}
	}, [roomId, navigate, myPlayerName]);

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

	useEffect(() => {
		const handleUnload = () => {
			if (isKickedRef.current) return;
			if (roomId) {
				const data = new URLSearchParams();
				data.append("game_token", sessionStorage.getItem("game_token") || "");
				// Esto avisa al backend. Como status es in_game, el backend pondrá is_online = 0
				navigator.sendBeacon(
					`${api.defaults.baseURL}/rooms/${roomId}/leave`,
					data,
				);
			}
		};
		window.addEventListener("beforeunload", handleUnload);
		return () => window.removeEventListener("beforeunload", handleUnload);
	}, [roomId]);

	useGameSockets({
		roomId,
		refreshGameData: syncGame,
	});

	return {
		gameData,
		loading,
		myPlayerName,
		playTurn,
	};
}
