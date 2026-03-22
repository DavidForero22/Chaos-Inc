import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

// --- HOOKS & STORE ---
import { useLiveGame } from "../hooks/game/useLiveGame.ts";
import { useGameStore } from "../store/useGameStore.ts";
import { usePlayerIdentity } from "../hooks/usePlayerIdentity.ts";
import { useGameTimers } from "../hooks/game/useGameTimers.ts";

// --- TIPOS ---
import type { CardInstance } from "../types/live-game.ts";

// --- COMPONENTES ---
import { OpponentsBoard } from "../components/game/board/OpponentsBoard.tsx";
import { RoleRevealModal } from "../components/game/overlays/RoleRevealModal.tsx";
import { GameOverModal } from "../components/game/overlays/GameOverModal.tsx";
import { PlayerArea } from "../components/game/player/PlayerArea.tsx";
import { GameLog } from "../components/game/board/GameLog.tsx";
import { LuckChallengeModal } from "../components/game/overlays/LuckChallengeModal.tsx";
import { GameBanners } from "../components/game/ui/GameBanners.tsx";

export default function GameBoardPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { myPlayerName } = usePlayerIdentity();

	// Iniciar el controlador del ciclo de vida (sockets, reconnect, offline handler)
	const { isConnecting } = useLiveGame(id);

	// Extraer  el estado global directamente de Zustand
	const gameData = useGameStore((state) => state.gameData);
	const isFirstLoad = useGameStore((state) => state.isFirstLoad);
	const setIsFirstLoad = useGameStore((state) => state.setIsFirstLoad);
	const gameOver = useGameStore((state) => state.gameOver);
	const showActingBossModal = useGameStore(
		(state) => state.showActingBossModal,
	);
	const setShowActingBossModal = useGameStore(
		(state) => state.setShowActingBossModal,
	);

	// Acciones del Store
	const playTurn = useGameStore((state) => state.playTurn);
	const endTurn = useGameStore((state) => state.endTurn);
	const reactToAttack = useGameStore((state) => state.reactToAttack);
	const reactToMultiAttack = useGameStore((state) => state.reactToMultiAttack);

	const {
		showBossWaiting,
		showActingBossWaiting,
		showEndingWaiting,
		showInheritanceBanner,
		multiAttackSecondsLeft,
	} = useGameTimers();

	// Estado Local UI
	const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
	const [luckResult, setLuckResult] = useState<"success" | "fail" | null>(null);

	const handleLuckResult = (success: boolean) => {
		setLuckResult(success ? "success" : "fail");
	};

	// --- EFECTO CON TEMPORIZADOR PARA PRUEBA DE SUERTE ---
	useEffect(() => {
		if (luckResult !== null) {
			const timer = setTimeout(() => {
				setLuckResult(null);
			}, 4000);
			return () => clearTimeout(timer);
		}
	}, [luckResult]);

	// --- PANTALLA DE CARGA INICIAL ---
	if (isConnecting || !gameData) {
		return (
			<div className="flex flex-col items-center justify-center h-[70vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
				<h2 className="text-xl text-gray-400 animate-pulse">
					Conectando con la oficina...
				</h2>
			</div>
		);
	}

	if (!myPlayerName) return null;

	const { me, game } = gameData;
	const isMyTurn = game.current_turn === myPlayerName;
	const hasPendingAttack = me.combat_state.is_attacking_single;
	const hasPendingMultiAttack = me.combat_state.is_defending_multi;
	const selectedCardType =
		me.cards.find((c: CardInstance) => c.id === selectedCardId)?.type ?? null;
	const isTurnFrozen = game.ending_soon || game.effectively_over;
	const hasLuckChallenge =
		isMyTurn && !!me.luck_challenge && luckResult === null;
	const isAttackerWaiting = me.combat_state.is_attacking_multi;

	// --- LÓGICA DE JUGABILIDAD ---
	const handleCardClick = (card: CardInstance) => {
		// Esquive: se puede esquivar tanto ataques simples como masivos
		if (
			(me.combat_state.is_defending_single || hasPendingMultiAttack) &&
			card.type === 3
		) {
			if (hasPendingMultiAttack) {
				reactToMultiAttack("dodge", card.id);
			} else {
				reactToAttack("dodge", card.id);
			}
			return;
		}

		// Fuera de tu turno o con prueba de suerte pendiente, no se puede jugar
		if (!isMyTurn || hasLuckChallenge || isAttackerWaiting) return;

		// Curación propia — solo si tienes estrés
		if (card.type === 2 && me.stress > 0)
			return playTurn(card.id, myPlayerName);

		// Ataque simple — solo uno por turno
		if (card.type === 1 && me.turn_limits.single_attack_used) return;

		// Escudo — solo si no tienes uno activo
		if (card.type === 5 && !me.conditions.has_shield)
			return playTurn(card.id, myPlayerName);

		// Ataque masivo — solo uno por turno, se juega directamente sin seleccionar objetivo
		if (card.type === 7 && !me.turn_limits.multi_attack_used)
			return playTurn(card.id, myPlayerName);

		// Curación masiva — se juega directamente, el backend cura a todos
		if (card.type === 8) return playTurn(card.id, myPlayerName);

		// Resto de cartas (ataque, robo...): flujo de selección de objetivo
		setSelectedCardId((prev) => (prev === card.id ? null : card.id));
	};

	const handleEndTurn = async () => {
		if (
			!isMyTurn ||
			selectedCardId !== null ||
			hasPendingAttack ||
			hasLuckChallenge ||
			isAttackerWaiting
		)
			return;
		await endTurn();
	};

	// --- RENDER ---
	return (
		<div className="max-w-6xl mx-auto mt-4 flex flex-col h-[85vh]">
			{/* --- MODALES --- */}
			{isFirstLoad && (
				<RoleRevealModal role={me.role} onClose={() => setIsFirstLoad(false)} />
			)}

			{showActingBossModal && (
				<RoleRevealModal
					role={me.role}
					isActingBoss={true}
					onClose={() => setShowActingBossModal(false)}
				/>
			)}

			{gameOver && (
				<GameOverModal
					winnerRole={game.winner_role}
					myRole={me.role}
					onClose={() => navigate("/")}
				/>
			)}

			{isMyTurn && me.luck_challenge && luckResult === null && (
				<LuckChallengeModal
					roomId={id!}
					colors={me.luck_challenge}
					onResult={handleLuckResult}
				/>
			)}

			{/* --- BANNERS --- */}
			<GameBanners
				luckResult={luckResult}
				showBossWaiting={showBossWaiting}
				showActingBossWaiting={showActingBossWaiting}
				showEndingWaiting={showEndingWaiting}
				showInheritanceBanner={showInheritanceBanner}
				multiAttackSecondsLeft={multiAttackSecondsLeft}
			/>

			{/* --- CABECERA --- */}
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
						{isMyTurn ? "👉 TU TURNO" : `👤 ${game.current_turn}`}
					</p>
					<p className="text-gray-500 text-xs mt-1">
						Ronda {game.round_number} · 🃏 {game.deck_count} cartas
					</p>
				</div>
			</div>

			{/* --- TABLERO --- */}
			<OpponentsBoard
				selectedCardId={selectedCardId}
				selectedCardType={selectedCardType}
				onCardPlayed={() => setSelectedCardId(null)}
			/>

			{/* --- ZONA DEL JUGADOR--- */}
			<PlayerArea
				me={me}
				isMyTurn={isMyTurn}
				selectedCardId={selectedCardId}
				hasPendingAttack={hasPendingAttack}
				endingSoon={isTurnFrozen || hasLuckChallenge}
				opponents={game.opponents}
				onCardClick={handleCardClick}
				onEndTurn={handleEndTurn}
				onReactToAttack={reactToAttack}
				hasPendingMultiAttack={hasPendingMultiAttack}
				onReactToMultiAttack={reactToMultiAttack}
				isAttackerWaiting={isAttackerWaiting}
			/>

			<GameLog />
		</div>
	);
}
