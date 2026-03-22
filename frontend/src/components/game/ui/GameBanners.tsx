// src/components/game/ui/GameBanners.tsx

import { useGameStore } from "../../../store/useGameStore.ts";
import { usePlayerIdentity } from "../../../hooks/usePlayerIdentity.ts";

interface GameBannersProps {
	luckResult: "success" | "fail" | null;
	showBossWaiting: boolean;
	showActingBossWaiting: boolean;
	showEndingWaiting: boolean;
	showInheritanceBanner: boolean;
	multiAttackSecondsLeft: number | null;
	playerPendingSabotage?: string | null;
}

export function GameBanners({
	luckResult,
	showBossWaiting,
	showActingBossWaiting,
	showEndingWaiting,
	showInheritanceBanner,
	multiAttackSecondsLeft,
	playerPendingSabotage,
}: GameBannersProps) {
	const gameData = useGameStore((state) => state.gameData);
	const { myPlayerName } = usePlayerIdentity();

	if (!gameData) return null;
	const { game } = gameData;

	// Calculamos si debemos mostrar el banner de "alguien está decidiendo".
	// No lo mostramos si somos nosotros, porque nosotros ya tenemos la UI de los botones.
	const isSomeoneElseDefendingSingle =
		game.pending_single_attack_target &&
		game.pending_single_attack_target !== myPlayerName;

	const isSomeoneElseDefendingMulti =
		game.pending_multi_attack_targets.length > 0 &&
		!game.pending_multi_attack_targets.includes(myPlayerName || "");

	const isSomeoneElseInLuckChallenge =
		game.player_in_luck_challenge &&
		game.player_in_luck_challenge !== myPlayerName;

	return (
		<div className="flex flex-col gap-2 mb-4">
			{/* NUEVOS BANNERS INFORMATIVOS */}
			{isSomeoneElseDefendingSingle && (
				<div className="bg-purple-900/40 border border-purple-700 text-purple-300 text-sm font-semibold px-4 py-2 rounded-lg text-center animate-pulse shadow-[0_0_15px_rgba(147,51,234,0.3)]">
					⚔️ {game.pending_single_attack_target} está decidiendo si esquivar o
					asumir daño...
				</div>
			)}

			{isSomeoneElseDefendingMulti && (
				<div className="bg-purple-900/40 border border-purple-700 text-purple-300 text-sm font-semibold px-4 py-2 rounded-lg text-center animate-pulse shadow-[0_0_15px_rgba(147,51,234,0.3)]">
					⚔️ Múltiples jugadores están decidiendo si esquivar o asumir el ataque
					masivo...
				</div>
			)}

			{isSomeoneElseInLuckChallenge && (
				<div className="bg-cyan-900/40 border border-cyan-700 text-cyan-300 text-sm font-semibold px-4 py-2 rounded-lg text-center animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.3)]">
					🔒 {game.player_in_luck_challenge} está intentando escapar del
					bloqueo...
				</div>
			)}

			{/* TUS BANNERS ANTIGUOS */}
			{showActingBossWaiting && (
				<div className="bg-orange-900/40 border border-orange-700 text-orange-300 text-sm font-semibold px-4 py-2 rounded-lg text-center animate-fade-in">
					⏳ El jefe heredado se ha desconectado. Esperando 10s para
					reconexión...
				</div>
			)}

			{showBossWaiting && (
				<div className="bg-blue-900/40 border border-blue-700 text-blue-300 text-sm font-semibold px-4 py-2 rounded-lg text-center animate-fade-in">
					⏳ El jefe se ha desconectado. Esperando 10s para reconexión o
					sucesión...
				</div>
			)}

			{showInheritanceBanner && (
				<div className="bg-yellow-900/40 border border-yellow-700 text-yellow-300 text-sm font-semibold px-4 py-2 rounded-lg text-center animate-fade-in">
					⚠️ El tiempo expiró. Alguien ha heredado el cargo en secreto.
				</div>
			)}

			{showEndingWaiting && (
				<div className="bg-red-900/40 border border-red-700 text-red-300 text-sm font-semibold px-4 py-2 rounded-lg text-center animate-fade-in">
					⚠️ La partida podría terminar por abandono. Dando 10s de cortesía...
				</div>
			)}

			{multiAttackSecondsLeft !== null && (
				<div className="bg-red-900/40 border border-red-700 text-red-300 text-sm font-semibold px-4 py-2 rounded-lg text-center animate-fade-in shadow-[0_0_20px_rgba(220,38,38,0.4)]">
					⚔️ ¡Ataque masivo! Decide en{" "}
					<span className="font-mono text-white bg-red-800 px-1 rounded">
						{multiAttackSecondsLeft}s
					</span>{" "}
					o recibirás daño.
				</div>
			)}

			{playerPendingSabotage && playerPendingSabotage !== myPlayerName && (
				<div className="bg-purple-900/40 border border-purple-700 text-purple-300 text-sm font-semibold px-4 py-2 rounded-lg mb-3 text-center">
					⏳ {playerPendingSabotage} está decidiendo qué carta descartar...
				</div>
			)}

			{luckResult && (
				<div
					className={`px-4 py-2 rounded-lg text-center text-sm font-semibold border animate-fade-in ${
						luckResult === "success"
							? "bg-green-900/40 border-green-700 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
							: "bg-red-900/40 border-red-700 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
					}`}
				>
					{luckResult === "success"
						? "✅ ¡Acertaste! Puedes jugar tu turno."
						: "❌ Fallaste. Pierdes tu turno."}
				</div>
			)}
		</div>
	);
}
