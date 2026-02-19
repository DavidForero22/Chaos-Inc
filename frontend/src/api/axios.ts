import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true, // ¡CRUCIAL PARA SANCTUM! Permite enviar cookies de sesión
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// Aquí irán tus interceptores para manejar errores (ej. si el token caduca) en el futuro
api.interceptors.response.use(
    response => response,
    error => {
        console.error("Error en la API:", error.response?.status);
        return Promise.reject(error);
    }
);

export default api;