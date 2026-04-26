// src/hooks/admin/useUsersData.ts

import { useState, useCallback } from "react";
import api from "../../api/axios.ts";
import type { UserRecord } from "../../types/api.ts";

export function useUsersData() {
	const [users, setUsers] = useState<UserRecord[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			const res = await api.get("/users", { hideLoader: true } as any);
			setUsers(res.data.data ?? res.data);
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
		loading,
		fetchUsers,
		deleteUser,
		updateUser,
		createUser,
	};
}
