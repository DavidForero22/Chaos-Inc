import { useState } from "react";

// Estructura basada en tu diagrama de Redis
interface Room {
	room_id: string;
	name: string;
	is_private: boolean;
	max_players: number;
	status: "waiting" | "playing";
	players: string[]; // Por ahora strings, luego IDs
}

export default function MainMenu() {
	const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

	// Datos falsos para ver la interfaz (luego vendrán del backend)
	const mockRooms: Room[] = [
		{
			room_id: "1",
			name: "Sala de Jefazos",
			is_private: false,
			max_players: 4,
			status: "waiting",
			players: ["user1", "user2"],
		},
		{
			room_id: "2",
			name: "Partida Privada",
			is_private: true,
			max_players: 6,
			status: "playing",
			players: ["user3", "user4", "user5"],
		},
	];

	return (
		<div className="max-w-4xl mx-auto mt-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Salas de Chaos Inc.</h1>
				<button
					onClick={() => setShowCreateModal(true)}
					className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold"
				>
					+ Crear Sala
				</button>
			</div>

			{/* Lista de Salas */}
			<div className="bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden">
				{mockRooms.map((room) => (
					<div
						key={room.room_id}
						onClick={() => setSelectedRoom(room.room_id)}
						className={`p-4 border-b border-gray-700 cursor-pointer transition-colors flex justify-between items-center
                            ${selectedRoom === room.room_id ? "bg-blue-900" : "hover:bg-gray-700"}`}
					>
						<div>
							<h3 className="text-xl font-bold flex items-center gap-2">
								{room.is_private ? "🔒" : "🔓"} {room.name}
							</h3>
							<p className="text-gray-400 text-sm">
								Estado:{" "}
								{room.status === "waiting" ? "Esperando..." : "En partida"}
							</p>
						</div>
						<div className="text-right">
							<span className="bg-gray-900 px-3 py-1 rounded text-sm font-mono">
								{room.players.length} / {room.max_players} Jugadores
							</span>
						</div>
					</div>
				))}
				{mockRooms.length === 0 && (
					<p className="p-6 text-center text-gray-400">No hay salas activas.</p>
				)}
			</div>

			{/* Botón de unirse */}
			<div className="mt-6 flex justify-end">
				<button
					disabled={!selectedRoom}
					className={`px-6 py-3 rounded font-bold text-lg 
                        ${selectedRoom ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}
					onClick={() => alert(`Intentando unirse a la sala: ${selectedRoom}`)}
				>
					Unirse a la sala seleccionada
				</button>
			</div>

			{/* Modal ultrabásico de Crear Sala */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4">
					<div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full border border-gray-700">
						<h2 className="text-2xl font-bold mb-4">Nueva Sala</h2>
						{/* Aquí irá el formulario */}
						<input
							type="text"
							placeholder="Nombre de la sala"
							className="w-full p-2 mb-4 bg-gray-900 border border-gray-600 rounded text-white"
						/>
						<label className="flex items-center gap-2 mb-4 cursor-pointer">
							<input type="checkbox" className="w-4 h-4" /> Sala Privada
						</label>
						<input
							type="password"
							placeholder="Contraseña (Opcional)"
							className="w-full p-2 mb-6 bg-gray-900 border border-gray-600 rounded text-white"
						/>

						<div className="flex justify-end gap-2">
							<button
								onClick={() => setShowCreateModal(false)}
								className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
							>
								Cancelar
							</button>
							<button className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 font-bold">
								Crear y Entrar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
