import { useState, useCallback } from "react";
import api from "../../api/axios";
import type { RoomData } from "../../types/api"; 

export function useRoomsData() {
	const [rooms, setRooms] = useState<RoomData[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchRooms = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get("/rooms", { hideLoader: true } as any);
			setRooms(res.data);
		} catch (error) {
			console.error("Error fetching rooms:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	const deleteRoom = async (roomId: string) => {
		await api.delete(`/rooms/${roomId}`);
		await fetchRooms();
	};

	return {
		rooms,
		loading,
		fetchRooms,
		deleteRoom,
	};
}
