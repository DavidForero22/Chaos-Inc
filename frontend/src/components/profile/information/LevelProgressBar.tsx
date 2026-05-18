import { getLevelProgress, getRankLabel } from "../../../utils/experience";

interface LevelProgressBarProps {
	totalXp: number;
}

export default function LevelProgressBar({ totalXp }: LevelProgressBarProps) {
	const { level, xpCurrent, xpNeeded, percent, isMaxLevel } =
		getLevelProgress(totalXp);
	const rank = getRankLabel(level);

	return (
		<div className="flex flex-col gap-1 w-full">
			{/* Nivel y rango */}
			<div className="flex justify-between items-baseline">
				<span className="font-black font-mono text-sm uppercase tracking-wide">
					Nivel {level}
					<span className="font-normal text-gray-500 text-xs ml-2">
						— {rank}
					</span>
				</span>
				{!isMaxLevel && (
					<span className="text-xs font-mono text-gray-500">
						{xpCurrent} / {xpNeeded} XP
					</span>
				)}
			</div>

			{/* Barra de progreso */}
			<div
				className="w-full h-3 bg-gray-200 border border-black rounded-sm overflow-hidden"
				role="progressbar"
				aria-valuenow={isMaxLevel ? 100 : xpCurrent}
				aria-valuemin={0}
				aria-valuemax={isMaxLevel ? 100 : xpNeeded}
				aria-label={
					isMaxLevel
						? "Nivel máximo alcanzado"
						: `Progreso al nivel ${level + 1}`
				}
			>
				<div
					className="h-full bg-black transition-all duration-500"
					style={{ width: `${percent}%` }}
				/>
			</div>

			{/* Texto inferior */}
			<p className="text-xs font-mono text-gray-500 text-right">
				{isMaxLevel
					? "Nivel máximo alcanzado"
					: `${xpNeeded - xpCurrent} XP para nivel ${level + 1}`}
			</p>
		</div>
	);
}
