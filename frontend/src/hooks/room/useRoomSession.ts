// src/hooks/room/useRoomSession.ts
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRoomStore } from "../../store/useRoomStore";
// import { logWithTime } from "../../utils/logger";

export function useRoomSession(
	roomId: string | undefined,
	myPlayerName: string | null,
) {
	const navigate = useNavigate();
	const location = useLocation();

	const {
		room,
		isJoining,
		needsPassword,
		passwordError,
		setRoomId,
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

	// Intentar entrar automáticamente si tenemos nombre
	useEffect(() => {
		if (myPlayerName && roomId) {
			attemptJoin("", myPlayerName).catch((err) => {
				const type = err.response?.data?.type;
				if (type === "ROOM_NOT_FOUND" || err.response?.status === 404)
					navigate("/room-not-found");
				else if (type === "ROOM_FULL" || type === "GAME_ALREADY_STARTED") {
					alert(err.response?.data?.error || "Error al entrar");
					navigate("/");
				}
			});
		}
	}, [myPlayerName, roomId, attemptJoin, navigate]);

	// Vigilante: si ya no está en la sala, salir sin llamar a /leave
	useEffect(() => {
		console.log(
			"[Vigilante] room:",
			room?.players,
			"myPlayerName:",
			myPlayerName,
			"isJoining:",
			isJoining,
			"needsPassword:",
			needsPassword,
		);
		if (!room || !myPlayerName || isJoining || needsPassword) return;
		const stillInRoom = room.players?.includes(myPlayerName) ?? true;
		console.log("[Vigilante] stillInRoom:", stillInRoom);
		if (!stillInRoom) {
			// logWithTime(
			// 	"[Vigilante] ⚠️ Jugador no encontrado en sala, redirigiendo...",
			// );
			alert("Has sido expulsado de la sala.");
			localStorage.removeItem("game_token");
			resetRoomStore();
			navigate("/");
		}
	}, [room, myPlayerName, isJoining, needsPassword, navigate, resetRoomStore]);

	// Vigilante de redirección a partida
	useEffect(() => {
		if (room?.status === "in_game" && location.pathname.includes(`/room/`)) {
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
