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
	// Encender el loader
	useLoadingStore.getState().startLoading();

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
		// Apagar el loader si la petición fue exitosa
		useLoadingStore.getState().stopLoading();
		return response;
	},
	(error) => {
		useLoadingStore.getState().stopLoading();

		const status = error.response?.status;
		const url = error.config?.url ?? "";

		// Usuario borrado de la base de datos
		if (status === 401 && url.includes("/me")) {
			logWithTime(
				"[Auth] Usuario invitado purgado o no encontrado. Limpiando sesión...",
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

		// Token de sala caducado
		if (status === 401 && (url.includes("/sync") || url.includes("/leave"))) {
			localStorage.removeItem("game_token");
			logWithTime(
				"[Room] Sesión de juego caducada. Limpiando game_token de localStorage...",
				null,
				"warn",
			);
			return Promise.resolve({ data: null });
		}

		// Error general
		logWithTime("Error en la API", error, "error");

		return Promise.reject(error);
	},
);

export default api;
