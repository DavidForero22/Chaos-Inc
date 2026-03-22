// src/components/game/board/GameLog.tsx

import { useState, useEffect, useRef } from "react";
import { useGameStore } from "../../../store/useGameStore";

export function GameLog() {
	const logs = useGameStore((state) => state.logs);

	// Estado local de la UI
	const [isOpen, setIsOpen] = useState(false);
	const [hasNew, setHasNew] = useState(false);

	const prevLengthRef = useRef(logs.length);
	const scrollRef = useRef<HTMLDivElement>(null);

	// --- Efecto para notificaciones y auto-scroll ---
	useEffect(() => {
		if (isOpen) {
			// Si está abierto, actualizar notificacion y quitar la alerta
			prevLengthRef.current = logs.length;
			setHasNew(false);

			// Mantener el scroll abajo mientras entran mensajes
			if (scrollRef.current) {
				scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
			}
		} else if (logs.length > prevLengthRef.current) {
			// Si está cerrado y el array ha crecido, mostrar la burbuja
			setHasNew(true);
		}
	}, [logs.length, isOpen]);

	const handleOpen = () => {
		setIsOpen(true);
		// Hacer scroll al fondo nada más abrirlo (el pequeño delay permite que el DOM se pinte)
		setTimeout(() => {
			if (scrollRef.current) {
				scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
			}
		}, 10);
	};

	return (
		<div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-2">
			{/* Botón para abrir/cerrar */}
			<button
				onClick={isOpen ? () => setIsOpen(false) : handleOpen}
				className="relative bg-gray-800 border border-gray-700 text-gray-400 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition"
			>
				📋 Log
				{/* La burbuja solo sale si hasNew es true y el panel NO está abierto */}
				{hasNew && !isOpen && (
					<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
				)}
			</button>

			{/* Panel */}
			{isOpen && (
				<div className="bg-gray-900 border border-gray-700 rounded-xl shadow-xl w-64 max-h-96 flex flex-col overflow-hidden animate-fade-in">
					<div className="px-4 py-2 border-b border-gray-700 flex justify-between items-center">
						<p className="text-xs text-gray-400 uppercase font-bold">
							Registro de partida
						</p>
						<button
							onClick={() => setIsOpen(false)}
							className="text-gray-600 hover:text-gray-400 text-xs font-bold"
						>
							✕
						</button>
					</div>

					<div
						ref={scrollRef}
						className="overflow-y-auto flex flex-col gap-2 p-3 no-scrollbar"
					>
						{logs.length === 0 ? (
							<p className="text-gray-600 text-xs text-center py-4">
								Aún no hay eventos registrados.
							</p>
						) : (
							logs.map((entry) => (
								<div key={entry.id} className="flex gap-2 items-start">
									<span className="text-gray-600 text-xs shrink-0 mt-0.5 font-mono">
										{entry.timestamp}
									</span>
									{/* Cambiado el color a text-gray-500 como pediste */}
									<p className="text-gray-500 text-xs leading-snug">
										{entry.message}
									</p>
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
