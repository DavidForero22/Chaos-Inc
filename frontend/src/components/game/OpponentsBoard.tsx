import type { Opponent } from "../../types/types.ts";

interface OpponentsBoardProps {
	opponents: Opponent[];
	isMyTurn: boolean;
	selectedCardId: string | null;
	onOpponentClick: (name: string, isOnline: boolean) => void;
}

export function OpponentsBoard({
	opponents,
	isMyTurn,
	selectedCardId,
	onOpponentClick,
}: OpponentsBoardProps) {
	return (
		<div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-800 p-6 flex flex-wrap justify-center items-center gap-6 overflow-y-auto relative">
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
				<span className="text-9xl">🃏</span>
			</div>

			{/* Si carta lista, avisar visualmente al jugador de que elija un rival */}
			{isMyTurn && selectedCardId !== null && (
				<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/20 text-yellow-400 px-6 py-2 rounded-full border border-yellow-500 font-bold animate-bounce shadow-lg z-20">
					¡Elige a un jugador objetivo!
				</div>
			)}

			{opponents.map((player) => {
				const canBeTargeted =
					isMyTurn && selectedCardId !== null && player.is_online;
				const offlineStyles = !player.is_online
					? "opacity-40 grayscale scale-95 border-gray-900"
					: "";
				const targetStyles = canBeTargeted
					? "cursor-crosshair hover:scale-105 hover:border-blue-400 hover:shadow-blue-500/50"
					: "";
				const roleStyles =
					player.role === "boss" ? "border-yellow-600" : "border-gray-700";

				return (
					<div
						key={player.name}
						onClick={() => onOpponentClick(player.name, player.is_online)}
						className={`relative bg-gray-800 p-4 rounded-lg border-2 w-48 text-center shadow-xl z-10 transition-all
                                ${roleStyles} ${targetStyles} ${offlineStyles}
                            `}
					>
						{/* 👈 INDICADOR OFFLINE */}
						{!player.is_online && (
							<div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg animate-pulse z-50">
								🔌 OFFLINE
							</div>
						)}

						{player.role === "boss" && (
							<div className="text-2xl mb-1" title="Este jugador es el Jefe">
								👑
							</div>
						)}
						<h3
							className={`font-bold truncate ${!player.is_online ? "text-gray-500" : "text-white"}`}
						>
							{player.name}
						</h3>

						<div className="mt-3 bg-gray-900 rounded p-2 border border-gray-700">
							<p className="text-xs text-gray-500 uppercase">Estrés</p>
							<p
								className={`text-lg font-black ${!player.is_online ? "text-gray-600" : "text-red-500"}`}
							>
								{player.stress}
							</p>
						</div>

						<div className="mt-2 text-xs text-blue-300">
							Cartas en mano:{" "}
							<span className="font-mono text-blue-200">
								{player.cards_count}
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}
