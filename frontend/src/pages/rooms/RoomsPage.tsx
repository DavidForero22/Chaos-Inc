// src/pages/RoomsPage.tsx
// Accesibilidad comprobada: SI

import { useState } from "react";
import { useLobby } from "../../hooks/useLobby";
import RoomList from "../../components/rooms/RoomList";
import CreateRoomModal from "../../components/rooms/CreateRoomModal";
import GuestNameModal from "../../components/lobby/GuestNameModal";
import styles from "./RoomsPage.module.css";
import { useAuthStore } from "../../store/auth/useAuthStore.ts";
import RoomPasswordBoard from "../../components/lobby/RoomPasswordModal.tsx";

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

	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [passwordError, setPasswordError] = useState("");

	const { user, isGuest } = useAuthStore();
	const isAlreadyInRoom = !!activeRoomId;
	const canCreateRoom = !!user && !isGuest;

	const executeJoin = async (password: string = "") => {
		setPasswordError(""); // Limpiar errores previos
		try {
			await handleJoinRoom(password);
			setShowPasswordModal(false);
		} catch (error: any) {
			const errorMsg =
				error.response?.data?.error || "Error al unirse a la sala";
			if (showPasswordModal) {
				setPasswordError(errorMsg); // Si el modal está abierto, mostrar el error ahí
			} else {
				alert(errorMsg); // Fallback para salas públicas que fallen
			}
		}
	};

	const checkPasswordAndJoin = () => {
		const roomInfo = filteredRooms.find((r) => r.room_id === selectedRoom);
		if (roomInfo?.is_private) {
			setShowPasswordModal(true);
		} else {
			executeJoin("");
		}
	};

	const onJoinClick = () => {
		if (user) {
			checkPasswordAndJoin();
		} else {
			setShowGuestModal(true);
		}
	};

	const handleGuestSuccess = () => {
		setShowGuestModal(false);
		checkPasswordAndJoin(); // Una vez tiene nombre, comprobamos si la sala pide clave
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
		<main className="pl-6 pb-10">
			{/* ── CABECERA ── */}
			<header className="mb-6">
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
						<label htmlFor="room-name-search" className="sr-only">
							Buscar sala por nombre
						</label>
						<input
							id="room-name-search"
							type="text"
							placeholder="Buscar por nombre..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className={styles.searchInput}
							aria-label="Buscar sala por nombre"
						/>
					</div>

					{/* Filtros */}
					<div
						className={styles.filters}
						role="group"
						aria-label="Filtros de estado de sala"
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
								aria-label={`Mostrar salas ${f === "all" ? "todas" : f === "waiting" ? "en espera" : "en partida"}`}
								aria-pressed={filterStatus === f}
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
			</header>

			{/* ── LISTA DE SALAS ── */}
			<section aria-label="Lista de salas disponibles">
				<RoomList
					rooms={filteredRooms}
					selectedRoom={selectedRoom}
					onSelectRoom={setSelectedRoom}
					isLoading={isLoadingRooms}
				/>
			</section>

			{/* ── PIE: CREAR + UNIRSE ── */}
			<footer className={styles.listFooter}>
				<div>
					{/* Si está validando la sala con el servidor, no mostrar el botón activado aún */}
					{isValidatingRoom ? (
						<div className={styles.createBtnWrapper}>
							<button
								disabled
								className={styles.createBtnLocked}
								style={{ opacity: 0.5 }}
								aria-label="Crear sala no disponible, validando conexión"
								aria-disabled="true"
							>
								+ Crear Sala
							</button>
						</div>
					) : canCreateRoom && !isAlreadyInRoom ? (
						<button
							onClick={() => setShowCreateModal(true)}
							className={styles.createBtn}
							aria-label="Crear nueva sala"
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
								aria-label={lockedMessage}
								aria-disabled="true"
							>
								+ Crear Sala
							</button>
							<p className={styles.lockedNote} role="status" aria-live="polite">
								{lockedMessage}
							</p>
						</div>
					)}
				</div>

				<button
					disabled={isJoinDisabled}
					onClick={onJoinClick}
					title={joinTitle}
					className={isJoinDisabled ? styles.joinBtnDisabled : styles.joinBtn}
					style={isAlreadyInRoom ? { cursor: "not-allowed" } : {}}
					aria-label={
						!user && !isJoinDisabled
							? "Entrar como Invitado"
							: "Unirse a la Sala"
					}
					aria-disabled={isJoinDisabled}
				>
					{!user && !isJoinDisabled
						? "Entrar como Invitado"
						: "Unirse a la Sala"}
				</button>
			</footer>

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

			{showPasswordModal && selectedRoom && (
				<RoomPasswordBoard
					roomId={selectedRoom}
					error={passwordError}
					onCancel={() => {
						setShowPasswordModal(false);
						setPasswordError("");
					}}
					onSubmit={executeJoin}
				/>
			)}
		</main>
	);
}
