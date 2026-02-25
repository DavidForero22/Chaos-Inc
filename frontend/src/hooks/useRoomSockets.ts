import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import echo from "../echo";

interface UseRoomSocketsProps {
	roomId: string | undefined;
	isJoining: boolean;
	needsPassword: boolean;
	myPlayerName: string;
	fetchRoomData: () => void;
}

export function useRoomSockets({
	roomId,
	isJoining,
	needsPassword,
	myPlayerName,
	fetchRoomData,
}: UseRoomSocketsProps) {
	const navigate = useNavigate();

	useEffect(() => {
		if (isJoining || needsPassword || !roomId) return;

		console.log("Estado de sala actualizado.")
		const channel = echo.channel(`room.${roomId}`);

		channel.listen(".RoomListUpdated", fetchRoomData);

		channel.listen(".GameStarted", () => {
			navigate(`/game/${roomId}`, { state: { playerName: myPlayerName } });
		});

		return () => {
			channel.stopListening(".RoomListUpdated");
			channel.stopListening(".GameStarted");
			echo.leaveChannel(`room.${roomId}`);
		};
	}, [roomId, isJoining, needsPassword, fetchRoomData, navigate, myPlayerName]);
}
