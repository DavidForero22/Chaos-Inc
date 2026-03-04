import { useState } from "react";
import api from "../../api/axios";
import { useAuthStore } from "../../store/useAuthStore";

interface GuestNameModalProps {
	onClose: () => void;
	onSuccess: () => void;
}

export default function GuestNameModal({
	onClose,
	onSuccess,
}: GuestNameModalProps) {
	const { setAuth } = useAuthStore();
	const [username, setUsername] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim()) return;

		setLoading(true);
		setError("");

		try {
			// Llamamos al nuevo endpoint que creamos en Laravel
			const res = await api.post("/guest-login", { username });

			// Guardamos el token real que nos da el backend
			// El tercer parámetro 'true' marca que es un invitado
			setAuth(res.data.user.username, res.data.token, true);

			onSuccess();
		} catch (err) {
			console.error(err);
			setError("Error al conectar con el servidor.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center p-4 z-50">
			<div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full border border-gray-700 shadow-2xl">
				<h2 className="text-xl font-bold mb-2 text-white">¿Cómo te llamas?</h2>
				<p className="text-gray-400 text-sm mb-4">
					Elige un nombre para unirte a la partida como invitado.
				</p>

				<form onSubmit={handleSubmit}>
					<input
						type="text"
						placeholder="Tu Nickname"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="w-full p-3 mb-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-blue-500 outline-none transition"
						autoFocus
						maxLength={15}
					/>

					{error && <p className="text-red-400 text-sm mb-2">{error}</p>}

					<div className="flex justify-end gap-2 mt-4">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-gray-400 hover:text-white transition"
							disabled={loading}
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={loading || !username.trim()}
							className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						>
							{loading ? (
								<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : (
								"Jugar"
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
