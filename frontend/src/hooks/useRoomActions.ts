import { useCallback } from "react";
import api from "../api/axios";

export function useRoomActions(roomId: string | undefined) {
	const startGame = useCallback(async () => {
		if (!roomId) return;
		try {
			await api.post(`/rooms/${roomId}/start`);
		} catch (error: any) {
			alert(error.response?.data?.error || "Error starting the game.");
		}
	}, [roomId]);

	const kickPlayer = useCallback(
		async (playerToKick: string) => {
			if (!roomId) return;
			try {
				await api.post(`/rooms/${roomId}/kick`, {
					player_to_kick: playerToKick,
				});
			} catch (error: any) {
				alert(
					error.response?.data?.error || "The player could not be sent off.",
				);
			}
		},
		[roomId],
	);

	return { startGame, kickPlayer };
}
