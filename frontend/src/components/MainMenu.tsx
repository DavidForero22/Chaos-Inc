import { useState, useEffect } from "react";
import api from "../api/axios.ts";

interface Room {
	room_id: string;
	name: string;
	is_private: string; // Redis lo guarda como '1' o '0' en strings
	max_players: number;
	status: string;
	owner_name: string;
	players?: string[]; // Opcional por ahora, lo gestionaremos luego
}

export default function MainMenu() {
	const [rooms, setRooms] = useState<Room[]>([]);
	const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

	// Estado para el formulario de crear sala
	const [formData, setFormData] = useState({
		name: "",
		is_private: false,
		password: "",
		max_players: 4,
	});

	// 1. Cargar las salas al iniciar el componente
	useEffect(() => {
		fetchRooms();
	}, []);

	const fetchRooms = async () => {
		try {
			// Usamos la URL de tu backend
			const response = await api.get("/rooms");
			setRooms(response.data);
		} catch (error) {
			console.error("Error al cargar las salas:", error);
		}
	};

	// 2. Enviar el formulario al backend
	const handleCreateRoom = async () => {
		try {
			const response = await api.post("/rooms", formData);
			console.log("Sala creada:", response.data);

			// Recargamos la lista para ver la nueva sala
			fetchRooms();

			// Limpiamos y cerramos el modal
			setShowCreateModal(false);
			setFormData({
				name: "",
				is_private: false,
				password: "",
				max_players: 4,
			});
		} catch (error: any) {
			console.error("Error al crear la sala:", error.response?.data || error);
			alert("Hubo un error al crear la sala. Revisa la consola.");
		}
	};

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

			{/* Lista de Salas Reales */}
			<div className="bg-gray-800 rounded-lg shadow border border-gray-700 overflow-hidden">
				{rooms.map((room) => (
					<div
						key={room.room_id}
						onClick={() => setSelectedRoom(room.room_id)}
						className={`p-4 border-b border-gray-700 cursor-pointer transition-colors flex justify-between items-center
                            ${selectedRoom === room.room_id ? "bg-blue-900" : "hover:bg-gray-700"}`}
					>
						<div>
							<h3 className="text-xl font-bold flex items-center gap-2">
								{room.is_private === "1" ? "🔒" : "🔓"} {room.name}
							</h3>
							<p className="text-gray-400 text-sm">
								Estado:{" "}
								{room.status === "waiting" ? "Esperando..." : "En partida"}
								<span className="ml-2 text-blue-300">({room.owner_name})</span>
							</p>
						</div>
						<div className="text-right">
							<span className="bg-gray-900 px-3 py-1 rounded text-sm font-mono text-yellow-400">
								Código: {room.room_id}
							</span>
							<span className="ml-2 bg-gray-900 px-3 py-1 rounded text-sm font-mono">
								Max: {room.max_players} Jugadores
							</span>
						</div>
					</div>
				))}
				{rooms.length === 0 && (
					<p className="p-6 text-center text-gray-400">
						No hay salas activas. ¡Crea una!
					</p>
				)}
			</div>

			{/* Botón de unirse */}
			<div className="mt-6 flex justify-end">
				<button
					disabled={!selectedRoom}
					className={`px-6 py-3 rounded font-bold text-lg 
                        ${selectedRoom ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}
					onClick={() =>
						alert(
							`Próximamente: Conectando al WebSocket de la sala ${selectedRoom}`,
						)
					}
				>
					Unirse a la sala seleccionada
				</button>
			</div>

			{/* Modal de Crear Sala */}
			{showCreateModal && (
				<div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4">
					<div className="bg-gray-800 p-6 rounded-lg max-w-sm w-full border border-gray-700">
						<h2 className="text-2xl font-bold mb-4">Nueva Sala</h2>

						<input
							type="text"
							placeholder="Nombre de la sala"
							className="w-full p-2 mb-4 bg-gray-900 border border-gray-600 rounded text-white"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
						/>

						<label className="flex items-center gap-2 mb-4 cursor-pointer">
							<input
								type="checkbox"
								className="w-4 h-4"
								checked={formData.is_private}
								onChange={(e) =>
									setFormData({ ...formData, is_private: e.target.checked })
								}
							/>
							Sala Privada
						</label>

						{formData.is_private && (
							<input
								type="password"
								placeholder="Contraseña de acceso"
								className="w-full p-2 mb-6 bg-gray-900 border border-gray-600 rounded text-white"
								value={formData.password}
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
							/>
						)}

						<div className="mb-6">
							<label className="block text-sm text-gray-400 mb-1">
								Máximo de jugadores: {formData.max_players}
							</label>
							<input
								type="range"
								min="3"
								max="10"
								className="w-full"
								value={formData.max_players}
								onChange={(e) =>
									setFormData({
										...formData,
										max_players: parseInt(e.target.value),
									})
								}
							/>
						</div>

						<div className="flex justify-end gap-2">
							<button
								onClick={() => setShowCreateModal(false)}
								className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
							>
								Cancelar
							</button>
							<button
								onClick={handleCreateRoom}
								className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 font-bold"
							>
								Crear y Entrar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
