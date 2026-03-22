interface GameBannersProps {
	luckResult: "success" | "fail" | null;
	showBossWaiting: boolean;
	showActingBossWaiting: boolean;
	showEndingWaiting: boolean;
	showInheritanceBanner: boolean;
	multiAttackSecondsLeft: number | null;
}

export function GameBanners({
	luckResult,
	showBossWaiting,
	showActingBossWaiting,
	showEndingWaiting,
	showInheritanceBanner,
	multiAttackSecondsLeft,
}: GameBannersProps) {
	return (
		<div className="flex flex-col gap-2 mb-4">
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
				<div className="bg-red-900/40 border border-red-700 text-red-300 text-sm font-semibold px-4 py-2 rounded-lg text-center animate-fade-in">
					⚔️ ¡Ataque masivo! Decide en{" "}
					<span className="font-mono">{multiAttackSecondsLeft}s</span> o
					recibirás daño automáticamente.
				</div>
			)}

			{luckResult && (
				<div
					className={`px-4 py-2 rounded-lg text-center text-sm font-semibold border animate-fade-in ${
						luckResult === "success"
							? "bg-green-900/40 border-green-700 text-green-300"
							: "bg-red-900/40 border-red-700 text-red-300"
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
