import type { GameRecord } from "../../types/api.ts";

interface Props {
	games: GameRecord[];
}

export default function GamesTab({ games }: Props) {
	return (
		<div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col gap-3">
			<h2 className="text-sm text-gray-400 uppercase font-bold mb-2">
				Historial de partidas
			</h2>
			{games.length === 0 ? (
				<p className="text-gray-500 text-sm">No hay partidas registradas.</p>
			) : (
				games.map((g) => (
					<div
						key={g.id}
						className="bg-gray-900 rounded-lg border border-gray-700 p-4"
					>
						<div className="flex justify-between items-center mb-2">
							<p className="text-white font-bold">
								Partida #{g.id} — Ganador: {g.winnerRole}
							</p>
							<p className="text-gray-500 text-xs">
								{new Date(g.playedAt).toLocaleDateString("es-ES")} ·{" "}
								{g.totalRounds} rondas
							</p>
						</div>
						<div className="flex flex-wrap gap-2">
							{g.players?.map((p, i) => (
								<span
									key={i}
									className={`text-xs px-2 py-1 rounded border ${p.stats.hasWon ? "border-green-700 text-green-400" : "border-gray-700 text-gray-400"}`}
								>
									{p.displayName} {p.isGuest ? "(inv)" : ""} — {p.stats.role}
								</span>
							))}
						</div>
					</div>
				))
			)}
		</div>
	);
}
