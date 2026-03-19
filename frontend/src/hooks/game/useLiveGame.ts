// src/hooks/game/useLiveGame.ts

import api from "../../api/axios.ts";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

// -- HOOKS CUSTOM --
import { useGameSockets } from "./useGameSockets.ts";
import { usePlayerIdentity } from "../usePlayerIdentity.ts";
import { useGameActions } from "./useGameActions.ts";

// -- UTILS & STORE --
import { logWithTime } from "../../utils/logger.ts";
import { useAuthStore } from "../../store/useAuthStore.ts";

// -- INTERFACES --
import type { GameData } from "../../types/live-game.ts";

export function useLiveGame(roomId: string | undefined) {
	const navigate = useNavigate();
	const { myPlayerName } = usePlayerIdentity();
	const { token, isGuest, logout } = useAuthStore();

	// -- ESTADOS CENTRALES DE LA PARTIDA --
	const [gameData, setGameData] = useState<GameData | null>(null);
	const [loading, setLoading] = useState(true);
	const [isConnecting, setIsConnecting] = useState(true);
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const [gameOver, setGameOver] = useState(false);

	// -- ESTADO PARA EL MODAL DE NUEVO JEFE (HERENCIA) --
	const [showActingBossModal, setShowActingBossModal] = useState(false);
	const prevActingBossRef = useRef(false);

	const isKickedRef = useRef(false);
	const syncRequestIdRef = useRef(0);

	// -- 1. FUNCIÓN DE SINCRONIZACIÓN (FETCH) --
	const syncGame = useCallback(async () => {
		if (!roomId || !myPlayerName || !token) return;
		if (isKickedRef.current) return;

		if (!localStorage.getItem("game_token")) {
			console.warn(
				"Ignorando sync prematuro: aún estamos obteniendo el token.",
			);
			return;
		}

		const currentSyncId = ++syncRequestIdRef.current;

		try {
			const res = await api.post(`/rooms/${roomId}/sync`);

			// En la espera, si se envió otra peticion, ignorar esta.
			if (currentSyncId !== syncRequestIdRef.current) return;

			if (!res || res.data === null) {
				isKickedRef.current = true;
				navigate("/");
				return;
			}

			setGameData(res.data);

			if (res.data.game?.game_over) {
				setGameOver(true);
				localStorage.removeItem("game_token");
			}
		} catch (error: any) {
			if (isKickedRef.current) return;

			const errorType = error.response?.data?.type;
			const status = error.response?.status;

			if (errorType === "GAME_NOT_STARTED") {
				console.warn("Waiting for Redis initialization...");
				return;
			}

			if (status === 404) {
				isKickedRef.current = true;
				navigate("/");
				return;
			}

			console.error("ERROR en /sync:", error);
			if (status === 401 || status === 403) {
				logWithTime("useLiveGame.ts - Sesión de juego caducada.");
			} else {
				alert("Error al sincronizar la sala.");
			}
			isKickedRef.current = true;
			navigate("/");
		} finally {
			setLoading(false);
		}
	}, [roomId, navigate, myPlayerName, token]);

	// -- 2. ACCIONES DEL JUGADOR --
	const { playTurn, endTurn, reactToAttack } = useGameActions(roomId, syncGame);

	// -- 3. VIGILANTE DE HERENCIA (MODAL REACTIVO) --
	useEffect(() => {
		// Comprobamos si en los datos que acaban de llegar somos acting_boss
		const isNowActingBoss = gameData?.me?.acting_boss === true;
		const wasActingBoss = prevActingBossRef.current;

		// Si el estado cambia de false a true, disparamos el modal
		if (isNowActingBoss && !wasActingBoss) {
			logWithTime(
				"useLiveGame.ts - Cambio detectado: ¡Eres el nuevo Jefe Heredado!",
			);
			setShowActingBossModal(true);
		}

		prevActingBossRef.current = isNowActingBoss;
	}, [gameData?.me?.acting_boss]);

	// -- 4. RECONEXIÓN INICIAL (JOIN) --
	useEffect(() => {
		const reconnect = async () => {
			if (!roomId || !myPlayerName || !token) return;

			try {
				const res = await api.post(`/rooms/${roomId}/join`);

				if (res.data.game_token) {
					localStorage.setItem("game_token", res.data.game_token);
				}

				await syncGame();
			} catch (error) {
				logWithTime("useLiveGame.ts - No se pudo reconectar. ", error);
				navigate("/");
			} finally {
				setIsConnecting(false);
			}
		};

		reconnect();
	}, [roomId, myPlayerName, token, syncGame, navigate]);

	// -- 5. ABANDONO DE LA SALA (LEAVE) --
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

	// -- 6. ESCUCHA DE SOCKETS (AHORA SIMPLIFICADA) --
	useGameSockets({
		roomId,
		refreshGameData: isConnecting || gameOver ? () => {} : syncGame,
	});

	return {
		// Datos
		gameData,
		loading,
		myPlayerName,
		isFirstLoad,
		setIsFirstLoad,
		gameOver,
		showActingBossModal,
		setShowActingBossModal,
		// Acciones
		playTurn,
		endTurn,
		reactToAttack,
	};
}
