// src/hooks/game/useLiveGame.ts

import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.ts";

// -- HOOKS CUSTOM --
import { useGameSockets } from "./useGameSockets.ts";
import { usePlayerIdentity } from "../usePlayerIdentity.ts";

// -- UTILS & STORE --
import { logWithTime } from "../../utils/logger.ts";
import { useAuthStore } from "../../store/useAuthStore.ts";
import { useGameStore } from "../../store/useGameStore.ts";

export function useLiveGame(roomId: string | undefined) {
	const navigate = useNavigate();
	const { myPlayerName } = usePlayerIdentity();
	const { token } = useAuthStore();

	const isKickedRef = useRef(false);

	// -- EXTRAEMOS LO NECESARIO DEL STORE --
	const setRoomId = useGameStore((state) => state.setRoomId);
	const syncGameStore = useGameStore((state) => state.syncGame);
	const setIsConnecting = useGameStore((state) => state.setIsConnecting);
	const isConnecting = useGameStore((state) => state.isConnecting);
	const resetStore = useGameStore((state) => state.resetStore);

	// -- 1. INICIALIZAR EL ROOM ID Y LIMPIAR AL SALIR --
	useEffect(() => {
		setRoomId(roomId || null);
		return () => resetStore();
	}, [roomId, setRoomId, resetStore]);

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
			navigate("/");
		}
	}, [roomId, syncGameStore, navigate]);

	// -- 3. RECONEXIÓN INICIAL (JOIN) --
	useEffect(() => {
		const reconnect = async () => {
			if (!roomId || !myPlayerName || !token) return;

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
	}, [roomId, myPlayerName, token, handleSync, navigate, setIsConnecting]);

	// -- 4. MARCAR OFFLINE AL CERRAR PESTAÑA --
	useEffect(() => {
		const handleUnload = () => {
			if (isKickedRef.current) return;

			const sanctumToken = localStorage.getItem("token") || "";
			const gameToken = localStorage.getItem("game_token") || "";

			if (roomId && gameToken) {
				fetch(`${api.defaults.baseURL}/rooms/${roomId}/mark-offline`, {
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

		window.addEventListener("pagehide", handleUnload);
		return () => window.removeEventListener("pagehide", handleUnload);
	}, [roomId]);

	// -- 5. ESCUCHA DE SOCKETS --
	useGameSockets({ roomId });

	return {
		isConnecting,
	};
}
