// src/components/game/ui/LuckChallengeModal.tsx

import { useState } from "react";
import api from "../../../api/axios.ts";
import { Modal } from "../ui/GameModal.tsx";
import { useTimerStore } from "../../../store/game/useTimerStore.ts";


// Estilos de las puertas (más oscuros para dar sensación de pasillo cerrado)
const COLOR_STYLES: Record<string, string> = {
	red: "bg-red-700 hover:bg-red-600 border-red-900",
	blue: "bg-blue-700 hover:bg-blue-600 border-blue-900",
	green: "bg-green-700 hover:bg-green-600 border-green-900",
	yellow: "bg-yellow-600 hover:bg-yellow-500 border-yellow-800",
};

// --- ACCESIBILIDAD: Mapa de traducciones para lectores de pantalla ---
const COLOR_NAMES: Record<string, string> = {
	red: "roja",
	blue: "azul",
	green: "verde",
	yellow: "amarilla",
};

interface LuckChallengeModalProps {
	roomId: string;
	colors: string[];
	onResult: (success: boolean) => void;
}

export function LuckChallengeModal({
	roomId,
	colors,
	onResult,
}: LuckChallengeModalProps) {
	const [chosen, setChosen] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// Timers
	const luckChallengeSecondsLeft = useTimerStore(
		(state) => state.luckChallengeSecondsLeft,
	);

	const handleChoose = async (color: string) => {
		if (loading || chosen) return;
		setLoading(true);
		setChosen(color);

		try {
			const res = await api.post(`/rooms/${roomId}/luck-challenge`, { color });
			onResult(res.data._luck_result === "success");
		} catch {
			onResult(false);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			maxWidth="max-w-md"
			ariaLabelledBy="luck-challenge-title"
			ariaDescribedBy="luck-challenge-desc"
		>
			<p
				className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-2 text-center"
				aria-hidden="true"
			>
				Codigo marrón
			</p>
			<h2
				id="luck-challenge-title"
				className="text-2xl font-black text-white mb-2 text-center"
			>
				¡¿Y el baño?!
			</h2>

			<p
				id="luck-challenge-desc"
				className="text-gray-400 text-sm mb-6 text-center"
			>
				¡Alguien te ha puesto laxante en el café! Encuentra la puerta del baño para no perder tu turno.
			</p>

			{/* Temporizador visual */}
			{luckChallengeSecondsLeft !== null && (
				<div
					className="bg-red-900/40 border border-red-700/50 text-red-300 px-3 py-3 rounded-lg mb-8 text-center flex flex-col items-center justify-center"
					role="timer"
					aria-atomic="true"
				>
					{/* Texto exclusivo para lectores de pantalla */}
					<span className="sr-only">
						Tiempo restante: {luckChallengeSecondsLeft} segundos
					</span>

					<span
						className="text-xs uppercase font-bold tracking-wider mb-1"
						aria-hidden="true"
					>
						Tiempo
					</span>
					<span
						className="font-mono text-3xl font-black text-white animate-pulse"
						aria-hidden="true"
					>
						{luckChallengeSecondsLeft}s
					</span>
				</div>
			)}

			<div
				className="flex flex-row justify-between gap-3 h-36"
				role="group"
				aria-label="Opciones de puertas"
			>
				{colors.map((color) => (
					<button
						key={color}
						type="button"
						onClick={() => handleChoose(color)}
						disabled={!!chosen || loading || luckChallengeSecondsLeft === null}
						aria-label={`Seleccionar puerta ${COLOR_NAMES[color] || color}`}
						className={`flex-1 rounded-t-md rounded-b-sm border-b-8 border-x-4 border-t-4 transition-all duration-200 relative overflow-hidden shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${COLOR_STYLES[color]} ${
							chosen === color
								? "translate-y-4 border-b-0 brightness-125 shadow-none"
								: "hover:-translate-y-1"
						} ${chosen && chosen !== color ? "opacity-30 grayscale" : ""} ${
							chosen || loading || luckChallengeSecondsLeft === null
								? "cursor-not-allowed"
								: "cursor-pointer"
						}`}
					>
						{/* Pequeño detalle visual (simula el pomo de una puerta) */}
						<div
							className="absolute top-1/2 right-2 w-2 h-5 bg-black/40 rounded-sm"
							aria-hidden="true"
						></div>
						{/* Marco interior de la puerta */}
						<div
							className="absolute inset-1 border border-black/20 pointer-events-none"
							aria-hidden="true"
						></div>
					</button>
				))}
			</div>

			{chosen && (
				<p
					className="text-gray-400 font-mono text-xs mt-8 text-center animate-pulse uppercase tracking-widest"
					role="status"
					aria-live="polite"
				>
					Preguntando al conserje...
				</p>
			)}
		</Modal>
	);
}
