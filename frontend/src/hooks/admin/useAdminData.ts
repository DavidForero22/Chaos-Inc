import { useState, useCallback } from "react";
import api from "../../api/axios.ts";
import type { UserRecord, GameRecord, RoomRecord } from "../../types/types.ts";

export function useAdminData() {
	const [users, setUsers] = useState<UserRecord[]>([]);
	const [games, setGames] = useState<GameRecord[]>([]);
	const [rooms, setRooms] = useState<RoomRecord[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchAll = useCallback(async () => {
		setLoading(true);
		try {
			const [usersRes, gamesRes, roomsRes] = await Promise.all([
				api.get("/users"),
				api.get("/games"),
				api.get("/rooms"),
			]);
			setUsers(usersRes.data.data ?? usersRes.data);
			setGames(gamesRes.data.data ?? gamesRes.data);
			setRooms(roomsRes.data);
		} finally {
			setLoading(false);
		}
	}, []);

	const deleteUser = async (id: number) => {
		await api.delete(`/users/${id}`);
		setUsers((prev) => prev.filter((u) => u.id !== id));
	};

	const updateUser = async (
		id: number,
		data: { username: string; email: string; role: string },
	) => {
		await api.put(`/users/${id}`, data);
		setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
	};

	const createUser = async (data: {
		username: string;
		email: string;
		password: string;
		role: string;
	}) => {
		const res = await api.post("/users", data);
		setUsers((prev) => [...prev, res.data.data ?? res.data]);
	};

	return {
		users,
		games,
		rooms,
		loading,
		fetchAll,
		deleteUser,
		updateUser,
		createUser,
	};
}
