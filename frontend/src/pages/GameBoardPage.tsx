// src/pages/GameBoardPage.tsx

// -- HOOKS --
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

import { useLiveGame } from "../hooks/game/useLiveGame.ts";

// -- INTERFACES --
import type { CardInstance, Opponent } from "../types/live-game.ts";

// -- COMPONENTES --
import { PlayerHand } from "../components/game/PlayerHand.tsx";
import { OpponentsBoard } from "../components/game/OpponentsBoard.tsx";
import { RoleRevealModal } from "../components/game/RoleRevealModal.tsx";
import { GameOverModal } from "../components/game/GameOverModal.tsx";
import { logWithTime } from "../utils/logger.ts";

export default function GameBoardPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const {
		gameData,
		loading,
		myPlayerName,
		playTurn,
		endTurn,
		reactToAttack,
		isFirstLoad,
		setIsFirstLoad,
		gameOver,
		isActingBossAssigned,
		setIsActingBossAssigned,
		actingBossGraceTrigger,
		internGraceCancelled,
		setInternGraceCancelled,
	} = useLiveGame(id);
	const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

	// --- Contador reconexion jefe + Jefe heredado ---
	const [graceSecondsLeft, setGraceSecondsLeft] = useState<number | null>(null);
	const [showInheritanceBanner, setShowInheritanceBanner] = useState(false);
	const prevBossDisconnectedRef = useRef(false);
	const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [internGraceSecondsLeft, setInternGraceSecondsLeft] = useState<
		number | null
	>(null);
	const internCountdownRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	);

	useEffect(() => {
		if (!gameData) return;
		const bossDisconnected = Boolean(gameData.game.boss_disconnected);
		const wasDisconnected = prevBossDisconnectedRef.current;
		prevBossDisconnectedRef.current = bossDisconnected;

		if (bossDisconnected && !wasDisconnected) {
			setGraceSecondsLeft(10);

			if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
			countdownTimerRef.current = setInterval(() => {
				setGraceSecondsLeft((prev) => {
					if (prev === null || prev <= 1) {
						clearInterval(countdownTimerRef.current!);
						countdownTimerRef.current = null;
						setShowInheritanceBanner(true);
						if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
						bannerTimerRef.current = setTimeout(
							() => setShowInheritanceBanner(false),
							4500,
						);
						return null;
					}
					return prev - 1;
				});
			}, 1000);
		}

		if (!bossDisconnected && wasDisconnected) {
			if (countdownTimerRef.current) {
				clearInterval(countdownTimerRef.current);
				countdownTimerRef.current = null;
			}
			if (bannerTimerRef.current) {
				clearTimeout(bannerTimerRef.current);
				bannerTimerRef.current = null;
			}
			setGraceSecondsLeft(null);
			setShowInheritanceBanner(false);
		}

		return () => {
			if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
			if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
		};
	}, [gameData?.game.boss_disconnected]);

	// UseEffect para el jefe heredado
	useEffect(() => {
		if (!actingBossGraceTrigger) return;

		logWithTime("Iniciando cuenta atras de internGraceSecondsLeft (10s).");
		setInternGraceSecondsLeft(10);

		if (internCountdownRef.current) clearInterval(internCountdownRef.current);
		internCountdownRef.current = setInterval(() => {
			setInternGraceSecondsLeft((prev) => {
				if (prev === null || prev <= 1) {
					clearInterval(internCountdownRef.current!);
					internCountdownRef.current = null;
					return null;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			if (internCountdownRef.current) clearInterval(internCountdownRef.current);
		};
	}, [actingBossGraceTrigger]);

	// UseEffect para cancelar el countdown del becario
	useEffect(() => {
		if (!internGraceCancelled) return;
		setInternGraceCancelled(false);
		if (internCountdownRef.current) {
			clearInterval(internCountdownRef.current);
			internCountdownRef.current = null;
			setInternGraceSecondsLeft(null);
		}
	}, [internGraceCancelled]);

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

	const hasUsedAttackThisTurn = me.attack_used_this_turn;
	const hasPendingAttack = me.has_pending_attack;

	const selectedCardType =
		me.cards.find((c: CardInstance) => c.id === selectedCardId)?.type ?? null;

	const handleCardClick = (card: CardInstance) => {
		// Reacción: carta de esquive cuando tiene un ataque entrante
		if (me.incoming_attack && card.type === 3) {
			reactToAttack("dodge", card.id);
			return;
		}

		if (!isMyTurn) return;

		// CARTA DE CURACIÓN
		if (card.type === 2) {
			if (me.stress <= 0) return;
			playTurn(card.id, myPlayerName);
			return;
		}

		// CARTA DE ATAQUE
		if (card.type === 1) {
			if (hasUsedAttackThisTurn) return;
		}

		// CARTA DE ESCUDO
		if (card.type === 5) {
			if (me.has_shield) return;
			playTurn(card.id, myPlayerName);
			return;
		}

		// Resto de cartas (ataque, etc.): flujo normal de selección
		setSelectedCardId((prev) => (prev === card.id ? null : card.id));
	};

	const handleOpponentClick = (targetName: string, isOnline: boolean) => {
		if (!isMyTurn || selectedCardId === null || !isOnline) return;

		const selectedCard = me.cards.find(
			(c: CardInstance) => c.id === selectedCardId,
		);
		// Intentar robar
		if (selectedCard?.type === 4) {
			const target = game.opponents.find(
				(o: Opponent) => o.name === targetName,
			);
			if (!target || target.cards_count === 0) return;
		}

		playTurn(selectedCardId, targetName);
		setSelectedCardId(null);
	};

	const handleEndTurn = async () => {
		if (!isMyTurn || selectedCardId !== null || hasPendingAttack) return;
		await endTurn();
	};

	return (
		<div className="max-w-6xl mx-auto mt-4 flex flex-col h-[85vh]">
			{/* Modal rol inicial */}
			{isFirstLoad && gameData && (
				<RoleRevealModal
					role={gameData.me.role}
					onClose={() => setIsFirstLoad(false)}
				/>
			)}

			{/* Modal herencia de cargo — se abre por evento privado,
			    sin necesidad de que el jugador haga sync primero */}
			{isActingBossAssigned && gameData && (
				<RoleRevealModal
					role={gameData.me.role}
					isActingBoss={true}
					onClose={() => setIsActingBossAssigned(false)}
				/>
			)}

			{/* Cuenta atras de reconexion solo para el becario */}
			{internGraceSecondsLeft !== null && (
				<div className="bg-orange-900/40 border border-orange-700 text-orange-300 text-sm font-semibold px-4 py-2 rounded-lg mb-3 text-center">
					⏳ El jefe heredado se ha desconectado. Esperando reconexión...{" "}
					<span className="font-mono text-orange-200">
						{internGraceSecondsLeft}s
					</span>
				</div>
			)}

			{gameOver && gameData && (
				<GameOverModal
					winnerRole={gameData.game.winner_role}
					myRole={gameData.me.role}
					onClose={() => navigate("/")}
				/>
			)}

			{/* Contador de gracia */}
			{graceSecondsLeft !== null && (
				<div className="bg-blue-900/40 border border-blue-700 text-blue-300 text-sm font-semibold px-4 py-2 rounded-lg mb-3 text-center">
					⏳ El jefe se ha desconectado. Esperando reconexión...{" "}
					<span className="font-mono text-blue-200">{graceSecondsLeft}s</span>
				</div>
			)}

			{/* Banner de herencia — se auto-descarta a los 4.5s */}
			{showInheritanceBanner && (
				<div className="bg-yellow-900/40 border border-yellow-700 text-yellow-300 text-sm font-semibold px-4 py-2 rounded-lg mb-3 text-center">
					⚠️ El jefe se ha desconectado. Alguien ha heredado su cargo en
					secreto.
				</div>
			)}

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
					<p className="text-gray-500 text-xs mt-1">
						Ronda {game.round_number} · 🃏 {game.deck_count} cartas
					</p>
				</div>
			</div>

			{/* MESA CENTRAL */}
			<OpponentsBoard
				opponents={game.opponents}
				isMyTurn={isMyTurn}
				selectedCardId={selectedCardId}
				selectedCardType={selectedCardType}
				onOpponentClick={handleOpponentClick}
			/>

			{/* ZONA DEL JUGADOR */}
			<div className="mt-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shrink-0 flex gap-6 items-end">
				{me.skip_next_turn && (
					<div className="absolute -top-4 left-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg border border-orange-400">
						⚠️ Penalización: Perderás tu próximo turno por inactividad.
					</div>
				)}
				{/* Tu Info */}
				<div className="bg-gray-900 p-4 rounded-lg border border-gray-700 min-w-50">
					<h3
						className={`font-bold truncate mb-3 ${me.is_dead ? "text-red-500 line-through" : "text-blue-400"}`}
					>
						{me.name} (Tú) {me.is_dead && "💀"}
					</h3>
					<div className="flex justify-between items-center mb-2">
						<span className="text-xs text-gray-500 uppercase">Tu Rol</span>
						<span
							className={`text-sm font-bold ${
								me.role === "boss"
									? "text-yellow-400"
									: me.role === "secretary"
										? "text-blue-400"
										: me.role === "intern"
											? "text-green-400"
											: "text-red-400"
							}`}
						>
							{me.role === "boss"
								? "👑 JEFE"
								: me.role === "secretary"
									? "📋 SECRETARIA"
									: me.role === "intern"
										? "🎓 BECARIO"
										: "✊ SINDICALISTA"}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-xs text-gray-500 uppercase">Estrés</span>
						<span className="text-sm font-bold text-red-500">{me.stress}</span>
					</div>

					{/* Indicador de escudo */}
					{me.has_shield && (
						<div className="flex justify-between items-center mt-2">
							<span className="text-xs text-gray-500 uppercase">Escudo</span>
							<span className="text-sm font-bold text-cyan-400">🛡️ Activo</span>
						</div>
					)}

					{Boolean(me.acting_boss) && (
						<div className="flex justify-between items-center mt-2">
							<span className="text-xs text-gray-500 uppercase">Cargo</span>
							<span className="text-sm font-bold text-yellow-400">
								👑 Jefe en funciones
							</span>
						</div>
					)}
				</div>

				{/* Tus Cartas */}
				<PlayerHand
					me={me}
					isMyTurn={isMyTurn}
					selectedCardId={selectedCardId}
					onCardClick={handleCardClick}
					incomingAttack={me.incoming_attack}
					opponents={game.opponents}
					hasPendingAttack={hasPendingAttack}
				/>

				<div className="ml-auto flex flex-col items-end gap-2">
					{me.incoming_attack ? (
						<button
							onClick={() => reactToAttack("accept")}
							className="px-4 py-2 rounded font-bold text-sm transition bg-red-600 hover:bg-red-500 text-white"
						>
							Asumir daño
						</button>
					) : (
						<button
							onClick={handleEndTurn}
							disabled={
								!isMyTurn || selectedCardId !== null || hasPendingAttack
							}
							className={`
								px-4 py-2 rounded font-bold text-sm transition
								${
									isMyTurn && selectedCardId === null && !hasPendingAttack
										? "bg-purple-600 hover:bg-purple-500 text-white"
										: "bg-gray-700 text-gray-500 cursor-not-allowed"
								}
								`}
						>
							Terminar turno
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
