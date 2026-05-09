// src/pages/RoomsPage.tsx

import { useState } from "react";
import { useLobby } from "../../hooks/useLobby";
import RoomList from "../../components/rooms/RoomList";
import CreateRoomModal from "../../components/rooms/CreateRoomModal";
import GuestNameModal from "../../components/lobby/GuestNameModal";
import ActiveGameWarning from "../../components/rooms/ActiveGameWarning";
import styles from "./RoomsPage.module.css";
import { useAuthStore } from "../../store/useAuthStore";

export default function RoomsPage() {
	const {
		filteredRooms,
		selectedRoom,
		setSelectedRoom,
		filterStatus,
		setFilterStatus,
		searchQuery,
		setSearchQuery,
		handleJoinRoom,
		isLoadingRooms,
		activeRoomId,
		isValidatingRoom,
	} = useLobby();

	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showGuestModal, setShowGuestModal] = useState(false);

	const { user, isGuest } = useAuthStore();

	const isAlreadyInRoom = !!activeRoomId;
	const canCreateRoom = !!user && !isGuest;

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
		filteredRooms.find((r) => r.room_id === selectedRoom)?.status !==
			"waiting" ||
		isAlreadyInRoom;

	const joinTitle = isAlreadyInRoom
		? "Ya estás en una sala"
		: !selectedRoom
			? "No has elegido ninguna sala"
			: undefined;

	// Lógica limpia para el mensaje de bloqueo del botón de crear sala
	let lockedMessage = "";
	if (!user) {
		lockedMessage = "Inicie sesión con una cuenta para crear salas.";
	} else if (isGuest) {
		lockedMessage =
			"Los invitados no pueden abrir salas. Regístrese para acceder.";
	} else if (isAlreadyInRoom) {
		lockedMessage = "Abandone su partida actual para crear una nueva.";
	}

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

				{/* Buscador + Filtros */}
				<div className={styles.controlsGrid}>
					{/* Buscador */}
					<div className={styles.searchBlock}>
						<input
							id="room-name-search"
							type="text"
							placeholder="Buscar por nombre..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className={styles.searchInput}
						/>
					</div>

					{/* Filtros */}
					<div className={styles.filters}>
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
			</div>

			{/* ── LISTA DE SALAS ── */}
			<RoomList
				rooms={filteredRooms}
				selectedRoom={selectedRoom}
				onSelectRoom={setSelectedRoom}
				isLoading={isLoadingRooms}
			/>

			{/* ── PIE: CREAR + UNIRSE ── */}
			<div className={styles.listFooter}>
				<div>
					{/* Si está validando la sala con el servidor, no mostrar el botón activado aún */}
					{isValidatingRoom ? (
						<div className={styles.createBtnWrapper}>
							<button
								disabled
								className={styles.createBtnLocked}
								style={{ opacity: 0.5 }}
							>
								+ Crear Sala
							</button>
						</div>
					) : canCreateRoom && !isAlreadyInRoom ? (
						<button
							onClick={() => setShowCreateModal(true)}
							className={styles.createBtn}
						>
							+ Crear Sala
						</button>
					) : (
						<div className={styles.createBtnWrapper}>
							<button
								disabled
								className={styles.createBtnLocked}
								title={
									isAlreadyInRoom
										? "Ya estás en una sala"
										: "No tienes permisos"
								}
								style={{ cursor: "not-allowed" }}
							>
								+ Crear Sala
							</button>
							<p className={styles.lockedNote}>{lockedMessage}</p>
						</div>
					)}
				</div>

				<button
					disabled={isJoinDisabled}
					onClick={onJoinClick}
					title={joinTitle}
					className={isJoinDisabled ? styles.joinBtnDisabled : styles.joinBtn}
					style={isAlreadyInRoom ? { cursor: "not-allowed" } : {}}
				>
					{!user && !isJoinDisabled
						? "Entrar como Invitado"
						: "Unirse a la Sala"}
				</button>
			</div>

			{/* ── MODALES Y AVISOS ── */}
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

			{/* AVISO DE PARTIDA EN CURSO: Solo se muestra si NO estamos validando y realmente hay sala */}
			{!isValidatingRoom && activeRoomId && (
				<ActiveGameWarning roomId={activeRoomId} />
			)}
		</div>
	);
}
