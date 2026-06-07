import { useEffect, useState } from "react";
import { useRoomsData } from "../../hooks/admin/useRoomsData";
import EditRoomModal from "../rooms/EditRoomModal";
import type { RoomData } from "../../types/api";

export default function RoomsTab() {
	const { rooms, loading, fetchRooms, deleteRoom } = useRoomsData();
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);

	useEffect(() => {
		fetchRooms();
	}, [fetchRooms]);

	const handleDelete = async (roomId: string) => {
		if (
			!confirm(
				`¿Eliminar sala "${roomId}"? Se perderán todos los datos de la partida en curso.`,
			)
		)
			return;
		setDeletingId(roomId);
		try {
			await deleteRoom(roomId);
		} catch (e: any) {
			alert(e.response?.data?.error || "Error al eliminar sala.");
		} finally {
			setDeletingId(null);
		}
	};

	const handleCloseModal = () => {
		setEditingRoom(null);
		fetchRooms();
	};

	const normalizeRoomForModal = (room: RoomData): RoomData => ({
		...room,
		max_players: Number(room.max_players),
		turn_timeout: Number(room.turn_timeout),
		is_private: room.is_private,
		is_debug: room.is_debug,
	});

	if (loading) {
		return (
			<div
				className="pl-6 pb-10 flex justify-center items-center h-[60vh]"
				role="status"
				aria-live="polite"
			>
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#295c60]"></div>
				<span className="ml-3 font-mono">Cargando salas activas...</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 relative">
			<h2 className="font-bold text-lg underline decoration-2 uppercase mb-2">
				Salas Activas
			</h2>

			{rooms.length === 0 ? (
				<p className="py-8 text-center text-sm opacity-50 italic uppercase tracking-widest">
					No hay salas activas en este momento.
				</p>
			) : (
				<div className="flex flex-col">
					{rooms.map((room) => {
						const isPrivate = room.is_private;
						const isDebug = room.is_debug;

						return (
							<div
								key={room.room_id}
								className="py-4 border-b border-dashed border-gray-400/50"
							>
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<div className="flex flex-wrap items-center gap-2 mb-2">
											<span className="font-bold text-lg">#{room.room_id}</span>
											<span className="text-sm bg-gray-200 px-2 py-0.5 rounded-full font-mono">
												{room.name}
											</span>
											<span
												className={`text-xs px-2 py-0.5 border rounded-full ${
													room.status === "playing"
														? "border-green-600 text-green-700 bg-green-100"
														: "border-yellow-600 text-yellow-700 bg-yellow-100"
												}`}
											>
												{room.status === "playing" ? "EN PARTIDA" : "ESPERANDO"}
											</span>
										</div>
										<div className="text-sm space-y-1">
											<p>
												<span className="font-bold">Creador:</span>{" "}
												{room.owner_name} (ID: {room.owner_id})
											</p>
											<p>
												<span className="font-bold">Jugadores:</span>{" "}
												{room.players?.length || 0} / {room.max_players}
											</p>
											<p>
												<span className="font-bold">Privada:</span>{" "}
												{isPrivate ? "Sí" : "No"}
												{isDebug && (
													<span className="ml-2 text-red-600">(DEBUG)</span>
												)}
											</p>
											<p>
												<span className="font-bold">Timeout turno:</span>{" "}
												{room.turn_timeout}s
											</p>
											<div className="flex flex-wrap gap-1 mt-1">
												{room.players?.map((p) => (
													<span
														key={p.id}
														className="text-xs bg-gray-100 px-2 py-0.5 rounded"
													>
														{p.name}
													</span>
												))}
											</div>
										</div>
									</div>
									<div className="ml-4 flex flex-col gap-2">
										<button
											onClick={() => setEditingRoom(room)}
											disabled={room.status === "playing"}
											aria-label={`Editar sala ${room.name}`}
											className="px-4 py-2 bg-amber-500 text-white text-xs font-bold uppercase cursor-pointer rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full text-center"
											title={
												room.status === "playing"
													? "No se puede editar una partida en curso"
													: "Editar configuración de la sala"
											}
										>
											EDITAR SALA
										</button>
										<button
											onClick={() => handleDelete(room.room_id)}
											disabled={deletingId === room.room_id}
											aria-label={`Eliminar sala ${room.name}`}
											className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase cursor-pointer rounded hover:bg-red-700 disabled:opacity-50 transition-colors w-full text-center"
										>
											{deletingId === room.room_id
												? "ELIMINANDO..."
												: "ELIMINAR SALA"}
										</button>{" "}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* RENDERIZAR MODAL */}
			{editingRoom && (
				<div className="fixed z-60">
					<EditRoomModal
						room={normalizeRoomForModal(editingRoom)}
						onClose={handleCloseModal}
					/>
				</div>
			)}
		</div>
	);
}
