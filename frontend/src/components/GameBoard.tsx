import { useParams } from "react-router-dom";
import { useLiveGame } from "../hooks/game/useLiveGame.ts";
import { useState } from "react";

export default function GameBoard() {
	const { id } = useParams();
	const { gameData, loading, myPlayerName, playTurn } = useLiveGame(id);
	const [selectedCard, setSelectedCard] = useState<number | null>(null);

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
	const isMyTurn = game.current_turn === myPlayerName;

	const handleCardClick = (cardId: number) => {
		if (!isMyTurn) return;

		setSelectedCard((prev) => (prev === cardId ? null : cardId));
	};

	const handleOpponentClick = (targetName: string, isOnline: boolean) => {
		if (isMyTurn && selectedCard !== null && isOnline) {
			playTurn(selectedCard, targetName);
			setSelectedCard(null);
		}
	};

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

				{/* Si carta lista, avisar visualmente al jugador de que elija un rival */}
				{isMyTurn && selectedCard !== null && (
					<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/20 text-yellow-400 px-6 py-2 rounded-full border border-yellow-500 font-bold animate-bounce shadow-lg z-20">
						¡Elige a un jugador objetivo! 🎯
					</div>
				)}

				{game.opponents.map((player) => {
					// 👈 Variables de lógica visual
					const canBeTargeted =
						isMyTurn && selectedCard !== null && player.is_online;
					const offlineStyles = !player.is_online
						? "opacity-40 grayscale scale-95 border-gray-900"
						: "";
					const targetStyles = canBeTargeted
						? "cursor-crosshair hover:scale-105 hover:border-blue-400 hover:shadow-blue-500/50"
						: "";
					const roleStyles =
						player.role === "boss" ? "border-yellow-600" : "border-gray-700";

					return (
						<div
							key={player.name}
							onClick={() => handleOpponentClick(player.name, player.is_online)}
							className={`bg-gray-800 p-4 rounded-lg border-2 w-48 text-center shadow-xl z-10 transition-all
                                ${roleStyles} ${targetStyles} ${offlineStyles}
                            `}
						>
							{/* 👈 INDICADOR OFFLINE */}
							{!player.is_online && (
								<div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg animate-pulse z-50">
									🔌 OFFLINE
								</div>
							)}

							{player.role === "boss" && (
								<div className="text-2xl mb-1" title="Este jugador es el Jefe">
									👑
								</div>
							)}
							<h3
								className={`font-bold truncate ${!player.is_online ? "text-gray-500" : "text-white"}`}
							>
								{player.name}
							</h3>

							<div className="mt-3 bg-gray-900 rounded p-2 border border-gray-700">
								<p className="text-xs text-gray-500 uppercase">Estrés</p>
								<p
									className={`text-lg font-black ${!player.is_online ? "text-gray-600" : "text-red-500"}`}
								>
									{player.stress}
								</p>
							</div>
						</div>
					);
				})}
			</div>

			{/* ZONA DEL JUGADOR (Tus cartas y tu info) */}
			<div className="mt-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shrink-0 flex gap-6 items-end">
				{me.skip_next_turn && (
					<div className="absolute -top-4 left-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg border border-orange-400">
						⚠️ Penalización: Perderás tu próximo turno por inactividad.
					</div>
				)}
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
						<span className="text-sm font-bold text-red-500">{me.stress}</span>
					</div>
				</div>

				{/* Tus Cartas */}
				<div className="flex-1 border-l border-gray-700 pl-6">
					<p className="text-xs text-gray-500 uppercase font-bold mb-3">
						Tu Mano
					</p>
					<div className="flex gap-3">
						{me.cards.map((cardId, index) => {
							const isSelected = selectedCard === cardId;

							return (
								<div
									key={`${cardId}-${index}`}
									onClick={() => handleCardClick(cardId)}
									className={`
                                        w-24 h-36 rounded-lg border flex items-center justify-center shadow-lg transition-all
                                        ${isMyTurn ? "cursor-pointer hover:-translate-y-4" : "opacity-50 cursor-not-allowed"}
                                        ${isSelected ? "bg-blue-800 border-blue-400 -translate-y-4 shadow-blue-500/50 ring-2 ring-blue-400" : "bg-gray-700 border-gray-500"}
                                    `}
								>
									<span className="text-3xl text-gray-200 font-mono">
										{cardId}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
