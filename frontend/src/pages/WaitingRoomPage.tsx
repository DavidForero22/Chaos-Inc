// src/pages/WaitingRoomPage.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoom } from "../hooks/room/useRoom.ts";
import { useLoadingStore } from "../store/useLoadingStore.ts";
import { FaShareAlt, FaCheck } from "react-icons/fa";

import GuestNameModal from "../components/lobby/GuestNameModal.tsx";
import BoardPlayerList from "../components/lobby/BoardPlayerList.tsx";
import RoomPasswordBoard from "../components/lobby/RoomPasswordBoard.tsx";
import WallLayout from "../layouts/WallLayout.tsx";
import styles from "./WaitingRoomPage.module.css";

export default function WaitingRoomPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { startLoading, stopLoading } = useLoadingStore();

	const {
		room,
		user,
		isJoining,
		needsPassword,
		passwordError,
		attemptJoin,
		handleLeaveRoom,
		startGame,
		kickPlayer,
	} = useRoom(id);

	const [showGuestModal, setShowGuestModal] = useState(false);

	// --- ESTADO PARA EL FEEDBACK DE COPIA ---
	const [copied, setCopied] = useState(false);

	const missingPlayers = 3 - (room?.players.length || 0);
	const isOwner = room?.owner_name === user;

	useEffect(() => {
		if (!isJoining && !user && !showGuestModal) {
			setShowGuestModal(true);
		}
	}, [isJoining, user, showGuestModal]);

	const onLeaveClick = async () => {
		startLoading("Saliendo de la sala...");
		try {
			await handleLeaveRoom();
		} finally {
			stopLoading();
		}
	};

	const onKickClick = async (playerIdToKick: string) => {
		const playerObj = room?.players.find((p) => p.id === playerIdToKick);
		const playerName = playerObj;

		startLoading(`Expulsando a ${playerName}...`);
		try {
			await kickPlayer(playerIdToKick);
		} finally {
			stopLoading();
		}
	};

	// --- FUNCIÓN PARA COPIAR AL PORTAPAPELES ---
	const handleShare = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("No se pudo copiar el enlace", err);
		}
	};

	// 1. Estado: Cargando/Conectando
	if (isJoining) {
		return (
			<WallLayout boardWidth="500px">
				<div className="flex flex-col items-center justify-center text-center">
					<div className="animate-spin inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
					<p
						className={`${styles.markerBlue} animate-pulse font-bold text-xl`}
						style={{ fontFamily: "'Kalam', cursive" }}
					>
						Conectando a la sala...
					</p>
					{!user && (
						<p
							className={`${styles.markerBlack} text-sm mt-4 italic opacity-70`}
						>
							Esperando identificación...
						</p>
					)}
				</div>
			</WallLayout>
		);
	}

	// 2. Estado: Invitado sin nombre
	if (showGuestModal) {
		return (
			<GuestNameModal
				onClose={() => navigate("/")}
				onSuccess={() => {
					setShowGuestModal(false);
					attemptJoin();
				}}
			/>
		);
	}

	// 3. Estado: Petición de contraseña
	if (needsPassword) {
		return (
			<RoomPasswordBoard
				roomId={id || ""}
				error={passwordError}
				onCancel={() => navigate("/")}
				onSubmit={attemptJoin}
			/>
		);
	}

	// 4. Estado: Faltan datos de la sala
	if (!room) {
		return (
			<WallLayout boardWidth="500px">
				<div className="text-center">
					<p
						className={`${styles.markerBlack} font-bold text-xl`}
						style={{ fontFamily: "'Kalam', cursive" }}
					>
						Cargando datos de la sala...
					</p>
				</div>
			</WallLayout>
		);
	}

	// 5. Estado: Pizarra Principal de la Sala
	return (
		<WallLayout>
			<h1 className={`${styles.title} ${styles.markerBlack}`}>
				SALA: <span className={styles.markerBlue}>{room.name}</span>
			</h1>

			{/* --- BOTÓN DE COMPARTIR --- */}
			<div className="flex justify-center mb-10 mt-4">
				<button
					onClick={handleShare}
					className={`${styles.markerBlack} flex items-center gap-3 px-4 py-2 border-2 border-dashed border-gray-400 rounded hover:bg-gray-100 transition-colors`}
					title="Copiar enlace de la sala"
				>
					<span className={styles.subtitle} style={{ marginBottom: 0 }}>
						CÓDIGO: <span className={styles.markerRed}>{id}</span>
					</span>

					{/* Feedback visual interactivo */}
					{copied ? (
						<span className="flex items-center gap-1 text-green-600 text-sm font-bold">
							<FaCheck /> ¡Copiado!
						</span>
					) : (
						<span className="flex items-center gap-1 text-gray-500 text-sm hover:text-blue-600 transition-colors">
							<FaShareAlt /> Compartir
						</span>
					)}
				</button>
			</div>

			<div className="flex justify-between items-end mb-2">
				<h3
					className={`${styles.markerBlack} font-black text-lg underline decoration-2`}
				>
					JUGADORES
				</h3>
				<span
					className={`${styles.markerBlue} font-bold`}
					style={{ fontFamily: "'Kalam', cursive", fontSize: "1.2rem" }}
				>
					{room.players.length} / {room.max_players}
				</span>
			</div>

			<BoardPlayerList
				players={room.players}
				maxPlayers={room.max_players}
				ownerName={room.owner_name}
				user={user}
				onKickClick={onKickClick}
			/>

			<div className="flex justify-between items-center mt-12 border-t-2 border-gray-300 pt-6">
				<button
					onClick={onLeaveClick}
					className={`${styles.btnBase} ${styles.btnLeave}`}
				>
					Abandonar Sala
				</button>

				<button
					onClick={startGame}
					disabled={missingPlayers > 0 || !isOwner}
					className={`${styles.btnBase} ${styles.btnStart}`}
					title={
						!isOwner
							? "Solo el líder puede iniciar la partida"
							: missingPlayers > 0
								? `Faltan ${missingPlayers} para poder empezar la partida`
								: "Comenzar la partida"
					}
				>
					{missingPlayers > 0
						? missingPlayers === 1
							? "Falta 1 jugador"
							: `Faltan ${missingPlayers} jugadores`
						: !isOwner
							? "Esperando al líder..."
							: "Empezar partida"}
				</button>
			</div>
		</WallLayout>
	);
}
