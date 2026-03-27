// src/components/lobby/RoomList.tsx

import type { RoomData } from "../../types/api";

interface RoomListProps {
	rooms: RoomData[];
	selectedRoom: string | null;
	onSelectRoom: (roomId: string) => void;
	isLoading?: boolean;
}

export default function RoomList({
	rooms,
	selectedRoom,
	onSelectRoom,
	isLoading,
}: RoomListProps) {
	return (
		<div className="bg-gray-800/80 rounded-xl border border-gray-700 shadow-xl overflow-hidden min-h-48 relative">
			{isLoading && (
				<div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
					<div className="flex flex-col items-center gap-3">
						<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
						<p className="text-gray-400 text-xs uppercase tracking-widest">
							Actualizando...
						</p>
					</div>
				</div>
			)}

			{!isLoading && rooms.length === 0 ? (
				<div className="p-12 text-center text-gray-500 italic">
					No hay salas activas con este filtro.
				</div>
			) : (
				rooms.map((room) => (
					<div
						key={room.room_id}
						onClick={() => onSelectRoom(room.room_id)}
						className={`p-5 border-b border-gray-700/50 cursor-pointer transition-all flex justify-between items-center ${
							selectedRoom === room.room_id
								? "bg-blue-900/40 border-l-4 border-l-blue-500"
								: "hover:bg-gray-700/30 border-l-4 border-l-transparent"
						}`}
					>
						<div>
							<h3 className="text-base font-bold text-white flex items-center gap-2">
								{room.is_private === "1" ? "🔒" : "🟢"} {room.name}
								{room.status === "waiting" ? (
									<span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-700">
										Esperando
									</span>
								) : (
									<span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded border border-red-700">
										En Partida
									</span>
								)}
							</h3>
							<p className="text-gray-500 text-xs mt-1">
								Creada por{" "}
								<span className="text-gray-300">{room.owner_name}</span>
							</p>
							<p className="text-xs text-blue-400/70 mt-1">
								{room.players && room.players.length > 0
									? room.players.join(", ")
									: "Ninguno aún"}
							</p>
						</div>
						<div className="text-right shrink-0 ml-4">
							<span className="bg-gray-900 px-2 py-1 rounded text-xs font-mono border border-gray-700 block mb-1">
								{room.room_id}
							</span>
							<span className="text-sm font-bold text-blue-400">
								{room.players?.length || 0} / {room.max_players}
							</span>
						</div>
					</div>
				))
			)}
		</div>
	);
}
