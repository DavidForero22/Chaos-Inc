import { usePlayerIdentity } from "../usePlayerIdentity.ts";
import { useRoomSession } from "./useRoomSession.ts";
import { useRoomActions } from "./useRoomActions.ts";
import { useRoomSockets } from "./useRoomSockets.ts";

export function useRoom(roomId: string | undefined) {
	const { myPlayerName } = usePlayerIdentity();

	const {
		room,
		isJoining,
		needsPassword,
		passwordError,
		attemptJoin,
		handleLeaveRoom,
		fetchRoomData,
	} = useRoomSession({ roomId, myPlayerName });

	const { startGame, kickPlayer } = useRoomActions(roomId);

	useRoomSockets({
		roomId,
		isJoining,
		needsPassword,
		myPlayerName: myPlayerName || "",
		fetchRoomData,
	});

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
