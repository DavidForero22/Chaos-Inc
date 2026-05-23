// src/hooks/admin/useRoomsData.ts

import { useState, useCallback } from "react";
import api from "../../api/axios";

export interface RoomRecord {
	room_id: string;
	name: string;
	owner_id: string;
	owner_name: string;
	is_private: boolean;
	max_players: string;
	turn_timeout: string;
	is_debug: boolean;
	status: string;
	players: Array<{ id: string; name: string }>;
}

export function useRoomsData() {
	const [rooms, setRooms] = useState<RoomRecord[]>([]);
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
		// Refrescar lista después de borrar
		await fetchRooms();
	};

	return {
		rooms,
		loading,
		fetchRooms,
		deleteRoom,
	};
}
