import type { MyData } from "../../../types/live-game";
import { useGameUIStore } from "../../../store/useGameUIStore";

interface PlayerStatsProps {
	me: MyData;
}

export function PlayerStats({ me }: PlayerStatsProps) {
	const { isDiscardMode, perksToDiscard, toggleDiscardPerk } = useGameUIStore();

	const roleConfig = {
		boss: { color: "text-yellow-400", label: "👑 JEFE" },
		secretary: { color: "text-blue-400", label: "📋 SECRETARIO" },
		intern: { color: "text-green-400", label: "🎓 BECARIO" },
		union: { color: "text-red-400", label: "✊ SINDICALISTA" },
	}[me.role] || { color: "text-gray-400", label: "❓ DESCONOCIDO" };

	const hasAnyPerk =
		me.perks.has_shield ||
		(me.perks.vision_bonus ?? 0) > 0 ||
		(me.perks.distance_bonus ?? 0) > 0;
	const hasAnyCondition = me.conditions.is_blocked || me.conditions.acting_boss;

	const myRange = me.perks.vision_range ?? 1;

	// Helper para renderizar los iconos clickeables
	const renderDiscardablePerk = (
		id: string,
		icon: string,
		title: string,
		count?: number,
	) => {
		const isMarked = perksToDiscard.includes(id);

		const baseClasses = "flex items-center relative transition-transform";
		let modeClasses = "cursor-help hover:scale-110";

		if (isDiscardMode) {
			modeClasses = isMarked
				? "cursor-pointer scale-110 opacity-50 grayscale ring-2 ring-red-500 rounded-lg bg-red-900/30 px-1" // Estilo "marcado"
				: "cursor-pointer hover:scale-110 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)] bg-gray-800 rounded px-1 border border-red-500/50"; // Estilo "parpadeo" parecido al banner
		}

		return (
			<span
				key={id}
				title={isDiscardMode ? "Clic para descartar" : title}
				className={`${baseClasses} ${modeClasses}`}
				onClick={() => isDiscardMode && toggleDiscardPerk(id)}
			>
				{icon}
				{count && count > 1 && (
					<span className="text-[10px] ml-1 font-bold">x{count}</span>
				)}
				{isMarked && (
					<div className="absolute -top-2 -right-2 text-red-500 text-[10px] font-black drop-shadow-md bg-gray-900 rounded-full w-4 h-4 flex items-center justify-center border border-red-500">
						✕
					</div>
				)}
			</span>
		);
	};

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
			<div
				className={`flex justify-between items-center mt-2 pt-2 border-t h-10 border-gray-800`}
			>
				<span className={`text-xs uppercase text-gray-500`}>Equipamiento</span>
				<div className="flex gap-2 text-lg items-center">
					{me.perks.has_shield &&
						renderDiscardablePerk("has_shield", "🛡️", "Escudo Activo")}

					{(me.perks.vision_bonus ?? 0) > 0 &&
						renderDiscardablePerk(
							"vision_bonus",
							me.perks.vision_bonus == 1 ? "👓" : "🔭",
							`+${me.perks.vision_bonus} de alcance`,
							me.perks.vision_bonus,
						)}

					{(me.perks.distance_bonus ?? 0) > 0 &&
						renderDiscardablePerk(
							"distance_bonus",
							"🏠",
							"Los demás te ven a +1",
							me.perks.distance_bonus,
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
