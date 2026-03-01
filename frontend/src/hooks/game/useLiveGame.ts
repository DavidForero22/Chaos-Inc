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

		// Si los sockets responden pero aún no ha terminado de guardar el token de reconexión, ignorar el aviso.
        if (!sessionStorage.getItem("game_token")) {
            console.warn("Ignorando sync prematuro: aún estamos obteniendo el token.");
            return; 
        }

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
			alert("Eror al sincronizar la sala.");
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

	// Flujo de auto-reconversión en el montaje
	useEffect(() => {
		const attemptReconnection = async () => {
			if (!roomId || !myPlayerName) return;

			try {
				// Intentar reconectar explícitamente usando el nombre
				const res = await api.post(`/rooms/${roomId}/join`, {
					player_name: myPlayerName,
				});

				// Si el backend acepta, dara un nuevo token.
				if (res.data.game_token) {
					sessionStorage.setItem("game_token", res.data.game_token);
					syncGame();
				}
			} catch (error) {
				// Si el backend  rechaza
				console.error("No se pudo reconectar:", error);
				alert("No puedes acceder a esta partida en curso.");
				navigate("/");
			}
		};

		const currentToken = sessionStorage.getItem("game_token");

		if (!currentToken) {
			// No hay token (cerró pestaña o F5 en nueva ventana). Intentar recuperarlo.
			attemptReconnection();
		} else {
			// Ya hay token
			syncGame();
		}
	}, [roomId, myPlayerName, syncGame, navigate]);

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
