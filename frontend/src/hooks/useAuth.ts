// src/hooks/useAuth.ts

import { useState } from "react";
import api, { getCsrfCookie } from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

type RegisterInput = {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
};

type LoginInput = {
	login: string;
	password: string;
};

export function useAuth() {
	const { user, isGuest, role, setAuth, logout } = useAuthStore();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const clearError = () => setError("");

	const register = async (input: RegisterInput) => {
		clearError();

		if (input.password !== input.confirmPassword) {
			setError("Las contraseñas no coinciden.");
			return false;
		}

		setIsLoading(true);
		try {
			await getCsrfCookie();
			
			await api.post("/register", {
				username: input.username,
				email: input.email,
				password: input.password,
				password_confirmation: input.confirmPassword,
			});

			return true;
		} catch (err: any) {
			setError(err.response?.data?.message || "Error al registrar la cuenta.");
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const login = async (input: LoginInput) => {
		clearError();
		setIsLoading(true);

		try {
			await getCsrfCookie();

			const res = await api.post("/login", input);

			setAuth(
				res.data.user.username,
				false, // isGuest
				res.data.user.role,
			);
			return true;
		} catch (err: any) {
			setError(err.response?.data?.message || "Credenciales incorrectas.");
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		user,
		isGuest,
		role,
		isAuthenticated: !!user,
		isLoading,
		error,
		clearError,
		login,
		register,
		logout,
	};
}
