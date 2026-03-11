import type { RoomRecord } from "../../types/api.ts";

interface Props {
	rooms: RoomRecord[];
}

export default function RoomsTab({ rooms }: Props) {
	return (
		<div className="bg-gray-800 rounded-xl border border-gray-700 p-6 flex flex-col gap-3">
			<h2 className="text-sm text-gray-400 uppercase font-bold mb-2">
				Salas activas
			</h2>
			{rooms.length === 0 ? (
				<p className="text-gray-500 text-sm">No hay salas activas.</p>
			) : (
				rooms.map((r) => (
					<div
						key={r.room_id}
						className="bg-gray-900 rounded-lg border border-gray-700 p-4"
					>
						<div className="flex justify-between items-center">
							<div>
								<p className="text-white font-bold">
									{r.name}
									<span
										className={`ml-2 text-xs px-2 py-0.5 rounded ${r.status === "in_game" ? "bg-green-900 text-green-400" : "bg-yellow-900 text-yellow-400"}`}
									>
										{r.status === "in_game" ? "En partida" : "Esperando"}
									</span>
								</p>
								<p className="text-gray-500 text-xs">
									ID: {r.room_id} · Owner: {r.owner_name} · {r.players.length}/
									{r.max_players} jugadores
								</p>
							</div>
							<div className="flex flex-wrap gap-1">
								{r.players.map((p) => (
									<span
										key={p}
										className="text-xs bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-gray-300"
									>
										{p}
									</span>
								))}
							</div>
						</div>
					</div>
				))
			)}
		</div>
	);
}
