import type { MyData } from "../../../types/live-game";

interface PlayerStatsProps {
	me: MyData;
}

export function PlayerStats({ me }: PlayerStatsProps) {
	const roleConfig = {
		boss: { color: "text-yellow-400", label: "👑 JEFE" },
		secretary: { color: "text-blue-400", label: "📋 SECRETARIO" },
		intern: { color: "text-green-400", label: "🎓 BECARIO" },
		union: { color: "text-red-400", label: "✊ SINDICALISTA" },
	}[me.role] || { color: "text-gray-400", label: "❓ DESCONOCIDO" };

	// Separamos la validación visual
	const hasAnyPerk =
		me.perks.has_shield ||
		me.perks.vision_bonus > 0 ||
		me.perks.distance_bonus > 0;
	const hasAnyCondition = me.conditions.is_blocked || me.conditions.acting_boss;

	const myRange = me.perks.vision_range ?? 1;

	return (
		<div className="bg-gray-900 p-4 rounded-lg border border-gray-700 min-w-50">
			{/* Nombre */}
			<h3
				className={`font-bold truncate mb-3 ${me.is_dead ? "text-red-500 line-through" : "text-blue-400"}`}
			>
				{me.name} (Tú) {me.is_dead && "💀"}
			</h3>

			{/* Rol */}
			<div className="flex justify-between items-center mb-2 gap-4">
				<span className="text-xs text-gray-500 uppercase">Rol</span>
				<span className={`text-sm font-bold ${roleConfig.color}`}>
					{roleConfig.label}
				</span>
			</div>

			{/* Estrés */}
			<div className="flex justify-between items-center">
				<span className="text-xs text-gray-500 uppercase">Estrés</span>
				<span className="text-sm font-bold text-red-500">{me.stress}</span>
			</div>

			{/* Alcance */}
			<div className="flex justify-between items-center mt-2">
				<span className="text-xs text-gray-500 uppercase">Alcance</span>
				<span
					className="text-sm font-bold text-blue-300 flex items-center gap-1"
					title="A cuántos compañeros de distancia puedes atacar"
				>
					👁️ {myRange}
				</span>
			</div>

			{/* EQUIPAMIENTO (Perks) */}
			<div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800 h-8">
				<span className="text-xs text-gray-500 uppercase">Equipamiento</span>
				<div className="flex gap-2 text-lg">
					{/* Escudo */}
					{me.perks.has_shield && (
						<span
							title="Escudo Activo: Te protege del próximo ataque."
							className="cursor-help hover:scale-110 transition-transform"
						>
							🛡️
						</span>
					)}

					{/* Visión Bonus */}
					{me.perks.vision_bonus > 0 && (
						<span
							title={`+${me.perks.vision_bonus} de alcance.`}
							className="cursor-help hover:scale-110 transition-transform flex items-center"
						>
							{me.perks.vision_bonus == 1 ? "👓" : "🔭"}
						</span>
					)}

					{/* Lejania */}
					{me.perks.distance_bonus > 0 && (
						<span
							title={`Los demás te ven a +1 de distancia.`}
							className="cursor-help hover:scale-110 transition-transform flex items-center"
						>
							🏠
						</span>
					)}

					{!hasAnyPerk && (
						<span className="text-gray-600 text-xs font-mono">-</span>
					)}
				</div>
			</div>

			{/* ESTADOS (Conditions) */}
			<div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800 h-8">
				<span className="text-xs text-gray-500 uppercase">Estado</span>
				<div className="flex gap-2 text-lg">
					{me.conditions.is_blocked && (
						<span
							title="Bloqueado: No puedes jugar en tu turno."
							className="cursor-help hover:scale-110 transition-transform"
						>
							🔒
						</span>
					)}
					{me.conditions.acting_boss && (
						<span
							title="Jefe en Funciones: Has heredado el poder de la directiva."
							className="cursor-help hover:scale-110 transition-transform"
						>
							👑
						</span>
					)}
					{!hasAnyCondition && (
						<span className="text-gray-600 text-xs font-mono">-</span>
					)}
				</div>
			</div>
		</div>
	);
}
