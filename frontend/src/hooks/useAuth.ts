// src/hooks/useAuth.ts

import { useState } from "react";
import api, { getCsrfCookie } from "../api/axios";
import { useAuthStore } from "../store/auth/useAuthStore.ts";

type RegisterInput = {
	username: string;
	email: string;
	password: string;
	confirmPassword: string;
};

type LoginInput = {
	login: string;
	password: string;
	remember?: boolean;
};

type UpdateProfileInput = {
	username?: string;
	email?: string;
	password?: string;
};

export function useAuth() {
	// Extraemos también provider y providerAvatar del store
	const { id, user, avatar, isGuest, role, setAuth, logout } = useAuthStore();
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
				res.data.user.id,
				res.data.user.username,
				res.data.user.avatar,
				false,
				res.data.user.role,
				res.data.user.provider,
				res.data.user.providerAvatar,
				res.data.user.achievements,
			);
			return true;
		} catch (err: any) {
			setError(err.response?.data?.message || "Credenciales incorrectas.");
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const uploadAvatar = async (file: File) => {
		if (!id) return false;

		clearError();
		setIsLoading(true);

		try {
			await getCsrfCookie();

			const formData = new FormData();
			formData.append("avatar", file);

			const res = await api.post(`/users/${id}/avatar`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			useAuthStore.getState().setAvatar?.(res.data.user.avatar);

			return true;
		} catch (err: any) {
			setError(err.response?.data?.message || "Error al subir el archivo.");
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const updateProfile = async (data: UpdateProfileInput) => {
		if (!id) return false;

		clearError();
		setIsLoading(true);

		try {
			await getCsrfCookie();
			const res = await api.put(`/users/${id}`, data);

			if (res.data.user && res.data.user.username !== user) {
				useAuthStore.setState({ user: res.data.user.username });
				if (typeof window !== "undefined") {
					localStorage.setItem("user", res.data.user.username);
				}
			}

			return true;
		} catch (err: any) {
			setError(err.response?.data?.message || "Error al actualizar el perfil.");
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		id,
		user,
		avatar,
		isGuest,
		role,
		isLoading,
		error,
		clearError,
		login,
		register,
		logout,
		uploadAvatar,
		updateProfile,
	};
}
