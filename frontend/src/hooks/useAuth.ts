import { useState } from "react";
import api from "../api/axios";
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
	const { user, token, isGuest, role, setAuth, logout } = useAuthStore();
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
			const res = await api.post("/register", {
				username: input.username,
				email: input.email,
				password: input.password,
				password_confirmation: input.confirmPassword,
			});

			setAuth(
				res.data.user.username,
				res.data.token,
				false,
				res.data.user.role,
			);
			return true;
		} catch (err: any) {
			setError(err.response.message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const login = async (input: LoginInput) => {
		clearError();
		setIsLoading(true);

		try {
			const res = await api.post("/login", input);
			setAuth(
				res.data.user.username,
				res.data.token,
				false,
				res.data.user.role,
			);
			return true;
		} catch (err: any) {
			setError(err.response.message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		user,
		token,
		isGuest,
		role,
		isAuthenticated: !!token,
		isLoading,
		error,
		clearError,
		login,
		register,
		logout,
	};
}
