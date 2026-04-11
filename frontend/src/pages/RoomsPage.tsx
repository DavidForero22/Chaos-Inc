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

	// Solo los usuarios con cuenta registrada (no invitados) pueden crear sala
	const canCreate = !!user && !user.startsWith("guest_"); // ajusta según tu lógica

	return (
		<div>
			{/* ── CABECERA ── */}
			<div className={styles.pageHeader}>
				<div className={styles.titleBlock}>
					<h1 className={styles.pageTitle}>Listado de Salas</h1>
					<p className={styles.pageSubtitle}>
						Seleccione una sala activa.
					</p>

					{/* Filtros de estado */}
					<div
						className={styles.filters}
						style={{ paddingLeft: 0, marginTop: "0.25rem" }}
					>
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
				</div>

				{/* Botón Crear Sala */}
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
								? // Está logueado como invitado
									"Los invitados no pueden abrir salas. Regístrese para acceder."
								: // No tiene sesión
									"Inicie sesión con una cuenta para crear salas."}
						</p>
					</div>
				)}
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
