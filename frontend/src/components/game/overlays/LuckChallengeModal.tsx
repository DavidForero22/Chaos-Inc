import { useState } from "react";
import api from "../../../api/axios.ts";
import { Modal } from "../../ui/Modal.tsx";
import { useTimerStore } from "../../../store/useTimerStore.ts";

const COLOR_STYLES: Record<string, string> = {
	red: "bg-red-600 hover:bg-red-500 border-red-400",
	blue: "bg-blue-600 hover:bg-blue-500 border-blue-400",
	green: "bg-green-600 hover:bg-green-500 border-green-400",
	yellow: "bg-yellow-500 hover:bg-yellow-400 border-yellow-300",
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
			onResult(res.data.result === "success");
		} catch {
			onResult(false);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal maxWidth="max-w-sm">
			<p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-2">
				¡Tu turno está bloqueado!
			</p>
			<h2 className="text-2xl font-black text-white mb-2">Prueba de suerte</h2>

			<p className="text-gray-400 text-sm mb-6">
				Elige un color. Si aciertas el correcto, podrás jugar tu turno.
			</p>

			{/* NUEVO: El temporizador visual */}
			{luckChallengeSecondsLeft !== null && (
				<div className="bg-red-900/40 border border-red-700/50 text-red-300 px-3 py-2 rounded-lg mb-6 text-center animate-pulse flex flex-col items-center justify-center">
					<span className="text-xs uppercase font-bold tracking-wider mb-1">
						Tiempo Restante
					</span>
					<span className="font-mono text-2xl font-black text-white">
						{luckChallengeSecondsLeft}s
					</span>
				</div>
			)}

			<div className="grid grid-cols-2 gap-4">
				{colors.map((color) => (
					<button
						key={color}
						onClick={() => handleChoose(color)}
						disabled={!!chosen || loading || luckChallengeSecondsLeft === null}
						className={`h-20 rounded-xl border-2 transition font-bold text-white text-sm ${COLOR_STYLES[color]} ${
							chosen === color ? "ring-4 ring-white scale-95" : ""
						} ${chosen && chosen !== color ? "opacity-40" : ""} ${
							chosen || loading || luckChallengeSecondsLeft === null
								? "cursor-not-allowed"
								: "cursor-pointer"
						}`}
					/>
				))}
			</div>

			{chosen && (
				<p className="text-gray-500 text-xs mt-6 animate-pulse">
					Comprobando resultado...
				</p>
			)}
		</Modal>
	);
}
