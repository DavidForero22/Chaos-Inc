// src/hooks/room/useRoom.ts

import { useAuth } from "../useAuth.ts";
import { useRoomSession } from "./useRoomSession.ts";
import { useRoomSockets } from "./useRoomSockets.ts";
import { useRoomStore } from "../../store/room/useRoomStore.ts";

export function useRoom(roomId: string | undefined) {
	const { user } = useAuth();

	// Iniciar la sesión (Join automático, redirects, etc.)
	const {
		room,
		isJoining,
		needsPassword,
		passwordError,
		attemptJoin,
		handleLeaveRoom,
	} = useRoomSession(roomId, user);

	// Extraer las acciones directamente de Zustand
	const startGame = useRoomStore((state) => state.startGame);
	const kickPlayer = useRoomStore((state) => state.kickPlayer);

	useRoomSockets({ roomId });

	return {
		room,
		user: user || "",
		isJoining,
		needsPassword,
		passwordError,
		attemptJoin,
		handleLeaveRoom,
		startGame,
		kickPlayer,
	};
}
