import { PlayerHand } from "./PlayerHand.tsx";
import { PlayerStats } from "./PlayerStats.tsx";
import type {
	CardInstance,
	MyData,
	Opponent,
} from "../../../types/live-game.ts";

interface PlayerAreaProps {
	me: MyData;
	isMyTurn: boolean;
	selectedCardId: string | null;
	hasPendingAttack: boolean;
	endingSoon: boolean;
	opponents: Opponent[];
	onCardClick: (card: CardInstance) => void;
	onEndTurn: () => void;
	onReactToAttack: (action: "accept" | "dodge") => void;
	hasPendingMultiAttack: boolean;
	onReactToMultiAttack: (action: "accept" | "dodge", cardId?: string) => void;
	isAttackerWaiting: boolean;
}

export function PlayerArea({
	me,
	isMyTurn,
	selectedCardId,
	hasPendingAttack,
	endingSoon,
	opponents,
	onCardClick,
	onEndTurn,
	onReactToAttack,
	hasPendingMultiAttack,
	onReactToMultiAttack,
	isAttackerWaiting,
}: PlayerAreaProps) {
	return (
		<div className="mt-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shrink-0 flex gap-6 items-end relative">
			{/* BANNERS DE ADVERTENCIA PERSONALES */}
			{me.combat_state.is_defending_single &&
				me.combat_state.attacker_name_single && (
					<div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] border border-red-400 animate-pulse z-20 whitespace-nowrap">
						⚠️ ¡{me.combat_state.attacker_name_single} te está intentando
						atacar!
					</div>
				)}

			{me.combat_state.is_defending_multi &&
				me.combat_state.attacker_name_multi && (
					<div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] border border-red-400 animate-pulse z-20 whitespace-nowrap">
						⚠️ ¡{me.combat_state.attacker_name_multi} ha lanzado un ataque
						global!
					</div>
				)}

			{me.conditions.skip_next_turn && (
				<div className="absolute -top-4 left-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg border border-orange-400 animate-pulse">
					⚠️ Penalización: Perderás tu próximo turno por inactividad.
				</div>
			)}

			<PlayerStats me={me} />

			<PlayerHand
				me={me}
				isMyTurn={isMyTurn}
				selectedCardId={selectedCardId}
				onCardClick={onCardClick}
				incomingAttack={me.combat_state.is_defending_single}
				opponents={opponents}
				hasPendingAttack={hasPendingAttack}
				hasPendingMultiAttack={hasPendingMultiAttack}
				isAttackerWaiting={isAttackerWaiting}
			/>

			<div className="ml-auto flex flex-col items-end gap-2">
				{me.combat_state.is_defending_single ? (
					<button
						onClick={() => onReactToAttack("accept")}
						className="px-4 py-2 rounded font-bold text-sm transition bg-red-600 hover:bg-red-500 text-white"
					>
						Asumir daño
					</button>
				) : hasPendingMultiAttack ? (
					<button
						onClick={() => onReactToMultiAttack("accept")}
						className="px-4 py-2 rounded font-bold text-sm transition bg-red-600 hover:bg-red-500 text-white"
					>
						Asumir daño
					</button>
				) : (
					<button
						onClick={onEndTurn}
						disabled={
							!isMyTurn ||
							selectedCardId !== null ||
							hasPendingAttack ||
							endingSoon ||
							isAttackerWaiting
						}
						className={`px-4 py-2 rounded font-bold text-sm transition ${
							isMyTurn &&
							selectedCardId === null &&
							!hasPendingAttack &&
							!endingSoon &&
							!isAttackerWaiting
								? "bg-purple-600 hover:bg-purple-500 text-white"
								: "bg-gray-700 text-gray-500 cursor-not-allowed"
						}`}
					>
						Terminar turno
					</button>
				)}
			</div>
		</div>
	);
}
