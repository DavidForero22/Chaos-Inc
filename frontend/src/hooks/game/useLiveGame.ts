// --- src/hooks/game/useLiveGame.ts ---
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.ts";
import type { GameData } from "../../types/types.ts";
import { useGameSockets } from "./useGameSockets.ts";
import { usePlayerIdentity } from "../usePlayerIdentity.ts";
import { useGameActions } from "./useGameActions.ts";

export function useLiveGame(roomId: string | undefined) {
	const navigate = useNavigate();
	const { myPlayerName } = usePlayerIdentity();

	const [gameData, setGameData] = useState<GameData | null>(null);
	const [loading, setLoading] = useState(true);
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [gameOver, setGameOver] = useState(false);

	const isKickedRef = useRef(false);

	const syncGame = useCallback(async () => {
		if (!roomId || !myPlayerName) return;

		if (!sessionStorage.getItem("game_token")) {
			console.warn(
				"Ignorando sync prematuro: aún estamos obteniendo el token.",
			);
			return;
		}

		try {
			const res = await api.post(`/rooms/${roomId}/sync`, {
				player_name: myPlayerName,
			});
			setGameData(res.data);
			setLoading(false);

			if (res.data.game?.game_over) {
				setGameOver(true);
				sessionStorage.removeItem("game_token");
			}
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
			} else {
				alert("Error al sincronizar la sala.");
			}
			navigate("/");
			setLoading(false);
		}
	}, [roomId, navigate, myPlayerName]);

	const { playTurn, endTurn, reactToAttack } = useGameActions(roomId, syncGame);

	useEffect(() => {
		const attemptReconnection = async () => {
			if (!roomId || !myPlayerName) return;

			try {
				const res = await api.post(`/rooms/${roomId}/join`, {
					player_name: myPlayerName,
				});

				if (res.data.game_token) {
					sessionStorage.setItem("game_token", res.data.game_token);
					syncGame();
				}
			} catch (error) {
				console.error("No se pudo reconectar:", error);
				alert("No puedes acceder a esta partida en curso.");
				navigate("/");
			}
		};

		const currentToken = sessionStorage.getItem("game_token");

		if (!currentToken) {
			attemptReconnection();
		} else {
			syncGame();
		}
	}, [roomId, myPlayerName, syncGame, navigate]);

	useEffect(() => {
		const handleUnload = () => {
			if (isKickedRef.current) return;
			if (roomId) {
				const data = new URLSearchParams();
				data.append("game_token", sessionStorage.getItem("game_token") || "");
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
		endTurn,
		reactToAttack,
		isFirstLoad,
		setIsFirstLoad,
		gameOver,
	};
}
