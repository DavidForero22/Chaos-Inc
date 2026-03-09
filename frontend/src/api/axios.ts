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
	// Buscar si tiene un token temporal para jugar en una sala
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
		// Si el token expira o nos echan, limpiar token
		if (error.response?.status === 401) {
			const url = error.config?.url ?? "";
			if (url.includes("/sync") || url.includes("/leave")) {
				localStorage.removeItem("game_token");
			}
		}
		return Promise.reject(error);
	},
);

export default api;
