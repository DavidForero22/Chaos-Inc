// src/api/axios.ts

import axios from "axios";

import { useAuthStore } from "../store/useAuthStore.ts";
import { useLoadingStore } from "../store/useLoadingStore.ts";
import { logWithTime } from "../utils/logger.ts";

const api = axios.create({
	baseURL: "http://localhost:8000/api/v1",
	withCredentials: true,
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use((config) => {
	// Solo encender el loader si no se pide explícitamente ocultarlo
	if (!(config as any).hideLoader) {
		useLoadingStore.getState().startLoading();
	}

	// Token de Usuario (Sanctum)
	const token = useAuthStore.getState().token;
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	// Token de Partida (Game Token)
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
		const isAuthRoute =
			url.includes("/login") ||
			url.includes("/register") ||
			url.includes("/guest");

		if (status === 401 && !isAuthRoute) {
			// Si es un 401 de una ruta exclusiva de sala, solo borar el game_token
			if (
				url.includes("/sync") ||
				url.includes("/leave") ||
				url.includes("/report-disconnect")
			) {
				localStorage.removeItem("game_token");
				logWithTime(
					"[Sala] Sesión de juego caducada. Limpiando game_token...",
					null,
					"warn",
				);
				return Promise.resolve({ data: null });
			}

			// Usuario no existe.
			logWithTime(
				"[Auth] Usuario invitado purgado o token inválido. Limpiando sesión...",
				null,
				"warn",
			);

			localStorage.removeItem("game_token");
			useAuthStore.getState().logout();

			if (window.location.pathname !== "/") {
				window.location.href = "/";
			}

			return Promise.resolve({ data: null });
		}

		// Error general
		logWithTime("Error en la API", error.response, "error");

		return Promise.reject(error);
	},
);

export default api;
