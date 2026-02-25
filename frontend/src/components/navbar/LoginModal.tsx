import { useState } from "react";
import api from "../../api/axios";
import { useAuthStore } from "../../store/useAuthStore";

interface LoginModalProps {
	onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
	const { setAuth } = useAuthStore();

	// Cambiamos el estado para usar un identificador único (login)
	const [credentials, setCredentials] = useState({
		login: "",
		password: "",
	});

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			// Enviamos "login" en lugar de "email" para que el backend busque por ambos
			const res = await api.post("/login", credentials);
			setAuth(res.data.user.username, res.data.token);
			onClose(); // Cerramos el modal tras el éxito
		} catch (error) {
			alert("Error al iniciar sesión. Revisa tus credenciales.");
		}
	};

	return (
		<div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center p-4 z-50">
			<form
				onSubmit={handleLogin}
				className="bg-gray-800 p-6 rounded-lg max-w-sm w-full border border-gray-700"
			>
				<h2 className="text-xl font-bold mb-4 text-white">Iniciar Sesión</h2>
				<input
					type="text"
					placeholder="Usuario o Correo electrónico"
					required
					className="w-full p-2 mb-3 bg-gray-900 border border-gray-600 rounded text-white"
					onChange={(e) =>
						setCredentials({ ...credentials, login: e.target.value })
					}
				/>
				<input
					type="password"
					placeholder="Contraseña"
					required
					className="w-full p-2 mb-4 bg-gray-900 border border-gray-600 rounded text-white"
					onChange={(e) =>
						setCredentials({ ...credentials, password: e.target.value })
					}
				/>
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-gray-400 hover:text-white"
					>
						Cancelar
					</button>
					<button
						type="submit"
						className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition"
					>
						Entrar
					</button>
				</div>
			</form>
		</div>
	);
}
