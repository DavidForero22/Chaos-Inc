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
}: PlayerAreaProps) {
	return (
		<div className="mt-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shrink-0 flex gap-6 items-end relative">
			{me.skip_next_turn && (
				<div className="absolute -top-4 left-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg border border-orange-400 animate-pulse">
					⚠️ Penalización: Perderás tu próximo turno por inactividad.
				</div>
			)}

			{/* Tu Info (Ahora extraída al nuevo componente) */}
			<PlayerStats me={me} />

			{/* Tus Cartas */}
			<PlayerHand
				me={me}
				isMyTurn={isMyTurn}
				selectedCardId={selectedCardId}
				onCardClick={onCardClick}
				incomingAttack={me.incoming_attack}
				opponents={opponents}
				hasPendingAttack={hasPendingAttack}
				hasPendingMultiAttack={hasPendingMultiAttack}
			/>

			{/* Botones de acción */}
			<div className="ml-auto flex flex-col items-end gap-2">
				{me.incoming_attack ? (
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
							endingSoon
						}
						className={`px-4 py-2 rounded font-bold text-sm transition ${
							isMyTurn &&
							selectedCardId === null &&
							!hasPendingAttack &&
							!endingSoon
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
