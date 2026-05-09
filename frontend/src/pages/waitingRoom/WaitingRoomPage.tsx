// src/pages/WaitingRoomPage.tsx

import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoom } from "../../hooks/room/useRoom.ts";
import { useLoadingStore } from "../../store/useLoadingStore.ts";
import { useAuthStore } from "../../store/useAuthStore.ts";
import { FaShareAlt, FaCheck } from "react-icons/fa";

import GuestNameModal from "../../components/lobby/GuestNameModal.tsx";
import BoardPlayerList from "../../components/lobby/BoardPlayerList.tsx";
import RoomPasswordBoard from "../../components/lobby/RoomPasswordBoard.tsx";
import WallLayout from "../../layouts/WallLayout.tsx";
import styles from "./WaitingRoomPage.module.css";

export default function WaitingRoomPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { startLoading, stopLoading } = useLoadingStore();
	const currentUserId = useAuthStore((state) => state.id);

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
	const [copied, setCopied] = useState(false);

	// Detectar si la página acaba de cargar tras un login social
	const [isSocialAuthPending, setIsSocialAuthPending] = useState(
		() =>
			new URLSearchParams(window.location.search).get("login") === "success",
	);

	// Ref para evitar llamar a attemptJoin múltiples veces
	const authResolved = useRef(false);

	useEffect(() => {
		// --- CASO A: YA HAY USUARIO ---
		if (user) {
			setIsSocialAuthPending(false);
			if (showGuestModal) setShowGuestModal(false);

			// Si viene de registrarse y no ha intentado entrar a la sala, forzar la entrada
			if (!authResolved.current) {
				authResolved.current = true;
				if (!room && !isJoining) {
					attemptJoin();
				}
			}
			return;
		}

		// --- CASO B: ESTA ESPERANDO A QUE EL BACKEND DE EL USUARIO (OAUTH) ---
		if (isSocialAuthPending) {
			// Timeout de seguridad: Si pasan 4 segundos y el usuario no cargó,
			// asumir que el OAuth falló y liberar el modal para que pueda entrar como invitado.
			const fallback = setTimeout(() => setIsSocialAuthPending(false), 4000);
			return () => clearTimeout(fallback);
		}

		// --- CASO C: FLUJO NORMAL SIN USUARIO ---
		if (!isJoining && !showGuestModal) {
			setShowGuestModal(true);
		}
	}, [isJoining, user, showGuestModal, isSocialAuthPending, room, attemptJoin]);

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
		const playerName = playerObj?.name || "jugador";

		startLoading(`Expulsando a ${playerName}...`);
		try {
			await kickPlayer(playerIdToKick);
		} finally {
			stopLoading();
		}
	};

	const handleShare = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("No se pudo copiar el enlace", err);
		}
	};

	// 0. Estado de Intercepción: Verificando OAuth
	if (isSocialAuthPending) {
		return (
			<WallLayout boardWidth="500px">
				<div className="flex flex-col items-center justify-center text-center">
					<div className="animate-spin inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
					<p
						className={`${styles.markerBlue} animate-pulse font-bold text-xl`}
						style={{ fontFamily: "'Kalam', cursive" }}
					>
						Validando credenciales corporativas...
					</p>
				</div>
			</WallLayout>
		);
	}

	// 1. Estado: Cargando/Conectando normal
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
					authResolved.current = true; // Evita doble join si useAuthStore reacciona rápido
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

	const missingPlayers = 3 - (room?.players.length || 0);

	const isOwner = String(room?.owner_id) === String(currentUserId);

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

			{/* Listado de jugadores */}
			<BoardPlayerList
				players={room.players}
				maxPlayers={room.max_players}
				ownerId={room.owner_id}
				currentUserId={currentUserId}
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
