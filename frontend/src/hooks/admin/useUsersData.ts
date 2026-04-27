// src/hooks/admin/useUsersData.ts

import { useState, useCallback } from "react";
import api from "../../api/axios.ts";
import type { UserRecord } from "../../types/api.ts";

export function useUsersData() {
	const [users, setUsers] = useState<UserRecord[]>([]);
	const [loading, setLoading] = useState(true);

	// Paginación del backend
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);

	const fetchUsers = useCallback(
		async (
			page: number = 1,
			search: string = "",
			role: string = "all",
			sortField: string = "username",
			sortDir: string = "asc",
		) => {
			setLoading(true);
			try {
				const params = new URLSearchParams({
					page: page.toString(),
					search: search,
					role: role,
					sortField: sortField,
					sortDir: sortDir,
				});

				const res = await api.get(`/users?${params.toString()}`, {
					hideLoader: true,
				} as any);
				console.log(res)

				setUsers(res.data.data);
				setTotalPages(res.data.meta.last_page);
				setTotalCount(res.data.meta.total);
			} catch (error) {
				console.error("Error fetching users:", error);
			} finally {
				setLoading(false);
			}
		},
		[],
	);

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
		totalPages,
		totalCount,
		deleteUser,
		updateUser,
		createUser,
	};
}
