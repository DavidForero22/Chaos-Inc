// src/components/profile/GameHistoryPagination.tsx
import styles from "./GameHistoryPagination.module.css";

interface GameHistoryPaginationProps {
	currentPage: number;
	totalPages: number;
	showingStart: number;
	showingEnd: number;
	totalItems: number;
	onPageChange: (page: number) => void;
}

export function GameHistoryPagination({
	currentPage,
	totalPages,
	showingStart,
	showingEnd,
	totalItems,
	onPageChange,
}: GameHistoryPaginationProps) {
	return (
		<nav
			className={styles.pagination}
			role="navigation"
			aria-label="Paginación del historial de partidas"
		>
			<button
				className={styles.pageBtn}
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage === 1}
				aria-label="Página anterior"
			>
				[ ANTERIOR ]
			</button>

			<span className={styles.pageInfo} aria-live="polite" aria-atomic="true">
				PÁGINA {currentPage} DE {totalPages} // MOSTRANDO {showingStart}-
				{showingEnd} DE {totalItems} REGISTROS TOTALES
			</span>

			<button
				className={styles.pageBtn}
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				aria-label="Página siguiente"
			>
				[ SIGUIENTE ]
			</button>
		</nav>
	);
}
