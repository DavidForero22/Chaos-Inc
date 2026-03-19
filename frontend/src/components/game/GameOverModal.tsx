// src/components/game/GameOverModal.tsx

type WinnerRole = "boss" | "union" | "intern" | "canceled" | null;
type PlayerRole = "boss" | "secretary" | "intern" | "union";
type ConfigKey = "boss" | "union" | "intern" | "canceled";

const RESULT_CONFIG: Record<
	ConfigKey,
	{
		emoji: string;
		title: string;
		winners: PlayerRole[];
	}
> = {
	boss: {
		emoji: "👑",
		title: "¡El Jefe ha ganado!",
		winners: ["boss", "secretary"],
	},
	union: {
		emoji: "✊",
		title: "¡El Sindicato ha ganado!",
		winners: ["union"],
	},
	intern: {
		emoji: "🎓",
		title: "¡El Becario ha ganado!",
		winners: ["intern"],
	},
	canceled: {
		emoji: "🚫",
		title: "Partida cancelada",
		winners: [],
	},
};

const ROLE_LABELS: Record<PlayerRole, string> = {
	boss: "👑 Jefe",
	secretary: "📋 Secretario",
	intern: "🎓 Becario",
	union: "✊ Sindicalista",
};

interface GameOverModalProps {
	winnerRole: WinnerRole;
	myRole: PlayerRole;
	onClose: () => void;
}

export function GameOverModal({
	winnerRole,
	myRole,
	onClose,
}: GameOverModalProps) {
	const configKey: ConfigKey =
		winnerRole === "canceled" || !winnerRole ? "canceled" : winnerRole;
	const config = RESULT_CONFIG[configKey];
	const iWon = config.winners.includes(myRole);
	const isCancelled = configKey === "canceled";

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
			<div className="bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
				<div className="text-6xl mb-4">{config.emoji}</div>
				<h2 className="text-3xl font-black text-white mb-2">{config.title}</h2>

				{isCancelled ? (
					<p className="text-gray-400 text-sm mb-6">
						La partida no ha podido continuar y no se ha registrado ningún
						resultado.
					</p>
				) : (
					<>
						<div
							className={`inline-block px-4 py-2 rounded-full font-bold text-sm mb-6 ${
								iWon
									? "bg-green-900/50 text-green-400 border border-green-600"
									: "bg-red-900/50 text-red-400 border border-red-600"
							}`}
						>
							{iWon ? "🏆 ¡Has ganado!" : "💀 Has perdido"}
						</div>
						<div className="bg-gray-900 rounded-lg p-4 border border-gray-700 mb-6">
							<p className="text-xs text-gray-500 uppercase font-bold mb-2">
								Ganadores
							</p>
							<div className="flex justify-center gap-2 flex-wrap">
								{config.winners.map((role: PlayerRole) => (
									<span
										key={role}
										className="text-sm text-gray-300 font-semibold"
									>
										{ROLE_LABELS[role]}
									</span>
								))}
							</div>
						</div>
					</>
				)}

				<button
					onClick={onClose}
					className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
				>
					Volver al menú
				</button>
			</div>
		</div>
	);
}
