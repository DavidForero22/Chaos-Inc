// src/components/admin/RoomsTab.tsx

import { useEffect, useState } from "react";
import { useRoomsData } from "../../hooks/admin/useRoomsData";

export default function RoomsTab() {
	const { rooms, loading, fetchRooms, deleteRoom } = useRoomsData();
	const [deletingId, setDeletingId] = useState<string | null>(null);

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

	if (loading) {
		return (
			<div className="pl-6 pb-10 flex justify-center items-center h-[60vh]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#295c60]"></div>
				<span className="ml-3 font-mono">Cargando salas activas...</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<h3 className="font-bold text-lg underline decoration-2 uppercase mb-2">
				Salas Activas
			</h3>

			{rooms.length === 0 ? (
				<p className="py-8 text-center text-sm opacity-50 italic uppercase tracking-widest">
					No hay salas activas en este momento.
				</p>
			) : (
				<div className="flex flex-col">
					{rooms.map((room) => (
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
											className={`text-xs px-2 py-0.5 border rounded-full ${room.status === "playing" ? "border-green-600 text-green-700 bg-green-100" : "border-yellow-600 text-yellow-700 bg-yellow-100"}`}
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
											{room.players.length} / {room.max_players}
										</p>
										<p>
											<span className="font-bold">Privada:</span>{" "}
											{room.is_private ? "Sí" : "No"}
											{room.is_debug && (
												<span className="ml-2 text-red-600">(DEBUG)</span>
											)}
										</p>
										<p>
											<span className="font-bold">Timeout turno:</span>{" "}
											{room.turn_timeout}s
										</p>
										<div className="flex flex-wrap gap-1 mt-1">
											{room.players.map((p) => (
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
								<div className="ml-4">
									<button
										onClick={() => handleDelete(room.room_id)}
										disabled={deletingId === room.room_id}
										className="px-4 py-2 bg-red-600 text-white text-xs font-bold uppercase cursor-pointer rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
									>
										{deletingId === room.room_id
											? "ELIMINANDO..."
											: "ELIMINAR SALA"}
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
