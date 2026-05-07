// src/components/profile/GameHistory.tsx

import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import type { GameRecord } from "../../types/api";
import styles from "./GameHistory.module.css";
import viewStyles from "./RegisteredProfileView.module.css";

const GAME_ROLE_LABELS: Record<string, string> = {
	boss: "👑 JEFE",
	secretary: "📋 SECRETARIO",
	intern: "🎓 BECARIO",
	union: "✊ SINDICALISTA",
};

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

	// Lógica de paginación
	const totalPages = Math.ceil(games.length / ITEMS_PER_PAGE) || 1;
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const visibleGames = games.slice(startIndex, startIndex + ITEMS_PER_PAGE);

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setCurrentPage(newPage);
			setExpandedGameId(null); // Cerrar desplegables al cambiar de página
			// Scroll hacia la etiqueta del historial
			historyTopRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}
	};

	const toggleExpand = (gameId: number | string) => {
		setExpandedGameId(expandedGameId === gameId ? null : gameId);
	};

	return (
		<>
			<h1 className={viewStyles.sectionLabel}>HISTORIAL DE PARTIDAS</h1>
			<div className={styles.historySection} ref={historyTopRef}>
				{games.length === 0 ? (
					<p className={styles.emptyHistory}>[ SIN REGISTROS DE ACTIVIDAD ]</p>
				) : (
					<>
						<div className={styles.gameList}>
							{/* ── CABECERA DE LA TABLA ── */}
							<div className={styles.tableHeader}>
								<span>FECHA</span>
								<span>RESULTADO</span>
								<span>ROL ASIGNADO</span>
								<span className={styles.textRight}>RONDAS</span>
								<span className={styles.textRight}>DETALLES</span>
							</div>

							{/* ── LISTA DE PARTIDAS ── */}
							{visibleGames.map((game) => {
								const me = game.players.find((p) => p.displayName === user);
								if (!me) return null;
								const won = me.stats.hasWon;
								const isExpanded = expandedGameId === game.id;

								return (
									<div key={game.id} className={styles.gameRecord}>
										{/* FILA PRINCIPAL (Clicable) */}
										<div
											className={`${styles.gameRow} ${won ? styles.gameRowWin : styles.gameRowLoss}`}
											onClick={() => toggleExpand(game.id)}
										>
											<span className={styles.gameDate}>
												{new Date(game.playedAt).toLocaleDateString("es-ES")}
											</span>
											<span
												className={`${styles.gameResult} ${won ? styles.resultWin : styles.resultLoss}`}
											>
												{won ? "ÉXITO" : "FRACASO"}
											</span>
											<span className={styles.gameRole}>
												{GAME_ROLE_LABELS[me.stats.role] ??
													me.stats.role.toUpperCase()}
											</span>
											<span
												className={`${styles.gameMeta} ${styles.textRight}`}
											>
												{game.totalRounds}
											</span>
											<span
												className={`${styles.expandIcon} ${styles.textRight}`}
											>
												{isExpanded ? "[-]" : "[+]"}
											</span>
										</div>

										{/* CONTENIDO EXPANDIDO (Detalles y Jugadores) */}
										<div
											className={`${styles.expandableWrapper} ${isExpanded ? styles.open : ""}`}
										>
											<div className={styles.expandedContentInner}>
												<div className={styles.expandedContent}>
													<p className={styles.expandedTitle}>
														REPORTE DE INCIDENCIA #{game.id}
													</p>

													<div className={styles.myStatsBar}>
														<span>⚔ DAÑO: {me.stats.damageDealt}</span>
														<span>🛡 RECIBIDO: {me.stats.damageReceived}</span>
														<span>💀 BAJAS: {me.stats.eliminations}</span>
														<span>🃏 CARTAS: {me.stats.cardsPlayed}</span>
													</div>

													<p className={styles.playersLabel}>
														SUJETOS INVOLUCRADOS:
													</p>
													<div className={styles.playersTable}>
														<div className={styles.playerHeader}>
															<span>IDENTIFICACIÓN</span>
															<span>ROL</span>
															<span className={styles.textCenter}>DAÑO</span>
															<span className={styles.textCenter}>BAJAS</span>
														</div>
														{game.players.map((player) => (
															<div
																key={player.userId}
																className={`${styles.playerRow} ${player.stats.hasWon ? styles.playerWon : ""}`}
															>
																<span className={styles.playerName}>
																	{player.isGuest ? (
																		`${player.displayName} (INVITADO)`
																	) : (
																		<Link
																			to={`/profile/${player.userId}`}
																			className={styles.profileLink}
																		>
																			{player.displayName}
																		</Link>
																	)}
																</span>
																<span>
																	{GAME_ROLE_LABELS[player.stats.role] ??
																		player.stats.role}
																</span>
																<span className={styles.textCenter}>
																	{player.stats.damageDealt}
																</span>
																<span className={styles.textCenter}>
																	{player.stats.eliminations}
																</span>
															</div>
														))}
													</div>
												</div>
											</div>
										</div>
									</div>
								);
							})}
						</div>

						{/* ── PAGINACIÓN ── */}
						<div className={styles.pagination}>
							<button
								className={styles.pageBtn}
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1}
							>
								[ ANTERIOR ]
							</button>

							<span className={styles.pageInfo}>
								PÁGINA {currentPage} DE {totalPages} // {games.length} REGISTROS
								TOTALES
							</span>

							<button
								className={styles.pageBtn}
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={currentPage === totalPages}
							>
								[ SIGUIENTE ]
							</button>
						</div>
					</>
				)}
			</div>
		</>
	);
}
