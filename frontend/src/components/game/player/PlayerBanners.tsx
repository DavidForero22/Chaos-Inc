import type { MyData } from "../../../types/live-game.ts";

interface PlayerBannersProps {
	me: MyData;
}

export function PlayerBanners({ me }: PlayerBannersProps) {
	return (
		<>
			{/* Ataque simple entrante */}
			{me.combat_state.is_defending_single &&
				me.combat_state.attacker_name_single && (
					<div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] border border-red-400 animate-pulse z-20 whitespace-nowrap">
						⚠️ ¡{me.combat_state.attacker_name_single} te está intentando
						atacar!
					</div>
				)}

			{/* Ataque global entrante */}
			{me.combat_state.is_defending_multi &&
				me.combat_state.attacker_name_multi && (
					<div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] border border-red-400 animate-pulse z-20 whitespace-nowrap">
						⚠️ ¡{me.combat_state.attacker_name_multi} ha lanzado un ataque
						global!
					</div>
				)}

			{/* Penalización por inactividad */}
			{me.conditions.skip_next_turn && (
				<div className="absolute -top-4 left-4 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow-lg border border-orange-400 animate-pulse z-20">
					⚠️ Penalización: Perderás tu próximo turno por inactividad.
				</div>
			)}

			{/* Sabotaje pendiente */}
			{me.conditions.must_discard && (
				<div className="absolute -top-4 left-4 bg-red-700 text-white text-xs font-bold px-3 py-1 rounded shadow-lg border border-red-500 animate-pulse z-20">
					⚠️{" "}
					{me.conditions.must_discard_by
						? `${me.conditions.must_discard_by} te ha saboteado.`
						: "Has sido saboteado."}{" "}
					Debes descartar una carta antes de continuar.
				</div>
			)}
		</>
	);
}
