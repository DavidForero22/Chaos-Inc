// src/hooks/room/useRoomSockets.ts
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import echo from "../../echo";
import { useRoomStore } from "../../store/room/useRoomStore.ts";
import { useAuthStore } from "../../store/auth/useAuthStore.ts";
import api from "../../api/axios.ts";

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
				fetchRoomData();
				
				if (user && user.id) {
					api
						.post(`/rooms/${roomId}/report-disconnect`, {
							disconnected_player_id: user.id,
							disconnected_player_name:
								user.username || user.name || "Invitado",
						})
						.catch(() => {});
				}
			})
			.listen(".RoomStateUpdated", (event: any) => {
				const myPlayerId = useAuthStore.getState().id;

				// Comprobar si el evento trae un expulsado y si eres tu
				if (
					event.kicked_player_id &&
					String(event.kicked_player_id) === String(myPlayerId)
				) {
					useRoomStore.getState().setWasKicked(true);
				} else {
					fetchRoomData();
				}
			})
			.listen(".GameStarted", () => {
				navigate(`/game/${roomId}`);
			});

		return () => {
			echo.leave(`room.${roomId}`);
		};
	}, [roomId, isJoining, needsPassword, hasToken, fetchRoomData, navigate]);
}
