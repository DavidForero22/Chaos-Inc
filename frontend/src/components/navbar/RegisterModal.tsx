import { useState } from "react";
import api from "../../api/axios";
import { useAuthStore } from "../../store/useAuthStore";

interface RegisterModalProps {
	onClose: () => void;
}

export default function RegisterModal({ onClose }: RegisterModalProps) {
	const { setAuth } = useAuthStore();

	const [authForm, setAuthForm] = useState({
		username: "",
		email: "",
		password: "",
	});

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await api.post("/register", authForm);
			setAuth(res.data.user.username, res.data.token);
			onClose();
		} catch (error) {
			alert("Error al registrarse. Puede que el usuario o email ya existan.");
		}
	};

	return (
		<div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center p-4 z-50">
			<form
				onSubmit={handleRegister}
				className="bg-gray-800 p-6 rounded-lg max-w-sm w-full border border-gray-700"
			>
				<h2 className="text-xl font-bold mb-4 text-white">Crear Cuenta</h2>
				<input
					type="text"
					placeholder="Usuario"
					required
					className="w-full p-2 mb-3 bg-gray-900 border border-gray-600 rounded text-white"
					onChange={(e) =>
						setAuthForm({ ...authForm, username: e.target.value })
					}
				/>
				<input
					type="email"
					placeholder="Email"
					required
					className="w-full p-2 mb-3 bg-gray-900 border border-gray-600 rounded text-white"
					onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
				/>
				<input
					type="password"
					placeholder="Contraseña"
					required
					className="w-full p-2 mb-4 bg-gray-900 border border-gray-600 rounded text-white"
					onChange={(e) =>
						setAuthForm({ ...authForm, password: e.target.value })
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
						Registrar
					</button>
				</div>
			</form>
		</div>
	);
}
