// src/components/game/modals/DeathModal.tsx
// Accesibilidad comprobada: SI

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/GameModal.tsx";
import { useRoomStore } from "../../../store/room/useRoomStore.ts";

interface DeathModalProps {
	onClose: () => void;
	killerName?: string;
}

export function DeathModal({ onClose, killerName }: DeathModalProps) {
	const navigate = useNavigate();

	// Referencia para el foco inicial
	const spectatorBtnRef = useRef<HTMLButtonElement>(null);

	// Mover el foco al botón principal al abrir
	useEffect(() => {
		const timer = setTimeout(() => {
			spectatorBtnRef.current?.focus();
		}, 50);
		return () => clearTimeout(timer);
	}, []);

	const handleLeaveGame = () => {
		// Limpiar la partida y salir usando useRoomStore
		localStorage.removeItem("game_token");
		useRoomStore.getState().resetRoomStore(false);
		navigate("/");
	};

	return (
		<Modal
			maxWidth="max-w-md"
			ariaLabelledBy="death-title"
			ariaDescribedBy="death-desc"
		>
			{/* Contenedor principal  */}
			<div className="max-h-[80vh] overflow-y-auto px-1 custom-scrollbar">
				<div className="text-center border-b border-gray-700 pb-4 mb-4 shrink-0">
					<h2
						id="death-title"
						className="text-2xl font-black text-red-600 uppercase tracking-tight"
					>
						¡Has sido eliminado!
					</h2>
				</div>

				{/* CONTENIDO PRINCIPAL */}
				<div className="text-center py-2">
					<p id="death-desc" className="text-lg font-medium text-gray-200 mb-4">
						{killerName
							? `El jugador ${killerName} te ha derrotado.`
							: "Has alcanzado el límite de estrés y has sido eliminado de la partida."}
					</p>
					<p className="text-sm text-gray-400 mb-8 font-mono">
						Puedes abandonar la partida (tus resultados se guardarán al
						finalizar) o quedarte como espectador para ver cómo continúa el
						caos.
					</p>

					{/* BOTONES */}
					<div className="flex flex-col sm:flex-row justify-center items-center gap-4">
						<button
							ref={spectatorBtnRef}
							type="button"
							onClick={onClose}
							className="w-full sm:w-auto px-5 py-2.5 rounded bg-blue-600 text-white font-bold uppercase tracking-wider transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a] shadow-[0_0_15px_rgba(37,99,235,0.4)]"
						>
							Quedarse de espectador
						</button>
						<button
							type="button"
							onClick={handleLeaveGame}
							className="w-full sm:w-auto px-5 py-2.5 rounded border border-red-600 bg-transparent text-red-500 font-bold uppercase tracking-wider transition-colors hover:bg-red-600/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
						>
							Abandonar partida
						</button>
					</div>
				</div>
			</div>
		</Modal>
	);
}
