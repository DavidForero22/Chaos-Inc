// src/hooks/game/useLiveGame.ts

import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.ts";

// -- HOOKS CUSTOM --
import { useGameSockets } from "./useGameSockets.ts";
import { useAuth } from "../useAuth.ts";

// -- UTILS & STORE --
import { logWithTime } from "../../utils/logger.ts";
import { useGameStore } from "../../store/useGameStore.ts";
import { useGameUIStore } from "../../store/useGameUIStore.ts";
import { useLoadingStore } from "../../store/useLoadingStore.ts";

export function useLiveGame(roomId: string | undefined) {
	const navigate = useNavigate();
	const { user } = useAuth();

	const isKickedRef = useRef(false);

	// -- EXTRAER LO NECESARIO DEL STORE --
	const setRoomId = useGameStore((state) => state.setRoomId);
	const syncGameStore = useGameStore((state) => state.syncGame);
	const setIsConnecting = useGameStore((state) => state.setIsConnecting);
	const isConnecting = useGameStore((state) => state.isConnecting);
	const resetStore = useGameStore((state) => state.resetStore);

	// Extraer el current_turn para vigilarlo
	const currentTurn = useGameStore(
		(state) => state.gameData?.game?.current_turn,
	);
	const clearDiscardSelection = useGameUIStore(
		(state) => state.clearDiscardSelection,
	);

	// -- 1. INICIALIZAR EL ROOM ID Y LIMPIAR AL SALIR --
	useEffect(() => {
		setRoomId(roomId || null);

		return () => {
			// Cuando sale del componente, verificar si el juego ha terminado
			const isGameOver = useGameStore.getState().gameOver;

			if (isGameOver) {
				// Partida terminada: limpiar todo incluyendo el token
				localStorage.removeItem("game_token");
			}

			// Si el juego no ha terminado, conservar el Room ID
			// Si ya terminó, limpiar todo
			resetStore(!isGameOver);
		};
	}, [roomId, setRoomId, resetStore]);

	// --- 1.5 LIMPIEZA DE UI AL CAMBIAR DE TURNO ---
	const previousTurnRef = useRef<string | null>(null);

	useEffect(() => {
		// Si el turno ha cambiado, o si se ha reiniciado por completo
		if (currentTurn !== previousTurnRef.current) {
			if (previousTurnRef.current === user && currentTurn !== user) {
				logWithTime(
					"useLiveGame.ts - El turno ha pasado a otro jugador. Limpiando UI.",
				);
				clearDiscardSelection();
			}

			previousTurnRef.current = currentTurn || null;
		}
	}, [currentTurn, user, clearDiscardSelection]);

	// -- 2. WRAPPER DE SINCRONIZACIÓN (Maneja las redirecciones) --
	const handleSync = useCallback(async () => {
		if (isKickedRef.current || !roomId) return;

		try {
			await syncGameStore();
		} catch (error: any) {
			if (isKickedRef.current) return;

			const status = error.response?.status;
			const errorType = error.response?.data?.type;

			if (errorType === "GAME_NOT_STARTED") {
				console.warn("Waiting for Redis initialization...");
				return;
			}

			// --- REDIRECCIÓN AL 404 ---
			if (status === 404 || errorType === "ROOM_NOT_FOUND") {
				isKickedRef.current = true;

				// Si echan por 404, borrar el loader si existía
				useLoadingStore.getState().stopLoading();

				navigate("/room-not-found");
				return;
			}

			console.error("ERROR en /sync:", error);

			if (status === 401 || status === 403) {
				logWithTime("useLiveGame.ts - Sesión de juego caducada.");
				alert("Sesión de juego caducada.");
			} else {
				alert("Error al sincronizar la sala.");
			}

			isKickedRef.current = true;
			useLoadingStore.getState().stopLoading();
			navigate("/");
		}
	}, [roomId, syncGameStore, navigate]);

	// -- 3. RECONEXIÓN INICIAL (JOIN) --
	useEffect(() => {
		const reconnect = async () => {
			if (!roomId || !user) return;

			try {
				setIsConnecting(true);

				const res = await api.post(`/rooms/${roomId}/join`, {}, {
					hideLoader: true,
				} as any);

				if (res.data.game_token) {
					localStorage.setItem("game_token", res.data.game_token);
				}

				await handleSync();
			} catch (error: any) {
				const status = error.response?.status;
				const errorType = error.response?.data?.type;

				logWithTime("useLiveGame.ts - No se pudo reconectar. ", error);

				if (status === 404 || errorType === "ROOM_NOT_FOUND") {
					navigate("/room-not-found");
				} else {
					navigate("/");
				}
			} finally {
				setIsConnecting(false);
			}
		};

		reconnect();
	}, [roomId, user, handleSync, navigate, setIsConnecting]);

	// -- 4. MARCAR OFFLINE AL CERRAR PESTAÑA O CAMBIAR DE URL --
	useEffect(() => {
		const notifyOffline = () => {
			// Si ha sido expulsado o la partida ha terminado, no hacer nada
			if (isKickedRef.current || useGameStore.getState().gameOver) return;

			const gameToken = localStorage.getItem("game_token") || "";

			if (roomId && gameToken) {
				// keepalive: true garantiza que la petición sale aunque la página muera
				fetch(`${api.defaults.baseURL}/rooms/${roomId}/mark-offline`, {
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
						"X-Game-Token": gameToken,
					},
					credentials: "include",
					keepalive: true,
					body: JSON.stringify({}),
				}).catch(() => {});
			}
		};

		// 1. Cubre cuando el usuario Cierra la Pestaña, el Navegador o F5
		window.addEventListener("pagehide", notifyOffline);

		// 2. Cubre cuando el usuario navega a otra URL
		return () => {
			window.removeEventListener("pagehide", notifyOffline);
			notifyOffline();
		};
	}, [roomId]);

	// -- 5. ESCUCHA DE SOCKETS --
	useGameSockets({ roomId });

	return {
		isConnecting,
	};
}
