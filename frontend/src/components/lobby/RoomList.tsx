// src/components/lobby/RoomList.tsx

import type { RoomData } from "../../types/api";

interface RoomListProps {
	rooms: RoomData[];
	selectedRoom: string | null;
	onSelectRoom: (roomId: string) => void;
}

export default function RoomList({
	rooms,
	selectedRoom,
	onSelectRoom,
}: RoomListProps) {
	if (rooms.length === 0) {
		return (
			<div className="p-12 text-center text-gray-400">
				No hay salas activas con este filtro.
			</div>
		);
	}

	return (
		<div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
			{rooms.map((room) => (
				<div
					key={room.room_id}
					onClick={() => onSelectRoom(room.room_id)}
					className={`p-5 border-b border-gray-700 cursor-pointer transition flex justify-between items-center ${
						selectedRoom === room.room_id
							? "bg-blue-900/50 border-l-4 border-l-blue-500"
							: "hover:bg-gray-700/50 border-l-4 border-l-transparent"
					}`}
				>
					<div>
						<h3 className="text-lg font-bold text-white flex gap-2">
							{room.is_private === "1" ? "🔒" : "🟢"} {room.name}
						</h3>
						{room.status === "waiting" ? (
							<span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-700 ml-2">
								Esperando
							</span>
						) : (
							<span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded border border-red-700 ml-2">
								En Partida
							</span>
						)}
						<p className="text-gray-400 text-sm mt-1">
							Creada por{" "}
							<span className="text-gray-300">{room.owner_name}</span>
						</p>
						<p className="text-xs text-blue-300 mt-2">
							Jugadores en sala:{" "}
							{room.players && room.players.length > 0
								? room.players.join(", ")
								: "Ninguno aún"}
						</p>
					</div>
					<div className="text-right">
						<span className="bg-gray-900 px-3 py-1 rounded text-xs font-mono border border-gray-700 mb-2 inline-block">
							ID: {room.room_id}
						</span>
						<div className="text-sm font-medium text-blue-400">
							{room.players?.length || 0} / {room.max_players} Jugadores
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
