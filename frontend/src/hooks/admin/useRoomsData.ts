// src/hooks/admin/useRoomsData.ts

import { useState, useCallback } from "react";
import api from "../../api/axios.ts";
import type { RoomRecord } from "../../types/api.ts";

export function useRoomsData() {
	const [rooms, setRooms] = useState<RoomRecord[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchRooms = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get("/rooms", { hideLoader: true } as any);
			setRooms(res.data);
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		rooms,
		loading,
		fetchRooms,
	};
}
