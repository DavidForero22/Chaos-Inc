// src/components/profile/GameHistory.tsx
import { useState, useRef, useCallback } from "react";
import type { GameRecord } from "../../../types/api";
import styles from "./GameHistory.module.css";
import viewStyles from "../RegisteredProfileView.module.css";
import { GameHistoryRow } from "./GameHistoryRow";
import { GameHistoryPagination } from "./GameHistoryPagination";

interface GameHistoryProps {
	games: GameRecord[];
	user: string | null | undefined;
}

const ITEMS_PER_PAGE = 20;

export default function GameHistory({ games, user }: GameHistoryProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const [expandedGameId, setExpandedGameId] = useState<number | string | null>(
		null,
	);
	const historyTopRef = useRef<HTMLDivElement>(null);

	const totalPages = Math.ceil(games.length / ITEMS_PER_PAGE) || 1;
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const visibleGames = games.slice(startIndex, startIndex + ITEMS_PER_PAGE);

	const handlePageChange = useCallback(
		(newPage: number) => {
			if (newPage >= 1 && newPage <= totalPages) {
				setCurrentPage(newPage);
				setExpandedGameId(null);
				historyTopRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
				historyTopRef.current?.focus({ preventScroll: true });
			}
		},
		[totalPages],
	);

	const toggleExpand = useCallback((gameId: number | string) => {
		setExpandedGameId((prevId) => (prevId === gameId ? null : gameId));
	}, []);

	const showingStart = startIndex + 1;
	const showingEnd = Math.min(startIndex + ITEMS_PER_PAGE, games.length);

	return (
		<section aria-labelledby="game-history-title">
			<h1 id="game-history-title" className={viewStyles.sectionTitle}>
				HISTORIAL DE PARTIDAS
			</h1>

			<div
				className={styles.historySection}
				ref={historyTopRef}
				tabIndex={-1}
				role="region"
				aria-label="Historial de partidas"
			>
				{games.length === 0 ? (
					<p className={styles.emptyHistory} role="status" aria-live="polite">
						[ SIN REGISTROS DE ACTIVIDAD ]
					</p>
				) : (
					<>
						<div className={styles.gameList}>
							<div className={styles.tableHeader} role="row" aria-hidden="true">
								<span role="columnheader">FECHA</span>
								<span role="columnheader">RESULTADO</span>
								<span role="columnheader">ROL ASIGNADO</span>
								<span className={styles.textRight} role="columnheader">
									RONDAS
								</span>
								<span className={styles.textRight} role="columnheader">
									DETALLES
								</span>
							</div>

							<div role="table" aria-label="Registros de partidas">
								{visibleGames.map((game) => (
									<GameHistoryRow
										key={game.id}
										game={game}
										user={user}
										isExpanded={expandedGameId === game.id}
										onToggle={toggleExpand}
									/>
								))}
							</div>
						</div>

						<GameHistoryPagination
							currentPage={currentPage}
							totalPages={totalPages}
							showingStart={showingStart}
							showingEnd={showingEnd}
							totalItems={games.length}
							onPageChange={handlePageChange}
						/>
					</>
				)}
			</div>
		</section>
	);
}
