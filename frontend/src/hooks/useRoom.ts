import { usePlayerIdentity } from "./usePlayerIdentity";
import { useRoomSession } from "./useRoomSession";
import { useRoomActions } from "./useRoomActions";
import { useRoomSockets } from "./useRoomSockets";

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
