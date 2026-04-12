// src/components/admin/GamesTab.tsx

import type { GameRecord } from "../../types/api.ts";

interface Props {
	games: GameRecord[];
}

// Diccionario de traducción de roles
const roleTranslations: Record<string, string> = {
	Boss: "Jefe",
	Intern: "Becario",
	Union: "Sindicalista",
	Secretary: "Secretario",
};

export default function GamesTab({ games }: Props) {
	return (
		<div className="flex flex-col gap-2">
			<h3 className="font-bold text-lg underline decoration-2 uppercase mb-4">
				Expedientes de Partidas Finalizadas
			</h3>

			{games.length === 0 ? (
				<p className="opacity-70 italic text-sm">
					No existen registros en el archivo.
				</p>
			) : (
				games.map((g) => (
					<div
						key={g.id}
						className="py-4 border-b border-dashed border-gray-400/50"
					>
						<div className="flex justify-between items-center mb-3">
							<p className="font-bold text-lg">
								Expediente #{g.id} <span className="mx-2 opacity-50">|</span>{" "}
								<span className="uppercase text-green-700">
									{/* Traducimos el ganador */}
									Victoria: {roleTranslations[g.winnerRole] || g.winnerRole}
								</span>
							</p>
							<p className="text-xs opacity-70 font-bold">
								{new Date(g.playedAt).toLocaleDateString("es-ES")} —{" "}
								{g.totalRounds} RONDAS
							</p>
						</div>

						<div className="flex flex-wrap gap-2 mt-2">
							{g.players?.map((p, i) => (
								<span
									key={i}
									className={`text-xs px-2 py-1 font-bold tracking-wide uppercase border-2 ${
										p.stats.hasWon
											? "border-green-600 text-green-700 bg-green-100/50"
											: "border-gray-400 text-gray-500"
									}`}
								>
									{p.displayName} {p.isGuest ? "(INVITADO)" : ""} :{" "}
									{/* Traducir el rol de cada jugador */}
									{roleTranslations[p.stats.role] || p.stats.role}
								</span>
							))}
						</div>
					</div>
				))
			)}
		</div>
	);
}
