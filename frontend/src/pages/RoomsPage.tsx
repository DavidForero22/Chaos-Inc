// src/pages/RoomsPage.tsx

import { useState } from "react";
import { useLobby } from "../hooks/useLobby";
import RoomList from "../components/lobby/RoomList";
import CreateRoomModal from "../components/lobby/CreateRoomModal";
import GuestNameModal from "../components/lobby/GuestNameModal";
import styles from "./RoomsPage.module.css";

export default function RoomsPage() {
	const {
		filteredRooms,
		selectedRoom,
		setSelectedRoom,
		filterStatus,
		setFilterStatus,
		handleJoinRoom,
		user,
		isLoadingRooms,
	} = useLobby();

	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showGuestModal, setShowGuestModal] = useState(false);

	const onJoinClick = () => {
		if (user) {
			handleJoinRoom();
		} else {
			setShowGuestModal(true);
		}
	};

	const handleGuestSuccess = () => {
		setShowGuestModal(false);
		handleJoinRoom();
	};

	const isJoinDisabled =
		!selectedRoom ||
		filteredRooms.find((r) => r.room_id === selectedRoom)?.status !== "waiting";

	const canCreate = !!user && !user.startsWith("guest_");

	return (
		<div className="pl-6 pb-10">
			{/* ── CABECERA ── */}
			<div className="mb-6">
				{/* Títulos ocupando todo el ancho */}
				<h1
					className="text-4xl mb-6 font-black"
					style={{ color: "var(--color-lomo)" }}
				>
					LISTADO DE SALAS
				</h1>
				<h2 className="text-xl mb-6 opacity-80 border-b border-gray-400 pb-2 font-bold">
					Seleccione una sala activa.
				</h2>

				{/* Fila de controles: Filtros (Izquierda) - Botón Crear (Derecha) */}
				<div className="flex justify-between items-end pr-2">
					{/* Filtros de estado */}
					<div className={styles.filters} style={{ marginBottom: 0 }}>
						{(["all", "waiting", "in_game"] as const).map((f) => (
							<button
								key={f}
								onClick={() => setFilterStatus(f)}
								className={`${styles.filterBtn} ${
									f === "all"
										? styles.filterAll
										: f === "waiting"
											? styles.filterWaiting
											: styles.filterInGame
								} ${filterStatus === f ? styles.filterActive : ""}`}
							>
								{f === "all"
									? "Todas"
									: f === "waiting"
										? "Esperando"
										: "En Partida"}
							</button>
						))}
					</div>

					{/* Botón Crear Sala a la derecha */}
					<div>
						{canCreate ? (
							<button
								onClick={() => setShowCreateModal(true)}
								className={styles.createBtn}
							>
								+ Crear Sala
							</button>
						) : (
							<div className={styles.createBtnWrapper}>
								<button disabled className={styles.createBtnLocked}>
									+ Crear Sala
								</button>
								<p className={styles.lockedNote}>
									{user
										? "Los invitados no pueden abrir salas. Regístrese para acceder."
										: "Inicie sesión con una cuenta para crear salas."}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ── LISTA DE SALAS ── */}
			<RoomList
				rooms={filteredRooms}
				selectedRoom={selectedRoom}
				onSelectRoom={setSelectedRoom}
				isLoading={isLoadingRooms}
			/>

			{/* ── PIE: BOTÓN UNIRSE ── */}
			<div className={styles.listFooter}>
				<button
					disabled={isJoinDisabled}
					onClick={onJoinClick}
					className={isJoinDisabled ? styles.joinBtnDisabled : styles.joinBtn}
				>
					{!user && !isJoinDisabled
						? "Entrar como Invitado"
						: "Unirse a la Sala"}
				</button>
			</div>

			{/* ── MODALES ── */}
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
