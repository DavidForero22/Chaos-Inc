// src/hooks/room/useRoom.ts

import { usePlayerIdentity } from "../usePlayerIdentity.ts";
import { useRoomSession } from "./useRoomSession.ts";
import { useRoomSockets } from "./useRoomSockets.ts";
import { useRoomStore } from "../../store/useRoomStore.ts"; // <-- Importamos el store

export function useRoom(roomId: string | undefined) {
	const { myPlayerName } = usePlayerIdentity();

	// 1. Iniciamos la sesión (Join automático, redirects, etc.)
	const {
		room,
		isJoining,
		needsPassword,
		passwordError,
		attemptJoin,
		handleLeaveRoom,
	} = useRoomSession(roomId, myPlayerName);

	// 2. Extraemos las acciones directamente de Zustand
	const startGame = useRoomStore((state) => state.startGame);
	const kickPlayer = useRoomStore((state) => state.kickPlayer);

	// 3. Iniciamos los Sockets (ahora solo necesitan el roomId)
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
