import type { MyData } from "../../../types/live-game";

interface PlayerStatsProps {
	me: MyData;
}

export function PlayerStats({ me }: PlayerStatsProps) {
	// Definimos el color y nombre del rol para tener el JSX más limpio
	const roleConfig = {
		boss: { color: "text-yellow-400", label: "👑 JEFE" },
		secretary: { color: "text-blue-400", label: "📋 SECRETARIO" },
		intern: { color: "text-green-400", label: "🎓 BECARIO" },
		union: { color: "text-red-400", label: "✊ SINDICALISTA" },
	}[me.role] || { color: "text-gray-400", label: "❓ DESCONOCIDO" };

	const hasAnyStatus = me.has_shield || me.is_blocked || me.acting_boss;

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

			{/* Estados fusionados en una línea con tooltips */}
			<div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800 h-8">
				<span className="text-xs text-gray-500 uppercase">Estado</span>
				<div className="flex gap-2 text-lg">
					{me.has_shield && (
						<span
							title="Escudo Activo: Te protege del próximo ataque."
							className="cursor-help hover:scale-110 transition-transform"
						>
							🛡️
						</span>
					)}
					{me.is_blocked && (
						<span
							title="Bloqueado: No puedes jugar en tu turno."
							className="cursor-help hover:scale-110 transition-transform"
						>
							🔒
						</span>
					)}
					{me.acting_boss && (
						<span
							title="Jefe en Funciones: Has heredado el poder de la directiva."
							className="cursor-help hover:scale-110 transition-transform"
						>
							👑
						</span>
					)}
					{!hasAnyStatus && (
						<span className="text-gray-600 text-xs font-mono">-</span>
					)}
				</div>
			</div>
		</div>
	);
}
