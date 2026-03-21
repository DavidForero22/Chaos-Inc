import { useState, useEffect, useRef } from "react";
import type { LogEntry } from "../../../hooks/game/useGameLog";

interface GameLogProps {
	logs: LogEntry[];
}

export function GameLog({ logs }: GameLogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [hasNew, setHasNew] = useState(false);
	const prevLengthRef = useRef(logs.length);

	useEffect(() => {
		if (logs.length > prevLengthRef.current && !isOpen) {
			setHasNew(true);
		}
		prevLengthRef.current = logs.length;
	}, [logs.length, isOpen]);

	const handleOpen = () => {
		setIsOpen(true);
		setHasNew(false);
	};

	return (
		<div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-end gap-2">
			{/* Botón para abrir/cerrar */}
			<button
				onClick={isOpen ? () => setIsOpen(false) : handleOpen}
				className="relative bg-gray-800 border border-gray-700 text-gray-400 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition"
			>
				📋 Log
				{hasNew && (
					<span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
				)}
			</button>

			{/* Panel */}
			{isOpen && (
				<div className="bg-gray-900 border border-gray-700 rounded-xl shadow-xl w-64 max-h-96 flex flex-col overflow-hidden">
					<div className="px-4 py-2 border-b border-gray-700 flex justify-between items-center">
						<p className="text-xs text-gray-400 uppercase font-bold">
							Registro de partida
						</p>
						<button
							onClick={() => setIsOpen(false)}
							className="text-gray-600 hover:text-gray-400 text-xs"
						>
							✕
						</button>
					</div>

					<div className="overflow-y-auto flex flex-col gap-1 p-3">
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
									<p className="text-gray-300 text-xs leading-snug">
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
