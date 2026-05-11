// src/components/game/modals/DeathModal.tsx

import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/GameModal.tsx";
import { useGameStore } from "../../../store/useGameStore";

interface DeathModalProps {
	onClose: () => void;
	killerName?: string;
}

export function DeathModal({ onClose, killerName }: DeathModalProps) {
	const navigate = useNavigate();

	const handleLeaveGame = () => {
		// Lógica para limpiar la partida y salir
		localStorage.removeItem("game_token");
		useGameStore.getState().setRoomId(null);
		useGameStore.getState().resetStore();
		navigate("/");
	};

	return (
		<Modal maxWidth="max-w-md">
			{/* CABECERA DEL MODAL */}
			<div className="text-center border-b border-gray-700 pb-4 mb-4">
				<h2 className="text-2xl font-black text-red-600 uppercase tracking-tight">
					¡Has sido eliminado!
				</h2>
			</div>

			{/* CONTENIDO PRINCIPAL */}
			<div className="text-center py-2">
				<p className="text-lg font-medium text-gray-200 mb-4">
					{killerName
						? `El jugador ${killerName} te ha derrotado.`
						: "Has alcanzado el límite de estrés y has sido eliminado de la partida."}
				</p>
				<p className="text-sm text-gray-400 mb-8 font-mono">
					Puedes abandonar la partida (tus resultados se guardarán al finalizar)
					o quedarte como espectador para ver cómo termina continúa caos.
				</p>

				{/* BOTONES */}
				<div className="flex justify-center gap-4 flex-wrap">
					<button
						type="button"
						onClick={onClose}
						className="px-5 py-2.5 rounded bg-blue-600 text-white font-bold uppercase tracking-wider transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:cursor-pointer"
					>
						Quedarse de espectador
					</button>
					<button
						type="button"
						onClick={handleLeaveGame}
						className="px-5 py-2.5 rounded border border-red-600 bg-transparent text-red-500 font-bold uppercase tracking-wider transition-colors hover:bg-red-600/10 focus:outline-none focus:ring-2 focus:ring-red-600 hover:cursor-pointer"
					>
						Abandonar partida
					</button>
				</div>
			</div>
		</Modal>
	);
}
