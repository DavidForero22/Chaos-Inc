// src/hooks/room/useRoomSession.ts

import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRoomStore } from "../../store/room/useRoomStore";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { useAuth } from "../useAuth";
import { logWithTime } from "../../utils/logger";

export function useRoomSession(
	roomId: string | undefined,
	myPlayerName: string | null,
) {
	const navigate = useNavigate();
	const location = useLocation();
	const { id: myPlayerId } = useAuth();

	const {
		room,
		isJoining,
		needsPassword,
		passwordError,
		setRoomId, 
		setIsJoining,
		attemptJoin,
		leaveRoom,
		fetchRoomData,
		resetRoomStore,
	} = useRoomStore();

	const initAttempted = useRef(false);

	// Inicializar y limpiar
	useEffect(() => {
		setRoomId(roomId || null);
		return () => {
			initAttempted.current = false;
		};
	}, [roomId, setRoomId, resetRoomStore]);

	// Intentar entrar automáticamente si tiene sesión iniciada
	useEffect(() => {
		if (!roomId || initAttempted.current) return;

		const initializeRoom = async () => {
			initAttempted.current = true;
			const store = useRoomStore.getState();

			// Si ya hay token, pedir los datos directamente.
			if (store.hasToken) {
				try {
					await fetchRoomData();
					setIsJoining(false);
					return;
				} catch (error) {
					logWithTime(
						"Token previo no válido para esta sala, intentando Join...",
						null,
						"warn",
					);
				}
			}

			// Si no hay token o falló la recuperación, hacer el Join tradicional
			if (myPlayerName) {
				try {
					await attemptJoin("", myPlayerName);
				} catch (err: any) {
					const type = err.response?.data?.type;
					const status = err.response?.status;
					const errorMsg =
						err.response?.data?.error || err.response?.data?.message;

					if (type === "ROOM_NOT_FOUND" || status === 404) {
						navigate("/room-not-found");
					} else if (type === "ROOM_FULL" || type === "GAME_ALREADY_STARTED") {
						alert(errorMsg || "Error al entrar a la sala.");
						navigate("/");
					} else if (type === "ALREADY_JOINED") {
						await fetchRoomData();
						setIsJoining(false);
					} else if (status === 401 || status === 403) {
						useAuthStore.getState().logout();
						alert(
							"Tu sesión ha expirado. Por favor, vuelve a introducir un nombre.",
						);
					} else {
						setIsJoining(false);
						console.error("Error no manejado al unirse:", err);
					}
				}
			} else {
				setIsJoining(false);
			}
		};

		initializeRoom();
	}, [
		myPlayerName,
		roomId,
		attemptJoin,
		fetchRoomData,
		navigate,
		setIsJoining,
	]);

	// Vigilante: si ya no está en la sala, salir sin llamar a /leave
	useEffect(() => {
		if (!room || !myPlayerId || isJoining || needsPassword) return;
		const stillInRoom =
			room.players?.some((player) => player.id === String(myPlayerId)) ?? true;

		if (!stillInRoom) {
			alert("Has sido expulsado de la sala.");
			localStorage.removeItem("game_token");
			resetRoomStore();
			navigate("/");
		}
	}, [room, myPlayerId, isJoining, needsPassword, navigate, resetRoomStore]);

	// Vigilante de redirección a partida
	useEffect(() => {
		if (room?.status === "in_game" && location.pathname.includes(`/rooms/`)) {
			navigate(`/game/${room.room_id}`, { replace: true });
		}
	}, [room?.status, room, navigate, location.pathname]);

	// Sync multi-pestaña (Logout)
	useEffect(() => {
		const handleStorage = (e: StorageEvent) => {
			if (e.key === "user" && e.newValue === null) {
				leaveRoom().then(() => navigate("/"));
			}
		};
		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, [leaveRoom, navigate]);

	return {
		room,
		isJoining,
		needsPassword,
		passwordError,
		attemptJoin: (pwd: string = "") => attemptJoin(pwd, myPlayerName || ""),
		handleLeaveRoom: async () => {
			await leaveRoom();
			navigate("/rooms");
		},
		fetchRoomData,
	};
}
