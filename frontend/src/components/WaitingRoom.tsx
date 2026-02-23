import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoom } from "../hooks/useRoom.ts";

export default function WaitingRoom() {
	const { id } = useParams();
	const navigate = useNavigate();

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

	if (isJoining) {
		return (
			<div className="text-center text-white mt-20">
				Conectando a la sala...
			</div>
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
					{room.players.map((player) => (
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

							{/* BOTÓN DE EXPULSAR */}
							{room.owner_name === myPlayerName && player !== myPlayerName && (
								<button
									onClick={() => kickPlayer(player)}
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
				<button
					onClick={handleLeaveRoom}
					className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition"
				>
					Abandonar Sala
				</button>
				<button
					onClick={startGame} // <-- Vinculamos la función aquí
					disabled={room.players.length < 2 || room.owner_name !== myPlayerName}
					className={`px-6 py-3 rounded font-bold ${room.players.length < 2 || room.owner_name !== myPlayerName ? "bg-gray-600 text-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-500 text-white"}`}
				>
					Empezar Partida
				</button>
			</div>
		</div>
	);
}
