import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore.ts";
import LoginModal from "./LoginModal.tsx";
import RegisterModal from "./RegisterModal.tsx";

export default function Navbar() {
	const { user, isGuest } = useAuthStore();

	const [showLogin, setShowLogin] = useState(false);
	const [showRegister, setShowRegister] = useState(false);

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
						isGuest ? (
							<div className="flex gap-3 items-center">
								<span className="text-sm text-gray-500">
									👤 <span className="text-gray-400">{user}</span>
									<span className="text-xs text-gray-600 ml-1">(invitado)</span>
								</span>
								<button
									onClick={() => setShowRegister(true)}
									className="text-sm px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition"
								>
									Registrarse
								</button>
							</div>
						) : (
							<Link
								to="/profile"
								className="text-sm text-gray-400 hover:text-white transition font-medium"
							>
								👤 <strong className="text-blue-400">{user}</strong>
							</Link>
						)
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

			{/* Modales abstraídos */}
			{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
			{showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
		</>
	);
}
