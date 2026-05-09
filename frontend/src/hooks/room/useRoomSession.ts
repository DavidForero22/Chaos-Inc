// src/hooks/room/useRoomSession.ts

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRoomStore } from "../../store/useRoomStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useAuth } from "../useAuth";

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

	// Inicializar y limpiar
	useEffect(() => {
		setRoomId(roomId || null);
		return () => resetRoomStore();
	}, [roomId, setRoomId, resetRoomStore]);

	// Intentar entrar automáticamente si tiene sesion iniciada
	useEffect(() => {
		if (!roomId) return;

		if (myPlayerName) {
			attemptJoin("", myPlayerName).catch((err) => {
				const type = err.response?.data?.type;
				const status = err.response?.status;

				if (type === "ROOM_NOT_FOUND" || status === 404) {
					navigate("/room-not-found");
				} else if (type === "ROOM_FULL" || type === "GAME_ALREADY_STARTED") {
					alert(err.response?.data?.error || "Error al entrar");
					navigate("/");
				} else if (status === 401 || status === 403) {
					useAuthStore.getState().logout();
					alert(
						"Tu sesión ha expirado. Por favor, vuelve a introducir un nombre.",
					);
				}
			});
		} else {
			setIsJoining(false);
		}
	}, [myPlayerName, roomId, attemptJoin, navigate, setIsJoining]);

	// Vigilante: si ya no está en la sala, salir sin llamar a /leave
	useEffect(() => {
		if (!room || !myPlayerId || isJoining || needsPassword) return;
		// Validar estrictamente por ID en la lista de objetos
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
			navigate(`/game/${roomId}`, { replace: true });
		}
	}, [room?.status, roomId, navigate, location.pathname]);

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
			navigate("/");
		},
		fetchRoomData,
	};
}
