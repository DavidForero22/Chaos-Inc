// src/hooks/game/useLiveGame.ts

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.ts";
import type { GameData } from "../../types/types.ts";
import { useGameSockets } from "./useGameSockets.ts";
import { usePlayerIdentity } from "../usePlayerIdentity.ts";
import { useGameActions } from "./useGameActions.ts";
import { useAuthStore } from "../../store/useAuthStore.ts";

import { logWithTime } from "../../utils/logger.ts";

export function useLiveGame(roomId: string | undefined) {
	const navigate = useNavigate();
	const { myPlayerName } = usePlayerIdentity();

	const [gameData, setGameData] = useState<GameData | null>(null);
	const [loading, setLoading] = useState(true);
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [gameOver, setGameOver] = useState(false);
	const { isGuest, logout } = useAuthStore();

	const isKickedRef = useRef(false);

	const syncGame = useCallback(async () => {
		if (!roomId || !myPlayerName) return;

		if (!localStorage.getItem("game_token")) {
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
				localStorage.removeItem("game_token");
			}
		} catch (error: any) {
			const errorType = error.response?.data?.type;

			if (errorType === "GAME_NOT_STARTED") {
				console.warn("Waiting for Redis initialization...");
				return;
			}

			console.error("ERROR en /sync:", error);
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
		const reconnect = async () => {
			if (!roomId || !myPlayerName) return;

			try {
				const res = await api.post(`/rooms/${roomId}/join`, {
					player_name: myPlayerName,
				});

				if (res.data.game_token) {
					localStorage.setItem("game_token", res.data.game_token);
				}

				await syncGame();
			} catch (error) {
				logWithTime("No se pudo reconectar. ", error);
				alert("No puedes acceder a esta partida en curso.");
				navigate("/");
			}
		};

		reconnect();
	}, [roomId, myPlayerName, syncGame, navigate]);

	useEffect(() => {
		const handleUnload = () => {
			if (isKickedRef.current) return;

			if (gameOver) {
				// Partida terminada — limpiar invitado si corresponde
				if (isGuest) logout();
				return; // no enviar beacon, ya no hay sesión activa
			}

			// Partida en curso — marcar offline
			if (roomId) {
				const data = new URLSearchParams();
				data.append("game_token", localStorage.getItem("game_token") || "");
				navigator.sendBeacon(
					`${api.defaults.baseURL}/rooms/${roomId}/leave`,
					data,
				);
			}
		};

		window.addEventListener("beforeunload", handleUnload);
		return () => window.removeEventListener("beforeunload", handleUnload);
	}, [roomId, gameOver, isGuest, logout]);

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
