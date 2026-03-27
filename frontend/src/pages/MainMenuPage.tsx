// src/pages/MainMenuPage.tsx

// -- HOOKS --
import { useState } from "react";
import { useLobby } from "../hooks/useLobby.ts";

// -- COMPONENTES --
import RoomList from "../components/lobby/RoomList.tsx";
import CreateRoomModal from "../components/lobby/CreateRoomModal.tsx";
import GuestNameModal from "../components/lobby/GuestNameModal.tsx";

export default function MainMenuPage() {
	const {
		filteredRooms,
		selectedRoom,
		setSelectedRoom,
		filterStatus,
		setFilterStatus,
		handleJoinRoom,
		user,
	} = useLobby();
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showGuestModal, setShowGuestModal] = useState(false);

	const onJoinClick = () => {
		if (user) {
			// Si ya tiene usuario (logueado o invitado previo), entra directo
			handleJoinRoom();
		} else {
			// Si no, le pedimos el nombre
			setShowGuestModal(true);
		}
	};

	// Callback para cuando el login de invitado termina con éxito
	const handleGuestSuccess = () => {
		setShowGuestModal(false);
		// Intentamos unirse inmediatamente después de obtener el token
		handleJoinRoom();
	};

	// Determinamos si el botón de unirse debe estar deshabilitado
	const isJoinDisabled =
		!selectedRoom ||
		filteredRooms.find((r) => r.room_id === selectedRoom)?.status !== "waiting";

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
					<div className="flex gap-2 mt-4">
						<button
							onClick={() => setFilterStatus("all")}
							className={`px-3 py-1 text-sm rounded ${filterStatus === "all" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"}`}
						>
							Todas
						</button>
						<button
							onClick={() => setFilterStatus("waiting")}
							className={`px-3 py-1 text-sm rounded ${filterStatus === "waiting" ? "bg-green-600 text-white" : "bg-gray-700 text-gray-400"}`}
						>
							Esperando
						</button>
						<button
							onClick={() => setFilterStatus("in_game")}
							className={`px-3 py-1 text-sm rounded ${filterStatus === "in_game" ? "bg-red-600 text-white" : "bg-gray-700 text-gray-400"}`}
						>
							En Partida
						</button>
					</div>
				</div>

				{user ? (
					<button
						onClick={() => setShowCreateModal(true)}
						className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded font-bold transition shadow-lg shadow-green-900/20"
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
						<p className="text-xs text-gray-500 mt-2">
							Solo usuarios registrados pueden crear
						</p>
					</div>
				)}
			</div>

			<RoomList
				rooms={filteredRooms}
				selectedRoom={selectedRoom}
				onSelectRoom={setSelectedRoom}
			/>

			<div className="mt-6 flex justify-end">
				<button
					disabled={isJoinDisabled}
					onClick={onJoinClick}
					className={`px-8 py-3 rounded font-bold text-lg transition shadow-lg flex items-center gap-2
                        ${
													!isJoinDisabled
														? "bg-blue-600 hover:bg-blue-500 text-white hover:-translate-y-1"
														: "bg-gray-800 text-gray-600 cursor-not-allowed"
												}`}
				>
					{!user && !isJoinDisabled
						? "Jugar como Invitado"
						: "Unirse a la partida"}
				</button>
			</div>

			{showCreateModal && user && (
                <CreateRoomModal
                    onClose={() => setShowCreateModal(false)}
                    user={user}
                />
            )}
            
            {showGuestModal && (
                <GuestNameModal 
                    onClose={() => setShowGuestModal(false)}
                    onSuccess={handleGuestSuccess}
                />
            )}
		</div>
	);
}
