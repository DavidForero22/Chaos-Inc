// src/components/lobby/RoomList.tsx
// Accesibilidad comprobada: SI

import type { RoomData } from "../../types/api";
import styles from "./RoomList.module.css";

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
	const playerCount = (room: RoomData) => room.players?.length || 0;
	const isFull = (room: RoomData) => playerCount(room) >= room.max_players;

	return (
		<div className={styles.listContainer}>
			{/* ── OVERLAY: Cargando ── */}
			{isLoading && (
				<div className={styles.loadingOverlay} role="status" aria-live="polite">
					<div className={styles.loadingSpinner} aria-hidden="true" />
					<span className={styles.loadingText}>Consultando salas...</span>
				</div>
			)}

			{/* ── ESTADO VACÍO ── */}
			{!isLoading && rooms.length === 0 && (
				<div className={styles.emptyState} role="status" aria-live="polite">
					[ No se han encontrado salas con este filtro ]
				</div>
			)}

			{/* ── LISTA DE SALAS ── */}
			{!isLoading && (
				<div role="list" aria-label="Lista de salas disponibles">
					{rooms.map((room) => {
						const isDebug = room.is_debug === "1";
						const isRoomFull = isFull(room);
						const isSelected = selectedRoom === room.room_id;

						return (
							<div
								key={room.room_id}
								onClick={() => onSelectRoom(room.room_id)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										onSelectRoom(room.room_id);
									}
								}}
								role="button"
								tabIndex={0}
								aria-label={`Sala ${room.name}, ${room.is_private === "1" ? "privada" : "pública"}, ${room.status === "waiting" ? "esperando jugadores" : "en partida"}, ${playerCount(room)} de ${room.max_players} jugadores`}
								aria-selected={isSelected}
								className={`${styles.roomRow} ${
									isSelected ? styles.roomRowSelected : ""
								} ${isDebug ? "border-l-4 border-[#cbbe34] bg-[#cbbe34]/10" : ""}`}
							>
								{/* Columna izquierda: info principal */}
								<div className={styles.roomInfo}>
									<div className={styles.roomName}>
										<span className={styles.roomPrivateIcon} aria-hidden="true">
											{room.is_private === "1" ? "🔒" : "○"}
										</span>
										<span>{room.name}</span>

										{/* BADGE DE ESTADO */}
										{room.status === "waiting" ? (
											<span className={styles.badgeWaiting}>Esperando</span>
										) : (
											<span className={styles.badgeInGame}>En Partida</span>
										)}

										{/* BADGE DE DEBUG */}
										{isDebug && (
											<span className="ml-2 bg-[#8ec45d] text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
												Pruebas
											</span>
										)}
									</div>

									<div className={styles.roomOwner}>
										Creada por{" "}
										<span className={styles.roomOwnerName}>
											{room.owner_name}
										</span>
									</div>

									{room.players && room.players.length > 0 && (
										<div
											className={styles.roomPlayers}
											aria-label={`Jugadores: ${room.players.map((player) => player.name).join(", ")}`}
										>
											{room.players.map((player) => player.name).join(" · ")}
										</div>
									)}
								</div>

								{/* Columna derecha: ID y capacidad */}
								<div className={styles.roomMeta}>
									<span
										className={styles.roomId}
										aria-label={`ID de sala: ${room.room_id}`}
									>
										{room.room_id}
									</span>
									<span
										className={`${styles.roomCapacity} ${
											isRoomFull ? styles.roomCapacityFull : ""
										}`}
										aria-label={`Capacidad: ${playerCount(room)} de ${room.max_players} jugadores${isRoomFull ? ", sala llena" : ""}`}
									>
										{playerCount(room)} / {room.max_players}
									</span>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
