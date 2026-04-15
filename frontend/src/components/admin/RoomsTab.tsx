// src/components/admin/RoomsTab.tsx

import type { RoomRecord } from "../../types/api.ts";

interface Props {
	rooms: RoomRecord[];
}

export default function RoomsTab({ rooms }: Props) {
	return (
		<div className="flex flex-col gap-2">
			<h3 className="font-bold text-lg underline decoration-2 uppercase mb-4">
				Salas de Juego Activas
			</h3>

			{rooms.length === 0 ? (
				<p className="opacity-70 italic text-sm">
					No hay salas actualmente.
				</p>
			) : (
				rooms.map((r) => (
					<div
						key={r.room_id}
						className="py-4 border-b border-dashed border-gray-400/50"
					>
						<div className="flex justify-between items-start">
							<div>
								<p className="font-bold text-lg flex items-center gap-3">
									{r.name}
									<span
										className={`text-xs px-2 py-0.5 border ${
											r.status === "in_game"
												? "border-blue-700 text-blue-700 bg-blue-100/50"
												: "border-yellow-600 text-yellow-700 bg-yellow-100/50"
										}`}
									>
										{r.status === "in_game" ? "EN CURSO" : "ESPERANDO"}
									</span>
								</p>
								<p className="text-sm opacity-70 mt-1">
									<span className="font-bold">ID:</span> {r.room_id}{" "}
									<span className="mx-2">|</span>
									<span className="font-bold">Jefe:</span> {r.owner_name}{" "}
									<span className="mx-2">|</span>
									<span className="font-bold">Aforo:</span> {r.players.length}/
									{r.max_players}
								</p>
							</div>

							{/* Lista de asistentes de la sala */}
							<div className="flex flex-wrap justify-end gap-2 max-w-50">
								{r.players.map((p) => (
									<span
										key={p}
										className="text-xs bg-gray-200 border border-gray-400 px-2 py-0.5 rounded-sm font-bold opacity-80"
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
