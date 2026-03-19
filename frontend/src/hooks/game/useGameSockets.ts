// src/hooks/game/useGameSockets.ts

import { useEffect } from "react";
import echo from "../../echo";
import { logWithTime } from "../../utils/logger";

interface UseGameSocketsProps {
	roomId: string | undefined;
	refreshGameData: () => void;
}

export function useGameSockets({
	roomId,
	refreshGameData,
}: UseGameSocketsProps) {
	useEffect(() => {
		if (!roomId) return;

		// Canal público de sala — cambios de estado generales
		const roomChannel = echo.channel(`room.${roomId}`);
		roomChannel.listen(".RoomStateUpdated", () => {
			logWithTime(
				"useGameSockets.ts - El estado de la sala ha cambiado, recargando...",
			);
			refreshGameData();
		});

		return () => {
			roomChannel.stopListening(".RoomStateUpdated");
			echo.leaveChannel(`room.${roomId}`);
		};
	}, [roomId, refreshGameData]);
}
