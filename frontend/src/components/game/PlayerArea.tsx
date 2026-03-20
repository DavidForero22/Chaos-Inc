import { PlayerHand } from "./PlayerHand.tsx";
import type { CardInstance, MyData, Opponent } from "../../types/live-game.ts";

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
}: PlayerAreaProps) {
	return (
		<div className="mt-4 bg-gray-800 p-6 rounded-xl border border-gray-700 shrink-0 flex gap-6 items-end relative">
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
								? "📋 SECRETARIO"
								: me.role === "intern"
									? "🎓 BECARIO"
									: "✊ SINDICALISTA"}
					</span>
				</div>

				<div className="flex justify-between items-center">
					<span className="text-xs text-gray-500 uppercase">Estrés</span>
					<span className="text-sm font-bold text-red-500">{me.stress}</span>
				</div>

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
				onCardClick={onCardClick}
				incomingAttack={me.incoming_attack}
				opponents={opponents}
				hasPendingAttack={hasPendingAttack}
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
