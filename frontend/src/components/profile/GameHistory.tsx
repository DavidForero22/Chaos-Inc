import type { GameRecord } from "../../types/api";
import styles from "./GameHistory.module.css";

const GAME_ROLE_LABELS: Record<string, string> = {
	boss: "👑 Jefe",
	secretary: "📋 Secretario",
	intern: "🎓 Becario",
	union: "✊ Sindicalista",
};

interface GameHistoryProps {
	games: GameRecord[];
	user: string | null | undefined;
}

export default function GameHistory({ games, user }: GameHistoryProps) {
	return (
		<div className={styles.historySection}>
			<p className={styles.historyLabel}>Historial de Partidas</p>

			{games.length === 0 ? (
				<p className={styles.emptyHistory}>
					[ Sin partidas registradas en el archivo corporativo ]
				</p>
			) : (
				<div className={styles.gameList}>
					{games.map((game) => {
						const me = game.players.find((p) => p.displayName === user);
						if (!me) return null;
						const won = me.stats.hasWon;

						return (
							<div
								key={game.id}
								className={`${styles.gameRow} ${won ? styles.gameRowWin : styles.gameRowLoss}`}
							>
								<div>
									<p
										className={`${styles.gameResult} ${won ? styles.gameResultWin : styles.gameResultLoss}`}
									>
										{won ? "Victoria" : "Derrota"}
									</p>
									<p className={styles.gameRole}>
										{GAME_ROLE_LABELS[me.stats.role] ?? me.stats.role}
									</p>
									<p className={styles.gameMeta}>
										{new Date(game.playedAt).toLocaleDateString("es-ES")}
										{" · "}
										{game.totalRounds} rondas
									</p>
								</div>
								<div className={styles.gameStats}>
									<p>⚔ {me.stats.damageDealt} daño</p>
									<p>🃏 {me.stats.cardsPlayed} cartas</p>
									<p>💀 {me.stats.eliminations} elim.</p>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
