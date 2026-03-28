// src/pages/WaitingRoomPage.tsx

// -- HOOKS --
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoom } from "../hooks/room/useRoom.ts";
import { useLoadingStore } from "../store/useLoadingStore.ts"; // <-- Importamos tu loader global

// -- COMPONENTES --
import GuestNameModal from "../components/lobby/GuestNameModal.tsx";

export default function WaitingRoomPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { startLoading, stopLoading } = useLoadingStore(); // <-- Extraemos las acciones

	const {
		room,
		myPlayerName,
		isJoining,
		needsPassword,
		passwordError,
		attemptJoin,
		handleLeaveRoom,
		startGame,
		kickPlayer,
	} = useRoom(id);

	const [passwordInput, setPasswordInput] = useState("");
	const [showGuestModal, setShowGuestModal] = useState(false);

	const missingPlayers = 3 - (room?.players.length || 0);
	const isOwner = room?.owner_name === myPlayerName;

	useEffect(() => {
		if (!isJoining && !myPlayerName && !showGuestModal) {
			setShowGuestModal(true);
		}
	}, [isJoining, myPlayerName, showGuestModal]);

	// --- WRAPPERS PARA EL GLOBAL LOADER ---
	const onLeaveClick = async () => {
		startLoading("Saliendo de la sala...");
		try {
			await handleLeaveRoom();
		} finally {
			stopLoading();
		}
	};

	const onKickClick = async (playerToKick: string) => {
		startLoading(`Expulsando a ${playerToKick}...`);
		try {
			await kickPlayer(playerToKick);
		} finally {
			stopLoading();
		}
	};

	// (El startGame no le ponemos loader global porque ya redirige al tablero y tiene su propio sistema de carga ahí)

	if (isJoining) {
		return (
			<div className="flex flex-col items-center justify-center mt-20 text-white">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
				<p className="animate-pulse font-medium">Conectando a la sala...</p>

				{!myPlayerName && (
					<p className="text-xs text-gray-500 mt-4 italic">
						Esperando identificación del jugador...
					</p>
				)}
			</div>
		);
	}

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

	if (needsPassword) {
		return (
			<div className="max-w-md mx-auto mt-20 bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center">
				<h2 className="text-2xl font-bold text-white mb-4">🔒 Sala Privada</h2>
				<p className="text-gray-400 mb-6">
					Introduce la contraseña para acceder a la sala{" "}
					<span className="text-yellow-400 font-mono">{id}</span>
				</p>

				<input
					type="password"
					className="w-full p-3 mb-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-blue-500 outline-none transition"
					placeholder="Contraseña"
					value={passwordInput}
					onChange={(e) => setPasswordInput(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && attemptJoin(passwordInput)}
				/>

				{passwordError && (
					<p className="text-red-400 text-sm mb-4 text-left">{passwordError}</p>
				)}

				<div className="flex justify-end gap-3 mt-6">
					<button
						onClick={() => navigate("/")}
						className="px-5 py-2.5 text-gray-400 hover:text-white transition"
					>
						Volver al Menú
					</button>
					<button
						onClick={() => attemptJoin(passwordInput)}
						className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg shadow-blue-900/20"
					>
						Entrar
					</button>
				</div>
			</div>
		);
	}

	if (!room) {
		return (
			<div className="text-center text-white mt-20">
				Cargando datos de la sala...
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto mt-12 bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 text-center">
			<h1 className="text-3xl font-bold text-white mb-2">{room.name}</h1>
			<p className="text-gray-400 font-mono text-xl mb-8">
				Código de invitación: <span className="text-yellow-400">{id}</span>
			</p>

			<div className="bg-gray-900 p-6 rounded-lg mb-8 text-left">
				<div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
					<h3 className="text-lg font-bold text-blue-400">
						Jugadores Conectados
					</h3>
					<span className="text-sm text-gray-400">
						{room.players.length} / {room.max_players}
					</span>
				</div>

				<ul className="space-y-3">
					{room.players.map((player: string) => (
						<li
							key={player}
							className="flex justify-between items-center bg-gray-800 p-2 rounded"
						>
							<div className="flex items-center gap-2 text-white">
								<span className="w-2 h-2 rounded-full bg-green-500"></span>
								{player}
								{player === myPlayerName && (
									<span className="text-xs text-blue-400 ml-2">(Tú)</span>
								)}
								{player === room.owner_name && (
									<span className="text-xs text-yellow-500 ml-2">👑 Líder</span>
								)}
							</div>

							{/* BOTÓN DE EXPULSAR (Usa el wrapper onKickClick) */}
							{room.owner_name === myPlayerName && player !== myPlayerName && (
								<button
									onClick={() => onKickClick(player)}
									className="text-xs bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white px-2 py-1 rounded border border-red-700/50 transition"
									title="Expulsar jugador"
								>
									Expulsar
								</button>
							)}
						</li>
					))}

					{room.players.length < room.max_players && (
						<li className="flex items-center gap-2 text-gray-500 italic p-2">
							<span className="w-2 h-2 rounded-full bg-gray-600 animate-pulse"></span>
							Esperando a más jugadores...
						</li>
					)}
				</ul>
			</div>

			<div className="flex justify-center gap-4">
				{/* BOTÓN DE ABANDONAR (Usa el wrapper onLeaveClick) */}
				<button
					onClick={onLeaveClick}
					className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition"
				>
					Abandonar Sala
				</button>
				<button
					onClick={startGame}
					disabled={missingPlayers > 0 || !isOwner}
					className={`px-6 py-3 rounded font-bold transition-all ${
						missingPlayers > 0 || !isOwner
							? "bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600"
							: "bg-green-600 hover:bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
					}`}
					title={
						!isOwner
							? "Solo el líder puede empezar la partida"
							: missingPlayers > 0
								? "Se necesitan al menos 3 jugadores"
								: "Empezar partida"
					}
				>
					{missingPlayers > 0
						? missingPlayers === 1
							? "Falta 1 jugador..."
							: `Faltan ${missingPlayers} jugadores...`
						: !isOwner
							? "Esperando al líder..."
							: "Empezar Partida"}
				</button>
			</div>
		</div>
	);
}
