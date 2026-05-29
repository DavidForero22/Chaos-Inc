// src/hooks/room/useRoomSession.ts

import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRoomStore } from "../../store/room/useRoomStore";
import { useAuthStore } from "../../store/auth/useAuthStore";
import { logWithTime } from "../../utils/logger";
import { useToastStore } from "../../store/ui/useToastStore";

export function useRoomSession(
	roomId: string | undefined,
	myPlayerName: string | null,
) {
	const navigate = useNavigate();
	const location = useLocation();
	const { showToast } = useToastStore();

	const {
		room,
		isJoining,
		needsPassword,
		passwordError,
		wasKicked,
		setRoomId,
		setIsJoining,
		setWasKicked,
		attemptJoin,
		leaveRoom,
		fetchRoomData,
		resetRoomStore,
	} = useRoomStore();

	const initAttempted = useRef(false);
	const prevRoomIdRef = useRef<string | undefined>(roomId);

	// Inicializar y limpiar
	useEffect(() => {
		setRoomId(roomId || null);
		prevRoomIdRef.current = roomId;
		return () => {
			initAttempted.current = false;
		};
	}, [roomId, setRoomId, resetRoomStore]);

	// --- FUNCIÓN CENTRALIZADA DE MANEJO DE ERRORES ---
	const handleJoinResponse = async (result: any) => {
		if (typeof result !== "object") {
			if (result === "ERROR") setIsJoining(false);
			return result;
		}

		const { type, message: errorMsg, status } = result;

		if (type === "ROOM_NOT_FOUND") {
			navigate("/room-not-found", { replace: true });
		} else if (type === "ROOM_FULL") {
			navigate("/room-full", { replace: true });
		} else if (type === "GAME_ALREADY_STARTED") {
			navigate("/game-already-started", { replace: true });
		} else if (type === "ALREADY_IN_ANOTHER_ROOM") {
			const match = errorMsg?.match(/Sala:\s*(\w+)/);
			const otherRoomId = match ? match[1] : "desconocida";
			navigate("/already-in-another-room", {
				replace: true,
				state: { roomId: otherRoomId },
			});
		} else if (type === "ALREADY_JOINED") {
			await fetchRoomData();
			setIsJoining(false);
		} else if (status === 401 || status === 403) {
			useAuthStore.getState().logout();
			navigate("/", { replace: true });
		} else {
			setIsJoining(false);
			console.error("Error no manejado al unirse:", result);
		}

		return result;
	};

	// Intentar entrar automáticamente si tiene sesión iniciada
	useEffect(() => {
		if (!roomId || initAttempted.current) return;

		const initializeRoom = async () => {
			initAttempted.current = true;
			const store = useRoomStore.getState();

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

			if (myPlayerName) {
				const result = await attemptJoin("", myPlayerName);
				await handleJoinResponse(result);
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

	// Vigilante de expulsión
	useEffect(() => {
		if (!wasKicked) return;

		showToast(
			"El líder de la sala te ha expulsado. Serás redirigido al menú principal.",
			"warn",
		);

		localStorage.removeItem("game_token");
		resetRoomStore();
		setWasKicked(false); 
		navigate("/rooms", { replace: true });
	}, [wasKicked, resetRoomStore, showToast, setWasKicked, navigate]);

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
		attemptJoin: async (pwd: string = "") => {
			const result = await attemptJoin(pwd, myPlayerName || "");
			return handleJoinResponse(result);
		},
		handleLeaveRoom: async () => {
			await leaveRoom();
			navigate("/rooms");
		},
		fetchRoomData,
	};
}
