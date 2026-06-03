// src/hooks/useLobbySockets.ts
import { useEffect, useRef } from "react";
import echo from "../../echo";

interface UseLobbySocketProps {
	onRoomListUpdated: () => void;
}

export function useLobbySocket({ onRoomListUpdated }: UseLobbySocketProps) {
	// Guardar el callback en una ref para no tener que desuscribirnos y volver a suscribirnos cada vez que cambie la función
	const callbackRef = useRef(onRoomListUpdated);
	useEffect(() => {
		callbackRef.current = onRoomListUpdated;
	}, [onRoomListUpdated]);

	useEffect(() => {
		const channel = echo.channel("lobby");

		const handler = () => {
			callbackRef.current();
		};

		channel.listen(".RoomListUpdated", handler);

		return () => {
			channel.stopListening(".RoomListUpdated", handler);
			echo.leaveChannel("lobby");
		};
	}, []);
}
