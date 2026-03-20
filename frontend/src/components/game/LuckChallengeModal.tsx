import { useState } from "react";
import api from "../../api/axios.ts";

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

	const handleChoose = async (color: string) => {
		if (loading || chosen) return;
		setChosen(color);
		setLoading(true);

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
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
			<div className="bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
				<p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-2">
					¡Tu turno está bloqueado!
				</p>
				<h2 className="text-2xl font-black text-white mb-2">
					Prueba de suerte
				</h2>
				<p className="text-gray-400 text-sm mb-8">
					Elige un color. Si aciertas el correcto, podrás jugar tu turno.
				</p>

				<div className="grid grid-cols-2 gap-4">
					{colors.map((color) => (
						<button
							key={color}
							onClick={() => handleChoose(color)}
							disabled={!!chosen || loading}
							className={`
                                h-20 rounded-xl border-2 transition font-bold text-white text-sm
                                ${COLOR_STYLES[color]}
                                ${chosen === color ? "ring-4 ring-white scale-95" : ""}
                                ${chosen && chosen !== color ? "opacity-40" : ""}
                                ${chosen ? "cursor-not-allowed" : "cursor-pointer"}
                            `}
						/>
					))}
				</div>

				{chosen && (
					<p className="text-gray-500 text-xs mt-6 animate-pulse">
						Comprobando resultado...
					</p>
				)}
			</div>
		</div>
	);
}
