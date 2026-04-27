// src/api/axios.ts

import axios from "axios";

import { useAuthStore } from "../store/useAuthStore.ts";
import { useLoadingStore } from "../store/useLoadingStore.ts";
import { logWithTime } from "../utils/logger.ts";

const api = axios.create({
	baseURL: "http://localhost:8000/api/v1",
	withCredentials: true,
	withXSRFToken: true,
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
	},
});

/**
 * Pide el token CSRF antes de autenticar
 */
export const getCsrfCookie = async () => {
	// La ruta de sanctum suele estar en la raíz de la API (fuera de v1), por eso usamos una URL absoluta
	await axios.get("http://localhost:8000/sanctum/csrf-cookie", {
		withCredentials: true,
		withXSRFToken: true,
	});
};

api.interceptors.request.use((config) => {
	if (!(config as any).hideLoader) {
		useLoadingStore.getState().startLoading();
	}

	const gameToken = localStorage.getItem("game_token");
	if (gameToken) {
		config.headers["X-Game-Token"] = gameToken;
	}

	return config;
});

api.interceptors.response.use(
	(response) => {
		// Apagar el loader solo si NO estaba oculto
		if (!(response.config as any).hideLoader) {
			useLoadingStore.getState().stopLoading();
		}
		return response;
	},
	(error) => {
		// Apagar el loader si falla, igual respetando el hideLoader
		if (error.config && !(error.config as any).hideLoader) {
			useLoadingStore.getState().stopLoading();
		}

		const status = error.response?.status;
		const url = error.config?.url ?? "";

		// ─── MANEJO DE RATE LIMIT (TOO MANY REQUESTS) ───
		if (status === 429) {
			logWithTime(
				"[Rate Limit] Se ha superado el límite de peticiones (429).",
				null,
				"warn",
			);
			alert("¡Vas muy rápido! Por favor, espera un momento.");
			return Promise.reject(error);
		}

		// 419 Page Expired (CSRF Mismatch): Significa que la cookie caducó o el servidor se reinició
		// Tratar igual que un 401 (Unauthorized)
		if (status === 401 || status === 419) {
			const isAuthRoute =
				url.includes("/login") ||
				url.includes("/register") ||
				url.includes("/guest");

			if (!isAuthRoute) {
				// Si es un error de sala, solo borrar el game_token
				if (
					url.includes("/sync") ||
					url.includes("/leave") ||
					url.includes("/report-disconnect") ||
					url.includes("/join") ||
					url.includes("/broadcasting/auth")
				) {
					localStorage.removeItem("game_token");
					logWithTime(
						"[Sala] Sesión de juego caducada. Limpiando game_token...",
						null,
						"warn",
					);
					return Promise.resolve({ data: null });
				}

				logWithTime(
					"[Auth] Sesión caducada o CSRF inválido. Limpiando sesión local...",
					null,
					"warn",
				);

				localStorage.removeItem("game_token");
				useAuthStore.getState().logout();

				// if (window.location.pathname !== "/") {
				//  window.location.href = "/";
				// }

				return Promise.resolve({ data: null });
			}
		}

		// Error general
		logWithTime("Error en la API", error.response, "error");

		return Promise.reject(error);
	},
);

export default api;
