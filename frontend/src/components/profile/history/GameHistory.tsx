// src/components/profile/GameHistory.tsx
// Accesibilidad comprobada: SI

import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import type { GameRecord } from "../../../types/api";
import styles from "./GameHistory.module.css";
import viewStyles from "../RegisteredProfileView.module.css";
import { ROLE_LABELS } from "../../../data/roles";

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
	const gameRefs = useRef<Map<number | string, HTMLDivElement>>(new Map());

	// Lógica de paginación
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
		setExpandedGameId((prevId) => {
			const newId = prevId === gameId ? null : gameId;
			// Enfocar la fila expandida después del cambio de estado
			if (newId) {
				setTimeout(() => {
					gameRefs.current.get(newId)?.focus();
				}, 100);
			}
			return newId;
		});
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent, gameId: number | string) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				toggleExpand(gameId);
			}
		},
		[toggleExpand],
	);

	// Función para obtener la etiqueta del rol de forma segura
	const getRoleLabel = (role: string): string => {
		return ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role.toUpperCase();
	};

	// Calcular el rango de registros mostrados
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
							{/* ── CABECERA DE LA TABLA ── */}
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

							{/* ── LISTA DE PARTIDAS ── */}
							<div role="table" aria-label="Registros de partidas">
								{visibleGames.map((game) => {
									const me = game.players.find((p) => p.displayName === user);
									if (!me) return null;

									const won = me.stats.hasWon;
									const isExpanded = expandedGameId === game.id;
									const gameDate = new Date(game.playedAt).toLocaleDateString(
										"es-ES",
									);
									const gameDescription = `Partida del ${gameDate}. Resultado: ${won ? "Victoria" : "Derrota"}. Rol: ${getRoleLabel(me.stats.role)}`;

									return (
										<div
											key={game.id}
											className={styles.gameRecord}
											role="rowgroup"
										>
											{/* FILA PRINCIPAL (Interactiva) */}
											<div
												ref={(el) => {
													if (el) gameRefs.current.set(game.id, el);
													else gameRefs.current.delete(game.id);
												}}
												className={`${styles.gameRow} ${won ? styles.gameRowWin : styles.gameRowLoss}`}
												role="row"
												tabIndex={0}
												aria-expanded={isExpanded}
												aria-label={gameDescription}
												onClick={() => toggleExpand(game.id)}
												onKeyDown={(e) => handleKeyDown(e, game.id)}
											>
												<span className={styles.gameDate} role="cell">
													{gameDate}
												</span>
												<span
													className={`${styles.gameResult} ${won ? styles.resultWin : styles.resultLoss}`}
													role="cell"
													aria-label={
														won ? "Resultado: Victoria" : "Resultado: Derrota"
													}
												>
													{won ? "Victoria" : "Derrota"}
												</span>
												<span className={styles.gameRole} role="cell">
													{getRoleLabel(me.stats.role)}
												</span>
												<span
													className={`${styles.gameMeta} ${styles.textRight}`}
													role="cell"
													aria-label={`${game.totalRounds} rondas`}
												>
													{game.totalRounds}
												</span>
												<span
													className={`${styles.expandIcon} ${styles.textRight}`}
													role="cell"
													aria-label={
														isExpanded
															? "Contraer detalles"
															: "Expandir detalles"
													}
												>
													{isExpanded ? "[-]" : "[+]"}
												</span>
											</div>

											{/* CONTENIDO EXPANDIDO */}
											<div
												className={`${styles.expandableWrapper} ${isExpanded ? styles.open : ""}`}
												role="region"
												aria-label={`Detalles de la partida del ${gameDate}`}
												hidden={!isExpanded}
											>
												<div className={styles.expandedContentInner}>
													<div className={styles.expandedContent}>
														<h2 className={styles.expandedTitle}>
															REPORTE DE INCIDENCIA #{game.id}
														</h2>

														<div
															className={styles.myStatsBar}
															role="list"
															aria-label="Tus estadísticas en esta partida"
														>
															<span role="listitem">
																⚔ DAÑO: {me.stats.damageDealt}
															</span>
															<span role="listitem">
																🛡 RECIBIDO: {me.stats.damageReceived}
															</span>
															<span role="listitem">
																💀 BAJAS: {me.stats.eliminations}
															</span>
															<span role="listitem">
																🃏 CARTAS: {me.stats.cardsPlayed}
															</span>
														</div>

														<h3 className={styles.playersLabel}>
															SUJETOS INVOLUCRADOS:
														</h3>

														<div
															className={styles.playersTable}
															role="table"
															aria-label="Lista de jugadores en esta partida"
														>
															<div className={styles.playerHeader} role="row">
																<span role="columnheader">IDENTIFICACIÓN</span>
																<span role="columnheader">ROL</span>
																<span
																	className={styles.textCenter}
																	role="columnheader"
																>
																	DAÑO
																</span>
																<span
																	className={styles.textCenter}
																	role="columnheader"
																>
																	BAJAS
																</span>
															</div>

															{game.players.map((player) => (
																<div
																	key={player.userId}
																	className={`${styles.playerRow} ${player.stats.hasWon ? styles.playerWon : ""}`}
																	role="row"
																>
																	<span
																		className={styles.playerName}
																		role="cell"
																	>
																		{player.isGuest ? (
																			`${player.displayName} (INVITADO)`
																		) : (
																			<Link
																				to={`/profile/${player.userId}`}
																				className={styles.profileLink}
																				aria-label={`Ver perfil de ${player.displayName}`}
																			>
																				{player.displayName}
																			</Link>
																		)}
																	</span>
																	<span role="cell">
																		{getRoleLabel(player.stats.role)}
																	</span>
																	<span
																		className={styles.textCenter}
																		role="cell"
																	>
																		{player.stats.damageDealt}
																	</span>
																	<span
																		className={styles.textCenter}
																		role="cell"
																	>
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
						</div>

						{/* ── PAGINACIÓN ── */}
						<nav
							className={styles.pagination}
							role="navigation"
							aria-label="Paginación del historial de partidas"
						>
							<button
								className={styles.pageBtn}
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1}
								aria-label="Página anterior"
							>
								[ ANTERIOR ]
							</button>

							<span
								className={styles.pageInfo}
								aria-live="polite"
								aria-atomic="true"
							>
								PÁGINA {currentPage} DE {totalPages} // MOSTRANDO {showingStart}
								-{showingEnd} DE {games.length} REGISTROS TOTALES
							</span>

							<button
								className={styles.pageBtn}
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={currentPage === totalPages}
								aria-label="Página siguiente"
							>
								[ SIGUIENTE ]
							</button>
						</nav>
					</>
				)}
			</div>
		</section>
	);
}
