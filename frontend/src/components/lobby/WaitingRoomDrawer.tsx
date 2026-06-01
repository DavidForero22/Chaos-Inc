// src/components/rooms/WaitingRoomDrawer.tsx
import { useState } from "react";
import {
	FaShareAlt,
	FaCheck,
	FaTools,
	FaTimes,
	FaUsers,
	FaCrown,
} from "react-icons/fa";
import type { RoomData } from "../../types/api";

interface WaitingRoomDrawerProps {
	room: RoomData;
	isOwner: boolean;
	currentUserId: string | number | null;
	missingPlayers: number;
	onLeave: () => void;
	onStart: () => void;
	onKick: (playerId: string) => void;
	onShare: () => void;
	copied: boolean;
}

export default function WaitingRoomDrawer({
	room,
	isOwner,
	currentUserId,
	missingPlayers,
	onLeave,
	onStart,
	onKick,
	onShare,
	copied,
}: WaitingRoomDrawerProps) {
	const [isOpen, setIsOpen] = useState(true);
	const isDebugRoom = room.is_debug === true;

	// --- LÓGICA DE INICIO ---
	const currentPlayers = room.players?.length || 0;
	const MIN_PLAYERS = 3;
	const canStart = currentPlayers >= MIN_PLAYERS;
	const missingForMin = Math.max(0, MIN_PLAYERS - currentPlayers);

	return (
		<>
			{/* BOTÓN FLOTANTE (Solo visible si el panel está cerrado) */}
			{!isOpen && (
				<button
					onClick={() => setIsOpen(true)}
					className="fixed -right-2 top-25 pr-5 z-40 bg-blue-600 text-white p-3 rounded-l-lg shadow-[-4px_0_15px_rgba(0,0,0,0.2)] flex items-center gap-2 hover:bg-blue-700 transition-transform transform hover:-translate-x-1"
					aria-label="Abrir panel de la sala"
				>
					<FaUsers size={20} />
					<span className="font-bold">
						{currentPlayers}/{room.max_players}
					</span>
				</button>
			)}

			{/* OVERLAY OSCURO */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/20 z-40 sm:hidden"
					onClick={() => setIsOpen(false)}
				/>
			)}

			{/* PANEL LATERAL (DRAWER) */}
			<div
				className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-[#fdfbf2] shadow-[-5px_0_25px_rgba(0,0,0,0.3)] z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l-4 border-black ${
					isOpen ? "translate-x-0" : "translate-x-full"
				}`}
			>
				{/* CABECERA */}
				<header className="flex flex-col p-4 border-b-2 border-black bg-white">
					<div className="flex justify-between items-start mb-2">
						<h2
							className="text-2xl font-black uppercase truncate pr-2"
							style={{ fontFamily: "'Kalam', cursive" }}
						>
							{room.name}
						</h2>
						<button
							onClick={() => setIsOpen(false)}
							className="p-1 hover:bg-gray-200 rounded"
						>
							<FaTimes size={20} />
						</button>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-xs font-bold text-gray-500 font-mono tracking-wider">
							ID: {room.room_id}
						</span>
						<button
							onClick={onShare}
							className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded transition-colors ${copied ? "bg-green-100 text-green-700" : "bg-gray-200 hover:bg-blue-100 hover:text-blue-700"}`}
						>
							{copied ? <FaCheck /> : <FaShareAlt />}
							{copied ? "¡Copiado!" : "Compartir"}
						</button>
					</div>

					{isDebugRoom && (
						<div className="mt-2 flex items-center gap-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded border border-yellow-300 w-fit">
							<FaTools /> Pruebas
						</div>
					)}
				</header>

				{/* LISTA DE JUGADORES */}
				<div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
					<div className="flex justify-between items-end mb-4 border-b border-gray-300 pb-2">
						<h3 className="font-bold text-gray-700">JUGADORES</h3>
						<span className="font-black text-blue-600">
							{currentPlayers} / {room.max_players}
						</span>
					</div>

					<ul className="flex flex-col gap-3">
						{room.players?.map((player) => {
							const isMe = String(player.id) === String(currentUserId);
							const isLeader = String(player.id) === String(room.owner_id);

							return (
								<li
									key={player.id}
									className="flex items-center justify-between bg-white border-2 border-gray-800 rounded p-2 shadow-sm"
								>
									<div className="flex items-center gap-3 overflow-hidden">
										{/* Avatar / Iniciales */}
										<div className="w-10 h-10 shrink-0 bg-gray-200 border border-gray-400 rounded-full flex items-center justify-center font-black text-gray-500 overflow-hidden">
											{player.avatar ? (
												<img
													src={player.avatar}
													alt=""
													className="w-full h-full object-cover"
													referrerPolicy="no-referrer"
												/>
											) : (
												player.name.substring(0, 2).toUpperCase()
											)}
										</div>

										<div className="flex flex-col truncate">
											<span className="font-bold truncate text-sm flex items-center gap-1">
												{player.name}
												{isMe && (
													<span className="text-xs italic text-blue-600 font-normal">
														(Tú)
													</span>
												)}
											</span>
											{/* Si tienes nivel del backend, ponlo aquí. Si no, quita este span */}
											<span className="text-[10px] text-gray-500 uppercase tracking-wide">
												Nivel {player.level || 1}
											</span>
										</div>
									</div>

									<div className="flex items-center gap-2 shrink-0">
										{isLeader && (
											<FaCrown
												className="text-yellow-500 text-xl"
												title="Líder de la sala"
											/>
										)}

										{/* Botón Expulsar: Solo si soy dueño, y el jugador no soy yo */}
										{isOwner && !isMe && (
											<button
												onClick={() => onKick(String(player.id))}
												className="w-8 h-8 flex items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-600 hover:text-white border border-transparent hover:border-red-800 transition-colors"
												title={`Expulsar a ${player.name}`}
												aria-label="Expulsar"
											>
												<FaTimes size={14} />
											</button>
										)}
									</div>
								</li>
							);
						})}

						{/* Slots vacíos */}
						{Array.from({ length: missingPlayers }).map((_, i) => (
							<li
								key={`empty-${i}`}
								className="flex items-center gap-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded p-2 opacity-60"
							>
								<div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
								<span className="text-sm italic font-medium text-gray-400">
									Esperando...
								</span>
							</li>
						))}
					</ul>
				</div>

				{/* CONTROLES INFERIORES */}
				<footer className="p-4 bg-gray-100 border-t-2 border-black flex flex-col gap-3">
					<button
						onClick={onStart}
						// Botón deshabilitado si no llegamos a 3 jugadores o si no es el dueño
						disabled={!canStart || !isOwner}
						className={`w-full py-3 rounded font-black uppercase tracking-wider text-sm transition-all ${
							!canStart || !isOwner
								? "bg-gray-300 text-gray-500 cursor-not-allowed"
								: "bg-green-600 text-white border-2 border-green-800 shadow-[4px_4px_0_0_#166534] hover:translate-y-1 hover:shadow-[0_0_0_0_#166534]"
						}`}
					>
						{!isOwner
							? "Esperando al líder..."
							: !canStart
								? `Faltan ${missingForMin} mínimo`
								: "Empezar Partida"}
					</button>

					<button
						onClick={onLeave}
						className="w-full py-2 text-sm font-bold text-red-600 uppercase hover:bg-red-100 rounded transition-colors"
					>
						Abandonar Sala
					</button>
				</footer>
			</div>
		</>
	);
}
