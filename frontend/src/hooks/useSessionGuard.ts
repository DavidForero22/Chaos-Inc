import { useEffect, useRef } from "react";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

export function useSessionGuard() {
	const logout = useAuthStore((s) => s.logout);
	const setAuth = useAuthStore((s) => s.setAuth);

	const hasChecked = useRef(false);

	useEffect(() => {
		if (hasChecked.current) return;
		hasChecked.current = true;

		const verifySession = async () => {
			// Comprobar si hay sesión en localStorage
			const hasLocalSession = localStorage.getItem("user") !== null;

			// Comprobar si viene de un login social (ej. Discord)
			const urlParams = new URLSearchParams(window.location.search);
			const isSocialCallback = urlParams.get("login") === "success";

			// Si no hay rastro local Y tampoco viene del login social, cortar de raíz
			if (!hasLocalSession && !isSocialCallback) {
				logout(); // Aseguramos que el store de Zustand esté limpio
				return;
			}

			// Si viene de un login social, limpiar la URL para que no quede el parámetro feo
			if (isSocialCallback) {
				window.history.replaceState(
					{},
					document.title,
					window.location.pathname,
				);
			}

			try {
				// Hacer la llamada al backend. Axios enviará la cookie automáticamente.
				const res = await api.get("/me", { hideLoader: true } as any);
				const me = res?.data?.user?.data ?? res?.data?.user;

				if (!me?.username) {
					logout();
					return;
				}

				setAuth(
					me.id,
					me.username,
					me.avatar,
					Boolean(me.is_guest ?? me.isGuest),
					me.role ?? "user",
					me.provider,
					me.providerAvatar,
					me.joinedAt,
				);
			} catch (err: any) {
				const status = err?.response?.status;
				// Si la cookie expiró o algo falló, limpiar y cerrar
				if (status === 401 || status === 419) {
					logout();
				}
			}
		};

		verifySession();
	}, [logout, setAuth]);
}
