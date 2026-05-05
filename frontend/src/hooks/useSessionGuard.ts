import { useEffect, useRef } from "react";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

export function useSessionGuard() {
	const logout = useAuthStore((s) => s.logout);
	const setAuth = useAuthStore((s) => s.setAuth);

	// Usar una referencia para asegurar de que la petición a /me
	// solo se hace una vez al cargar la aplicación.
	const hasChecked = useRef(false);

	useEffect(() => {
		if (hasChecked.current) return;
		hasChecked.current = true;

		const verifySession = async () => {
			try {
				// Aquí Axios enviará automáticamente la cookie de Discord/Laravel
				const res = await api.get("/me", { hideLoader: true } as any);
				const me = res?.data?.user?.data ?? res?.data?.user;

				if (!me?.username) {
					logout();
					return;
				}

				// Usuario encontrado gracias a la cookie
				setAuth(
					me.id,
					me.username,
					me.avatar,
					Boolean(me.is_guest ?? me.isGuest),
					me.role ?? "user",
					me.provider,
					me.providerAvatar,
				);
			} catch (err: any) {
				const status = err?.response?.status;
				// Si da 401 o 419, significa que de verdad no hay sesión ni cookie.
				// Limpiar el localStorage por si había basura.
				if (status === 401 || status === 419) {
					logout();
				}
			}
		};

		verifySession();
	}, [logout, setAuth]);
}
