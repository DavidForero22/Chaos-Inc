// src/hooks/room/useRoomSockets.ts

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import echo from "../../echo";
import { logWithTime } from "../../utils/logger";
import api from "../../api/axios";

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

		logWithTime(
			"useRoomSockets.ts - Conectando al canal de presencia de la sala...",
		);

		const channel = echo.join(`room.${roomId}`);

		channel
			.here((users: any[]) => {
				logWithTime(
					`useRoomSockets.ts - Hay ${users.length} usuarios en la sala.`,
				);
			})
			.joining((user: any) => {
				logWithTime(`useRoomSockets.ts - ${user.username} se unió a la sala.`);
			})
			.leaving((user: any) => {
				logWithTime(`useRoomSockets.ts - ${user.username} abandonó la sala.`);
				api
					.post(`/rooms/${roomId}/report-lobby-disconnect`, {
						disconnected_player: user.username,
					})
					.catch(() => {});
				fetchRoomData();
			})
			.listen(".RoomStateUpdated", () => {
				logWithTime(
					"useRoomSockets.ts - Recibido 'RoomStateUpdated', recargando datos de sala...",
				);
				fetchRoomData();
			})
			.listen(".GameStarted", () => {
				navigate(`/game/${roomId}`, { state: { playerName: myPlayerName } });
			});

		return () => {
			channel.stopListening(".RoomStateUpdated");
			channel.stopListening(".GameStarted");
			echo.leave(`room.${roomId}`);
		};
	}, [roomId, isJoining, needsPassword, fetchRoomData, navigate, myPlayerName]);
}
