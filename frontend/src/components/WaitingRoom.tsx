import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import echo from "../echo.ts"; // Importa tu instancia de Echo

interface RoomData {
	room_id: string;
	name: string;
	max_players: number;
	owner_name: string;
	players: string[];
}

export default function WaitingRoom() {
	const { id } = useParams();
	const navigate = useNavigate();
	const location = useLocation();

	const myPlayerName = location.state?.playerName || "Desconocido";
	const [room, setRoom] = useState<RoomData | null>(null);

	// SISTEMA WEBSOCKET PARA LA SALA
	useEffect(() => {
		const fetchRoomData = async () => {
			try {
				const res = await api.get("/rooms");
				const currentRoom = res.data.find((r: RoomData) => r.room_id === id);
				if (currentRoom) {
					setRoom(currentRoom);
				} else {
					navigate("/"); // La sala no existe
				}
			} catch (error) {
				console.error("Error cargando la sala");
			}
		};

		// carga inicial
		fetchRoomData();

		// Escuchar el canal ESPECÍFICO de esta sala
		const channel = echo.channel(`room.${id}`);

		// Escuchar el evento de actualización de estado
		channel.listen(".RoomListUpdated", () => {
			console.log(`¡Alguien entró o salió de la sala ${id}! Actualizando...`);
			fetchRoomData();
		});

		// Limpieza al salir
		return () => {
			channel.stopListening(".RoomStateUpdated");
			echo.leaveChannel(`room.${id}`);
		};
	}, [id, navigate]);

	const handleLeaveRoom = async () => {
		try {
			await api.post(`/rooms/${id}/leave`, { player_name: myPlayerName });
			navigate("/");
		} catch (error) {
			console.error("Error al salir");
			navigate("/");
		}
	};

	if (!room)
		return (
			<div className="text-center text-white mt-20">
				Conectando a la sala...
			</div>
		);

	return (
		<div className="max-w-2xl mx-auto mt-12 bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center">
			<h1 className="text-3xl font-bold text-white mb-2">{room.name}</h1>
			<p className="text-gray-400 font-mono text-xl mb-8">
				Código de invitación: <span className="text-yellow-400">{id}</span>
			</p>

			<div className="bg-gray-900 p-6 rounded-lg mb-8 text-left">
				<div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
					<h3 className="text-lg font-bold text-blue-400">
						Jugadores Conectados
					</h3>
					<span className="text-sm text-gray-400">
						{room.players.length} / {room.max_players}
					</span>
				</div>

				<ul className="space-y-3">
					{room.players.map((player) => (
						<li
							key={player}
							className="flex items-center gap-2 text-white bg-gray-800 p-2 rounded"
						>
							<span className="w-2 h-2 rounded-full bg-green-500"></span>
							{player}{" "}
							{player === myPlayerName && (
								<span className="text-xs text-blue-400 ml-2">(Tú)</span>
							)}
							{player === room.owner_name && (
								<span className="text-xs text-yellow-500 ml-2">👑 Líder</span>
							)}
						</li>
					))}

					{room.players.length < room.max_players && (
						<li className="flex items-center gap-2 text-gray-500 italic p-2">
							<span className="w-2 h-2 rounded-full bg-gray-600 animate-pulse"></span>
							Esperando a más jugadores...
						</li>
					)}
				</ul>
			</div>

			<div className="flex justify-center gap-4">
				<button
					onClick={handleLeaveRoom}
					className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition"
				>
					Abandonar Sala
				</button>
				<button
					disabled={room.players.length < 2}
					className={`px-6 py-3 rounded font-bold ${room.players.length < 2 ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-500 text-white"}`}
				>
					Empezar Partida
				</button>
			</div>
		</div>
	);
}
