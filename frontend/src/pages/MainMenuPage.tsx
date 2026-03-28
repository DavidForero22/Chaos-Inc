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
		isLoadingRooms,
	} = useLobby(); // <-- Eliminado isLoading

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
						{(["all", "waiting", "in_game"] as const).map((f) => (
							<button
								key={f}
								onClick={() => setFilterStatus(f)}
								className={`px-3 py-1 text-xs font-semibold rounded-full border transition ${
									filterStatus === f
										? f === "all"
											? "bg-blue-600 border-blue-500 text-white"
											: f === "waiting"
												? "bg-green-700 border-green-600 text-white"
												: "bg-red-700 border-red-600 text-white"
										: "bg-transparent border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200"
								}`}
							>
								{f === "all"
									? "Todas"
									: f === "waiting"
										? "Esperando"
										: "En Partida"}
							</button>
						))}
					</div>
				</div>

				{user ? (
					<button
						onClick={() => setShowCreateModal(true)}
						className="bg-green-700 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold transition shadow-lg shadow-green-900/30 border border-green-600/50"
					>
						+ Crear Sala
					</button>
				) : (
					<div className="text-right">
						<button
							disabled
							className="bg-gray-800 text-gray-600 px-5 py-2.5 rounded-lg font-bold cursor-not-allowed border border-gray-700"
						>
							+ Crear Sala
						</button>
						<p className="text-xs text-gray-600 mt-1">
							Solo usuarios registrados
						</p>
					</div>
				)}
			</div>

			<RoomList
				rooms={filteredRooms}
				selectedRoom={selectedRoom}
				onSelectRoom={setSelectedRoom}
				isLoading={isLoadingRooms}
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
