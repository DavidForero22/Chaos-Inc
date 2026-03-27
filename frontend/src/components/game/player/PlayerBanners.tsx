import { useTimerStore } from "../../../store/useTimerStore.ts";
import type { MyData } from "../../../types/live-game.ts";

interface PlayerBannersProps {
	me: MyData;
}

export function PlayerBanners({ me }: PlayerBannersProps) {
	// Timers
	const multiAttackSecondsLeft = useTimerStore((state) => state.multiAttackSecondsLeft);
    const sabotageSecondsLeft = useTimerStore((state) => state.sabotageSecondsLeft);
    const singleAttackSecondsLeft = useTimerStore((state) => state.singleAttackSecondsLeft);

	return (
		<>
			{/* Ataque simple entrante (Actualizado con temporizador) */}
            {me.combat_state.is_defending_single &&
                me.combat_state.attacker_name_single &&
                singleAttackSecondsLeft !== null && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] border border-red-400 animate-pulse z-20 whitespace-nowrap flex items-center gap-2">
                        ⚠️ ¡{me.combat_state.attacker_name_single} te está atacando! Decide en
                        <span className="font-mono text-white bg-red-800 px-1.5 py-0.5 rounded text-xs">
                            {singleAttackSecondsLeft}s
                        </span>
                    </div>
                )}

			{/* Ataque global entrante */}
			{me.combat_state.is_defending_multi &&
				me.combat_state.attacker_name_multi &&
				multiAttackSecondsLeft !== null && (
					<div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-500 text-red-100 text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse z-20 whitespace-nowrap flex items-center gap-2">
						⚠️ ¡{me.combat_state.attacker_name_multi} ha lanzado un ataque
						masivo! Decide en
						<span className="font-mono text-white bg-red-600 px-1.5 py-0.5 rounded text-xs">
							{multiAttackSecondsLeft}s
						</span>
					</div>
				)}

			{/* Sabotaje pendiente */}
			{me.conditions.must_discard &&
				me.conditions.must_discard_by &&
				sabotageSecondsLeft !== null && (
					<div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-orange-900/90 border border-orange-500 text-orange-100 text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.6)] animate-pulse z-20 whitespace-nowrap flex items-center gap-2">
						⚠️ ¡{me.conditions.must_discard_by} te obliga a descartar! Tienes
						<span className="font-mono text-white bg-orange-600 px-1.5 py-0.5 rounded text-xs">
							{sabotageSecondsLeft}s
						</span>
						o perderás una carta al azar.
					</div>
				)}

			{/* Penalización por inactividad */}
			{me.conditions.skip_next_turn && (
				<div className="absolute -top-4 left-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg border border-orange-400 animate-pulse z-20">
					⚠️ Penalización: Perderás tu próximo turno por inactividad.
				</div>
			)}
		</>
	);
}
