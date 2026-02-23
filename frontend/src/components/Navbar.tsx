import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore.ts";

export default function Navbar() {
	const { user, setAuth, logout } = useAuthStore();

	const [showLogin, setShowLogin] = useState(false);
	const [showRegister, setShowRegister] = useState(false);

	const [authForm, setAuthForm] = useState({
		username: "",
		email: "",
		password: "",
	});

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await api.post("/login", {
				email: authForm.email,
				password: authForm.password,
			});
			setAuth(res.data.user.username, res.data.token);
			setShowLogin(false);
		} catch (error) {
			alert("Error al iniciar sesión. Revisa tus credenciales.");
		}
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const res = await api.post("/register", authForm);
			setAuth(res.data.user.username, res.data.token);
			setShowRegister(false);
		} catch (error) {
			alert("Error al registrarse.");
		}
	};

	return (
		<>
			<nav className="px-6 py-4 bg-gray-800 flex justify-between items-center border-b border-gray-700 shadow-sm">
				<div className="flex gap-6 items-center">
					<span className="text-xl font-bold text-white tracking-wider mr-4">
						CHAOS INC.
					</span>
					<Link
						to="/"
						className="text-gray-400 hover:text-white transition text-sm font-medium"
					>
						Salas
					</Link>
					<Link
						to="/logs"
						className="text-gray-400 hover:text-white transition text-sm font-medium"
					>
						Logs
					</Link>
				</div>

				<div className="flex gap-4 items-center">
					{user ? (
						<>
							<span className="text-sm text-gray-400">
								Jugador: <strong className="text-blue-400">{user}</strong>
							</span>
							<button
								onClick={logout}
								className="text-sm px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
							>
								Salir
							</button>
						</>
					) : (
						<>
							<button
								onClick={() => setShowLogin(true)}
								className="text-sm px-4 py-1.5 text-gray-400 hover:text-white transition"
							>
								Iniciar Sesión
							</button>
							<button
								onClick={() => setShowRegister(true)}
								className="text-sm px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition shadow-lg"
							>
								Registrarse
							</button>
						</>
					)}
				</div>
			</nav>

			{/* MODAL DE LOGIN */}
			{showLogin && (
				<div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center p-4 z-50">
					<form
						onSubmit={handleLogin}
						className="bg-gray-800 p-6 rounded-lg max-w-sm w-full border border-gray-700"
					>
						<h2 className="text-xl font-bold mb-4 text-white">
							Iniciar Sesión
						</h2>
						<input
							type="email"
							placeholder="Email"
							required
							className="w-full p-2 mb-3 bg-gray-900 border border-gray-600 rounded text-white"
							onChange={(e) =>
								setAuthForm({ ...authForm, email: e.target.value })
							}
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
								onClick={() => setShowLogin(false)}
								className="px-4 py-2 text-gray-400"
							>
								Cancelar
							</button>
							<button
								type="submit"
								className="px-4 py-2 bg-blue-600 rounded text-white font-bold"
							>
								Entrar
							</button>
						</div>
					</form>
				</div>
			)}

			{/* MODAL DE REGISTRO */}
			{showRegister && (
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
							onChange={(e) =>
								setAuthForm({ ...authForm, email: e.target.value })
							}
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
								onClick={() => setShowRegister(false)}
								className="px-4 py-2 text-gray-400"
							>
								Cancelar
							</button>
							<button
								type="submit"
								className="px-4 py-2 bg-blue-600 rounded text-white font-bold"
							>
								Registrar
							</button>
						</div>
					</form>
				</div>
			)}
		</>
	);
}
