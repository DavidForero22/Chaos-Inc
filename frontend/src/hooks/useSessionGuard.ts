import { useEffect } from "react";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

export function useSessionGuard() {
	const user = useAuthStore((s) => s.user);
	const logout = useAuthStore((s) => s.logout);
	const setAuth = useAuthStore((s) => s.setAuth);

	useEffect(() => {
		let active = true;

		const verifySession = async () => {
			if (!user) return;

			try {
				const res = await api.get("/me", { hideLoader: true } as any);
				const me = res?.data?.user?.data ?? res?.data?.user;
				if (!me?.username) {
					logout();
					return;
				}

				if (active) {
					setAuth(
						me.id,
						me.username,
						me.isGuest,
						me.role ?? "user",
					);
				}
			} catch (err: any) {
				const status = err?.response?.status;
				if (status === 401 || status === 419) logout();
			}
		};

		verifySession();

		return () => {
			active = false;
		};
	}, [user, logout, setAuth]);
}
