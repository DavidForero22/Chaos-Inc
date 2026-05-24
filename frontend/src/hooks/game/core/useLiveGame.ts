// src/hooks/game/useLiveGame.ts

import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios.ts";

// -- HOOKS CUSTOM --
import { useGameSockets } from "../network/useGameSockets.ts";
import { useAuth } from "../../auth/useAuth.ts";

// -- UTILS & STORE --
import { logWithTime } from "../../../utils/logger.ts";
import { useGameStore } from "../../../store/game/useGameStore.ts";
import { useGameUIStore } from "../../../store/game/useGameUIStore.ts";
import { useLoadingStore } from "../../../store/ui/useLoadingStore.ts";
import { useLeaveOnUnload } from "../network/useLeaveOnUnload.ts";
import { useRoomStore } from "../../../store/room/useRoomStore.ts";

export function useLiveGame(roomId: string | undefined) {
	const navigate = useNavigate();
	const { id: myId } = useAuth();

	const isKickedRef = useRef(false);

	// -- EXTRAER LO NECESARIO DEL STORE --
	const setRoomId = useRoomStore((state) => state.setRoomId);

	const syncGameStore = useGameStore((state) => state.syncGame);
	const setIsConnecting = useGameStore((state) => state.setIsConnecting);
	const isConnecting = useGameStore((state) => state.isConnecting);
	const resetRoomStore = useRoomStore((state) => state.resetRoomStore);

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
			resetRoomStore(!isGameOver);
		};
	}, [roomId, setRoomId, resetRoomStore]);

	// --- 1.5 LIMPIEZA DE UI AL CAMBIAR DE TURNO ---
	const previousTurnRef = useRef<string | null>(null);

	useEffect(() => {
		if (currentTurn !== previousTurnRef.current) {
			// Si el turno que acaba de terminar era el mío
			if (
				previousTurnRef.current === String(myId) &&
				currentTurn !== String(myId)
			) {
				logWithTime(
					"useLiveGame.ts - El turno ha pasado a otro jugador. Limpiando UI.",
				);
				// Limpiar las cartas que el usuario hubiera dejado seleccionadas
				clearDiscardSelection();
			}

			previousTurnRef.current = currentTurn ? String(currentTurn) : null;
		}
	}, [currentTurn, myId, clearDiscardSelection]);

	// -- 2. WRAPPER DE SINCRONIZACIÓN (Maneja las redirecciones) --
	const handleSync = useCallback(async () => {
		if (isKickedRef.current || !roomId) return;

		try {
			await syncGameStore();
		} catch (error: any) {
			if (isKickedRef.current) return;

			const status = error.response?.status;
			const errorType = error.response?.data?.type;

			// --- SOLUCIÓN AQUÍ ---
			if (errorType === "GAME_NOT_STARTED") {
				logWithTime(
					"useLiveGame.ts::handleSync() - La partida no está activa. Volviendo al Lobby...",
					null,
					"warn",
				);
				isKickedRef.current = true; // Evita bucles
				useLoadingStore.getState().stopLoading();
				navigate(`/rooms/${roomId}`, { replace: true }); // Redirigir a la sala de espera
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
			// Asegurar que tiene ID para intentar reconectar
			if (!roomId || !myId) return;

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
	}, [roomId, myId, handleSync, navigate, setIsConnecting]);

	// -- 4. AVISAR AL SERVIDOR AL CERRAR/NAVEGAR FUERA DE LA PARTIDA --
	useLeaveOnUnload(roomId, () => {
		return !isKickedRef.current && !useGameStore.getState().gameOver;
	});

	// -- 5. ESCUCHA DE SOCKETS --
	useGameSockets({ roomId });

	return {
		isConnecting,
	};
}
