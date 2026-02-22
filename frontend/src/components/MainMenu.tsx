import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

interface Room {
	room_id: string;
	name: string;
	is_private: string;
	max_players: number;
	status: string;
	owner_name: string;
	players?: string[];
}

export default function MainMenu() {
	const [rooms, setRooms] = useState<Room[]>([]);
	const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

	const { user } = useAuthStore();
	const navigate = useNavigate(); // Para redirigir a la sala de espera

	const [formData, setFormData] = useState({
		name: "",
		is_private: false,
		password: "",
		max_players: 4,
	});

	useEffect(() => {
		fetchRooms();
	}, []);

	const fetchRooms = async () => {
		try {
			const response = await api.get("/rooms");
			setRooms(response.data);
		} catch (error) {
			console.error("Error al cargar las salas:", error);
		}
	};

	const handleCreateRoom = async () => {
		try {
			const response = await api.post("/rooms", formData);
			setShowCreateModal(false);
			// Al crearla, te unes automáticamente a la sala de espera
			navigate(`/room/${response.data.room_id}`);
		} catch (error) {
			alert("Hubo un error al crear la sala.");
		}
	};

	const handleJoinRoom = async () => {
		if (!selectedRoom) return;
		try {
			// Aquí llamarías a un endpoint real para registrar tu entrada: api.post(`/rooms/${selectedRoom}/join`)
			navigate(`/room/${selectedRoom}`);
		} catch (error) {
			alert("Error al unirse a la sala.");
		}
	};

	return (
		<div className="max-w-4xl mx-auto mt-4">
			<div className="flex justify-between items-end mb-6">
				<div>
					<h1 className="text-3xl font-bold text-white mb-1">
						Salas Disponibles
					</h1>
					<p className="text-gray-400 text-sm">
						Únete a una partida pública o crea la tuya propia.
					</p>
				</div>

				{user ? (
					<button
						onClick={() => setShowCreateModal(true)}
						className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded font-bold transition"
					>
						+ Crear Sala
					</button>
				) : (
					<div className="text-right">
						<button
							disabled
							className="bg-gray-700 text-gray-500 px-5 py-2.5 rounded font-bold cursor-not-allowed"
						>
							+ Crear Sala
						</button>
						<p className="text-xs text-red-400 mt-2">
							Inicia sesión para crear salas
						</p>
					</div>
				)}
			</div>

			<div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
				{rooms.map((room) => (
					<div
						key={room.room_id}
						onClick={() => setSelectedRoom(room.room_id)}
						className={`p-5 border-b border-gray-700 cursor-pointer transition flex justify-between items-center ${selectedRoom === room.room_id ? "bg-blue-900/50 border-l-4 border-l-blue-500" : "hover:bg-gray-700/50 border-l-4 border-l-transparent"}`}
					>
						<div>
							<h3 className="text-lg font-bold text-white flex gap-2">
								{room.is_private === "1" ? "🔒" : "🟢"} {room.name}
							</h3>
							<p className="text-gray-400 text-sm mt-1">
								Creada por{" "}
								<span className="text-gray-300">{room.owner_name}</span> •{" "}
								{room.status === "waiting" ? "Esperando..." : "Jugando"}
							</p>
							{/* AQUÍ MOSTRAMOS LOS JUGADORES */}
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
				{rooms.length === 0 && (
					<div className="p-12 text-center text-gray-400">
						No hay salas activas.
					</div>
				)}
			</div>

			<div className="mt-6 flex justify-end">
				<button
					disabled={!selectedRoom}
					onClick={handleJoinRoom}
					className={`px-8 py-3 rounded font-bold text-lg transition shadow-lg ${selectedRoom ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
				>
					Unirse a la partida
				</button>
			</div>

			{/* Modal de Crear (mismo que tenías, recortado por brevedad) */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center p-4 z-50">
					<div className="bg-gray-800 p-8 rounded-xl max-w-sm w-full border border-gray-700">
						<h2 className="text-xl font-bold mb-4 text-white">
							Configurar Sala
						</h2>
						<input
							type="text"
							placeholder="Nombre"
							className="w-full p-2 mb-3 bg-gray-900 rounded text-white"
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
						/>
						<label className="flex items-center gap-2 mb-3 text-white">
							<input
								type="checkbox"
								onChange={(e) =>
									setFormData({ ...formData, is_private: e.target.checked })
								}
							/>{" "}
							Privada
						</label>
						{formData.is_private && (
							<input
								type="password"
								placeholder="Contraseña"
								className="w-full p-2 mb-3 bg-gray-900 rounded text-white"
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
							/>
						)}
						<label className="block text-white mb-4">
							Jugadores: {formData.max_players}
							<input
								type="range"
								min="3"
								max="10"
								className="w-full mt-2"
								value={formData.max_players}
								onChange={(e) =>
									setFormData({
										...formData,
										max_players: parseInt(e.target.value),
									})
								}
							/>
						</label>
						<div className="flex justify-end gap-2">
							<button
								onClick={() => setShowCreateModal(false)}
								className="px-4 py-2 text-gray-400"
							>
								Cancelar
							</button>
							<button
								onClick={handleCreateRoom}
								className="px-4 py-2 bg-blue-600 text-white rounded font-bold"
							>
								Crear
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
