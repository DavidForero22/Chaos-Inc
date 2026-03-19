// src/hooks/room/useRoomSockets.ts

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import echo from "../../echo";
import { logWithTime } from "../../utils/logger";

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

		logWithTime("useRoomSockets.ts - Estado de sala actualizado.")
		const channel = echo.channel(`room.${roomId}`);

		channel.listen(".RoomStateUpdated", () => {
            logWithTime("useRoomSockets.ts - Alguien entró/salió en RoomStateUpdated, recargando datos...");
            fetchRoomData();
        });

		channel.listen(".GameStarted", () => {
			navigate(`/game/${roomId}`, { state: { playerName: myPlayerName } });
		});

		return () => {
			channel.stopListening(".RoomStateUpdated");
			channel.stopListening(".GameStarted");
			echo.leaveChannel(`room.${roomId}`);
		};
	}, [roomId, isJoining, needsPassword, fetchRoomData, navigate, myPlayerName]);
}
