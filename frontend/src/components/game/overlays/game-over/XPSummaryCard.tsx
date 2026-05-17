import type { XpSummary } from "../../../../types/xp";

const RANK_LABEL: Record<string, string> = {
	beginner: "Becario",
	intermediate: "Empleado del Mes",
	legendary: "CEO Legendario",
};

function getRank(level: number): string {
	if (level <= 10) return RANK_LABEL.beginner;
	if (level <= 25) return RANK_LABEL.intermediate;
	return RANK_LABEL.legendary;
}

interface XpSummaryCardProps {
	summary: XpSummary;
	hasWon: boolean;
}

export function XpSummaryCard({ summary, hasWon }: XpSummaryCardProps) {
	const { breakdown, total_earned, account } = summary;
	const progressPercent = account
		? Math.min(100, Math.round((account.xp_current / account.xp_needed) * 100))
		: 0;

	return (
		<div className="mt-4 border-t-2 border-black pt-4 font-serif text-black">
			{/* Desglose de XP */}
			<ul className="flex flex-col gap-1 text-sm">
				<li className="flex justify-between">
					<span>{hasWon ? "Victoria" : "Derrota"}</span>
					<span className="font-bold">+{breakdown.base} XP</span>
				</li>

				{breakdown.eliminations.xp > 0 && (
					<li className="flex justify-between">
						<span>
							Eliminaciones{" "}
							<span className="text-xs text-gray-600">
								(x{breakdown.eliminations.count})
							</span>
						</span>
						<span className="font-bold">+{breakdown.eliminations.xp} XP</span>
					</li>
				)}

				{breakdown.mvp > 0 && (
					<li className="flex justify-between">
						<span>MVP ⭐</span>
						<span className="font-bold">+{breakdown.mvp} XP</span>
					</li>
				)}
			</ul>

			{/* Total */}
			<div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-400 font-bold text-base">
				<span>EXP OBTENIDA</span>
				<span>+{total_earned} XP</span>
			</div>

			{/* Nivel y barra — solo para usuarios registrados */}
			{account ? (
				<div className="mt-4">
					<div className="flex justify-between items-baseline mb-1 text-sm">
						<span className="font-bold">
							Nivel {account.level}{" "}
							<span className="font-normal text-gray-600 text-xs">
								— {getRank(account.level)}
							</span>
						</span>
						<span className="text-xs text-gray-600">
							{account.xp_current} / {account.xp_needed} XP
						</span>
					</div>

					<div
						className="w-full h-3 bg-gray-300 border border-black rounded-sm overflow-hidden"
						role="progressbar"
						aria-valuenow={account.xp_current}
						aria-valuemin={0}
						aria-valuemax={account.xp_needed}
						aria-label={`Progreso al nivel ${account.level + 1}`}
					>
						<div
							className="h-full bg-black transition-all duration-700"
							style={{ width: `${progressPercent}%` }}
						/>
					</div>

					<p className="text-xs text-gray-600 mt-1 text-right">
						{account.xp_needed - account.xp_current} XP para nivel{" "}
						{account.level + 1}
					</p>
				</div>
			) : (
				<p className="mt-3 text-xs text-center text-gray-600 italic border-t border-gray-300 pt-3">
					Crea una cuenta para guardar tus resultados
				</p>
			)}
		</div>
	);
}
