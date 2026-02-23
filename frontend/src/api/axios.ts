import axios from "axios";
import { useAuthStore } from "../store/useAuthStore.ts";

const api = axios.create({
	baseURL: "http://localhost:8000/api/v1",
	withCredentials: true,
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use((config) => {
	// Token de Usuario (Sanctum)
	const token = useAuthStore.getState().token;
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}

	// Token de Partida (Game Token)
	// Buscamos si tenemos un token temporal para jugar en una sala
	const gameToken = sessionStorage.getItem("game_token");
	if (gameToken) {
		config.headers["X-Game-Token"] = gameToken;
	}

	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		console.error("Error en la API:", error.response?.status);
		// Si el token expira o nos echan, limpiar token
		if (error.response?.status === 401) {
			sessionStorage.removeItem("game_token");
		}
		return Promise.reject(error);
	},
);

export default api;
