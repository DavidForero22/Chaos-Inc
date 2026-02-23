import { useParams } from "react-router-dom";
import { useLiveGame } from "../hooks/useLiveGame.ts";

export default function GameBoard() {
	const { id } = useParams();
	const { gameData, loading, myPlayerName } = useLiveGame(id);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-[70vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
				<h2 className="text-xl text-gray-400 animate-pulse">
					Repartiendo cartas...
				</h2>
			</div>
		);
	}

	if (!gameData || !myPlayerName) return null;

	const { me, game } = gameData;

	return (
		<div className="max-w-6xl mx-auto mt-4 flex flex-col h-[85vh]">
			{/* CABECERA */}
			<div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 mb-4 flex justify-between items-center shrink-0">
				<h1 className="text-xl font-bold text-white flex items-center gap-2">
					⚔️ Chaos Inc.
					<span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-700 font-mono">
						SALA: {id}
					</span>
				</h1>
				<div className="text-right">
					<p className="text-gray-400 text-xs uppercase font-bold">
						Turno Actual
					</p>
					<p className="text-blue-400 font-bold">
						{game.current_turn === myPlayerName
							? "👉 TU TURNO"
							: `👤 ${game.current_turn}`}
					</p>
				</div>
			</div>

			{/* MESA CENTRAL (Rivales) */}
			<div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-800 p-6 flex flex-wrap justify-center items-center gap-6 overflow-y-auto relative">
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
					<span className="text-9xl">🃏</span>
				</div>

				{game.opponents.map((player) => (
					<div
						key={player.name}
						className={`bg-gray-800 p-4 rounded-lg border-2 w-48 text-center shadow-xl z-10 ${player.role === "boss" ? "border-yellow-600" : "border-gray-700"}`}
					>
						{player.role === "boss" && (
							<div className="text-2xl mb-1" title="Este jugador es el Jefe">
								👑
							</div>
						)}
						<h3 className="text-white font-bold truncate">{player.name}</h3>

						<div className="mt-3 bg-gray-900 rounded p-2 border border-gray-700">
							<p className="text-xs text-gray-500 uppercase">Estrés</p>
							<p className="text-lg font-black text-red-500">
								{player.stress}%
							</p>
						</div>
					</div>
				))}
			</div>

			{/* ZONA DEL JUGADOR (Tus cartas y tu info) */}
			<div className="mt-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shrink-0 flex gap-6 items-end">
				{/* Tu Info */}
				<div className="bg-gray-900 p-4 rounded-lg border border-gray-700 min-w-50">
					<h3 className="text-blue-400 font-bold truncate mb-3">
						{me.name} (Tú)
					</h3>
					<div className="flex justify-between items-center mb-2">
						<span className="text-xs text-gray-500 uppercase">Tu Rol</span>
						<span
							className={`text-sm font-bold ${me.role === "boss" ? "text-yellow-400" : "text-green-400"}`}
						>
							{me.role === "boss" ? "👑 JEFE" : "💼 EMPLEADO"}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-xs text-gray-500 uppercase">Estrés</span>
						<span className="text-sm font-bold text-red-500">{me.stress}%</span>
					</div>
				</div>

				{/* Tus Cartas */}
				<div className="flex-1 border-l border-gray-700 pl-6">
					<p className="text-xs text-gray-500 uppercase font-bold mb-3">
						Tu Mano
					</p>
					<div className="flex gap-3">
						{me.cards.map((cardId, index) => (
							<div
								key={`${cardId}-${index}`}
								className="bg-gray-700 hover:bg-gray-600 hover:-translate-y-2 transition-transform cursor-pointer w-24 h-36 rounded-lg border border-gray-500 flex items-center justify-center shadow-lg"
							>
								<span className="text-3xl text-gray-400 font-mono">
									{cardId}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
