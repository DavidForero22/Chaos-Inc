// src/hooks/game/useLiveGame.ts

import api from "../../api/axios.ts";

// -- HOOKS --
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useGameSockets } from "./useGameSockets.ts";
import { usePlayerIdentity } from "../usePlayerIdentity.ts";
import { useGameActions } from "./useGameActions.ts";
import { logWithTime } from "../../utils/logger.ts";

// -- STORE --
import { useAuthStore } from "../../store/useAuthStore.ts";

// -- INTERFACES --
import type { GameData } from "../../types/live-game.ts";

export function useLiveGame(roomId: string | undefined) {
	const navigate = useNavigate();
	const { myPlayerName } = usePlayerIdentity();
	const { token, isGuest, logout } = useAuthStore();

	const [gameData, setGameData] = useState<GameData | null>(null);
	const [loading, setLoading] = useState(true);
	const [isConnecting, setIsConnecting] = useState(true);
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [gameOver, setGameOver] = useState(false);

	// Estado para el modal de herencia — se activa por evento privado,
	// no por comparación de gameData, para evitar depender del sync
	const [isActingBossAssigned, setIsActingBossAssigned] = useState(false);
	const [internGraceCancelled, setInternGraceCancelled] = useState(false);
	const [actingBossGraceTrigger, setActingBossGraceTrigger] = useState(0);

	const isKickedRef = useRef(false);

	const syncGame = useCallback(async () => {
		// Si no hay token de Sanctum o nombre, no puede hacer peticiones
		if (!roomId || !myPlayerName || !token) return;

		if (!localStorage.getItem("game_token")) {
			console.warn(
				"Ignorando sync prematuro: aún estamos obteniendo el token.",
			);
			return;
		}

		try {
			const res = await api.post(`/rooms/${roomId}/sync`);

			// Silenciador de Axios (si intercepta un 401 devuelve null)
			if (!res || res.data === null) {
				isKickedRef.current = true;
				navigate("/");
				return;
			}

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
			if (error.response?.status === 401 || error.response?.status === 403) {
				alert("Game session expired or unauthorized.");
				isKickedRef.current = true;
			} else {
				alert("Error al sincronizar la sala.");
			}
			navigate("/");
			setLoading(false);
		}
	}, [roomId, navigate, myPlayerName, token]);

	const { playTurn, endTurn, reactToAttack } = useGameActions(roomId, syncGame);

	// Callback que dispara useGameSockets al recibir el evento privado.
	// Abre el modal de inmediato y después hace sync para tener gameData actualizado cuando el usuario pulse "Entendido".
	const handleActingBossAssigned = useCallback(async () => {
		setIsActingBossAssigned(true);
		await syncGame();
	}, [syncGame]);

	const handleActingBossGrace = useCallback(() => {
		setActingBossGraceTrigger((n) => n + 1);
	}, []);

	const handleActingBossGraceCancelled = useCallback(() => {
		setInternGraceCancelled(true);
	}, []);

	useEffect(() => {
		const reconnect = async () => {
			// Esperar a que el store tenga la sesión iniciada
			if (!roomId || !myPlayerName || !token) return;

			try {
				// Primero hacer el JOIN sí o sí
				const res = await api.post(`/rooms/${roomId}/join`);

				if (res.data.game_token) {
					localStorage.setItem("game_token", res.data.game_token);
				}

				// Una vez guardado el token nuevo, sincronizar con seguridad
				await syncGame();
			} catch (error) {
				logWithTime("No se pudo reconectar. ", error);
				alert("No puedes acceder a esta partida en curso.");
				navigate("/");
			} finally {
				setIsConnecting(false);
			}
		};

		reconnect();
	}, [roomId, myPlayerName, token, syncGame, navigate]);

	useEffect(() => {
		const handleUnload = () => {
			if (isKickedRef.current) return;

			if (gameOver) {
				if (isGuest) logout();
				return;
			}

			if (roomId) {
				const sanctumToken = localStorage.getItem("token") || "";
				const gameToken = localStorage.getItem("game_token") || "";

				fetch(`${api.defaults.baseURL}/rooms/${roomId}/leave`, {
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
						Authorization: `Bearer ${sanctumToken}`,
						"X-Game-Token": gameToken,
					},
					keepalive: true,
					body: JSON.stringify({}),
				}).catch(() => {});
			}
		};

		window.addEventListener("beforeunload", handleUnload);
		return () => window.removeEventListener("beforeunload", handleUnload);
	}, [roomId, gameOver, isGuest, logout]);

	useGameSockets({
		roomId,
		myPlayerName: myPlayerName ?? "",
		refreshGameData: isConnecting ? () => {} : syncGame,
		onActingBossAssigned: handleActingBossAssigned,
		onActingBossGrace: handleActingBossGrace,
		onActingBossGraceCancelled: handleActingBossGraceCancelled,
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
		isActingBossAssigned,
		setIsActingBossAssigned,
		actingBossGraceTrigger,
		internGraceCancelled,
		setInternGraceCancelled,
	};
}
