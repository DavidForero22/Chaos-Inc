// src/hooks/room/useRoomSockets.ts
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import echo from "../../echo";
import api from "../../api/axios";
import { useRoomStore } from "../../store/useRoomStore";

interface UseRoomSocketsProps {
	roomId: string | undefined;
}

export function useRoomSockets({ roomId }: UseRoomSocketsProps) {
	const navigate = useNavigate();
	const { isJoining, needsPassword, hasToken, fetchRoomData } = useRoomStore();

	useEffect(() => {
		if (isJoining || needsPassword || !hasToken || !roomId) return;

		const channel = echo.join(`room.${roomId}`);

		channel
			.leaving((user: any) => {
				api.post(`/rooms/${roomId}/report-lobby-disconnect`, {
					disconnected_player: user.username,
				});
				fetchRoomData();
			})
			.listen(".RoomStateUpdated", () => fetchRoomData())
			.listen(".GameStarted", () => {
				navigate(`/game/${roomId}`);
			});

		return () => {
			echo.leave(`room.${roomId}`);
		};
	}, [roomId, isJoining, needsPassword, hasToken, fetchRoomData, navigate]);
}
