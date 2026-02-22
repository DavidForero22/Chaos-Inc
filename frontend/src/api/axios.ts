import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const api = axios.create({
	baseURL: "http://localhost:8000/api/v1",
	withCredentials: true, // ¡CRUCIAL PARA SANCTUM! Permite enviar cookies de sesión
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
	},
});

// Interceptor: Si hay token, lo metemos en la mochila antes de enviar la petición
api.interceptors.request.use((config) => {
	const token = useAuthStore.getState().token;
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Aquí irán tus interceptores para manejar errores (ej. si el token caduca) en el futuro
api.interceptors.response.use(
	(response) => response,
	(error) => {
		console.error("Error en la API:", error.response?.status);
		return Promise.reject(error);
	},
);

export default api;
