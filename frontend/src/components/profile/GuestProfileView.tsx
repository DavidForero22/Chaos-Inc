// src/components/profile/GuestProfileView.tsx
import { useAuthStore } from "../../store/useAuthStore.ts";

interface GuestProfileViewProps {
	onLogout: () => void;
}

export default function GuestProfileView({ onLogout }: GuestProfileViewProps) {
	const { user } = useAuthStore();

	return (
		<div className="max-w-xl mx-auto py-12 flex flex-col gap-6">
			<div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center shadow-2xl">
				<h1 className="text-3xl font-black text-white mb-2">👤 {user}</h1>
				<span className="inline-block px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full uppercase tracking-wider font-bold mb-6">
					Modo Invitado
				</span>

				<p className="text-gray-400 mb-8 leading-relaxed">
					Estás jugando de forma temporal. Para poder llevar un registro de tu{" "}
					<strong className="text-white">historial de partidas</strong>, ver tus{" "}
					<strong className="text-white">estadísticas globales</strong> y
					asegurar este nombre de usuario, es necesario que te registres.
				</p>

				<div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mb-8 text-left">
					<p className="text-sm text-yellow-500 font-medium flex gap-3 items-start">
						<span className="text-lg">⚠️</span>
						<span>
							<strong>Atención:</strong> Por motivos de limpieza, tu cuenta de
							invitado y todos los datos asociados a ella serán eliminados
							automáticamente de nuestros servidores
							<strong> al día siguiente</strong> de su creación.
						</span>
					</p>
				</div>

				<div className="flex flex-col gap-3">
					<button
						onClick={onLogout}
						className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold transition shadow-lg text-sm cursor-pointer"
					>
						Cerrar sesión
					</button>
				</div>
			</div>
		</div>
	);
}
