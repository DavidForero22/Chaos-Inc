// src/hooks/room/useRoom.ts

import { usePlayerIdentity } from "../usePlayerIdentity.ts";
import { useRoomSession } from "./useRoomSession.ts";
import { useRoomSockets } from "./useRoomSockets.ts";
import { useRoomStore } from "../../store/useRoomStore.ts"; 

export function useRoom(roomId: string | undefined) {
	const { myPlayerName } = usePlayerIdentity();

	// Iniciar la sesión (Join automático, redirects, etc.)
	const {
		room,
		isJoining,
		needsPassword,
		passwordError,
		attemptJoin,
		handleLeaveRoom,
	} = useRoomSession(roomId, myPlayerName);

	// Extraer las acciones directamente de Zustand
	const startGame = useRoomStore((state) => state.startGame);
	const kickPlayer = useRoomStore((state) => state.kickPlayer);

	useRoomSockets({ roomId });

	return {
		room,
		myPlayerName: myPlayerName || "",
		isJoining,
		needsPassword,
		passwordError,
		attemptJoin,
		handleLeaveRoom,
		startGame,
		kickPlayer,
	};
}
