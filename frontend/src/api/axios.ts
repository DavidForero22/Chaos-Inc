// src/api/axios.ts

import axios from "axios";
import { useAuthStore } from "../store/useAuthStore.ts";
import { useLoadingStore } from "../store/useLoadingStore.ts";

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
		console.error("Error en la API:", error);

		const status = error.response?.status;
		const errorType = error.response?.data?.type;
		const url = error.config?.url ?? "";

		// Limpiar token temporal de partida si caduca o es expulsado
		if (status === 401 && (url.includes("/sync") || url.includes("/leave"))) {
			localStorage.removeItem("game_token");
		}

		// Si Sanctum rechaza el token inicial en /me O si el backend lanza USER_NOT_FOUND
		if (
			(status === 401 && url.includes("/me")) ||
			errorType === "USER_NOT_FOUND"
		) {
			console.warn(
				"Identidad no válida o usuario expirado. Limpiando sesión silenciosamente...",
			);
			localStorage.removeItem("game_token");
			useAuthStore.getState().logout();
		}

		return Promise.reject(error);
	},
);

export default api;
