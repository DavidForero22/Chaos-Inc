import { useState, useCallback } from "react";
import api from "../../api/axios.ts";
import type { UserRecord } from "../../types/user.ts";
import { useAdminUsersStore } from "../../store/admin/useAdminUsersStore.ts";

export function useUsersData() {
	const cache = useAdminUsersStore((state) => state.cache);
	const setCache = useAdminUsersStore((state) => state.setCache);
	const invalidateCache = useAdminUsersStore((state) => state.invalidateCache);

	const [users, setUsers] = useState<UserRecord[]>([]);
	const [loading, setLoading] = useState(true);

	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);

	const getUserById = async (id: number) => {
		const res = await api.get(`/users/${id}`, {
			hideLoader: true,
		} as any);
		return res.data.data ?? res.data;
	};

	const fetchUsers = useCallback(
		async (
			page: number = 1,
			search: string = "",
			role: string = "all",
			sortField: string = "username",
			sortDir: string = "asc",
			forceRefresh: boolean = false,
		) => {
			// Clave única para esta combinación de filtros
			const cacheKey = `${page}-${search}-${role}-${sortField}-${sortDir}`;
			const cachedData = cache[cacheKey];

			// Caché válida por 5 minutos (300,000 ms)
			const isCacheValid =
				cachedData && Date.now() - cachedData.timestamp < 300000;

			if (!forceRefresh && isCacheValid) {
				setUsers(cachedData.users);
				setTotalPages(cachedData.totalPages);
				setTotalCount(cachedData.totalCount);
				setLoading(false);
				return;
			}

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

				const newData = {
					users: res.data.data,
					totalPages: res.data.meta.last_page,
					totalCount: res.data.meta.total,
				};

				setUsers(newData.users);
				setTotalPages(newData.totalPages);
				setTotalCount(newData.totalCount);

				setCache(cacheKey, newData);
			} catch (error) {
				console.error("Error fetching users:", error);
			} finally {
				setLoading(false);
			}
		},
		[cache, setCache],
	);

	const generateTempPassword = async (id: number): Promise<string> => {
		const res = await api.post(`/users/${id}/temp-password`);
		invalidateCache();
		return res.data.temp_password;
	};

	const deleteUser = async (id: number) => {
		await api.delete(`/users/${id}`);
		setUsers((prev) => prev.filter((u) => u.id !== id));
		invalidateCache();
	};

	const updateUser = async (id: number, data: any) => {
		await api.put(`/users/${id}`, data);
		setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
		invalidateCache();
	};

	const createUser = async (data: {
		username: string;
		email: string;
		password: string;
		role: string;
	}) => {
		const res = await api.post("/users", data);
		setUsers((prev) => [...prev, res.data.data ?? res.data]);
		invalidateCache();
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
		getUserById,
		generateTempPassword,
	};
}
