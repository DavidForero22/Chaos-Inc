// src/components/profile/RegisteredProfileView.tsx

import { useState, useMemo } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import type { GameRecord } from "../../types/api";
import styles from "./Profile.module.css";

const GAME_ROLE_LABELS: Record<string, string> = {
	boss: "👑 Jefe",
	secretary: "📋 Secretario",
	intern: "🎓 Becario",
	union: "✊ Sindicalista",
};

const ACCOUNT_ROLE_CONFIG: Record<
	string,
	{
		label: string;
		badgeClass: string;
		dotClass: string;
	}
> = {
	admin: {
		label: "Administrador",
		badgeClass: styles.roleAdmin,
		dotClass: styles.roleAdminDot,
	},
	user: {
		label: "Empleado",
		badgeClass: styles.roleUser,
		dotClass: styles.roleUserDot,
	},
};

interface RegisteredProfileViewProps {
	games: GameRecord[];
	onLogout: () => void;
	onDeleteAccount: () => void;
}

export default function RegisteredProfileView({
	games,
	onLogout,
	onDeleteAccount,
}: RegisteredProfileViewProps) {
	const { user, role } = useAuthStore();
	const [confirmDelete, setConfirmDelete] = useState(false);

	const roleConfig =
		ACCOUNT_ROLE_CONFIG[role ?? "user"] ?? ACCOUNT_ROLE_CONFIG.user;

	const stats = useMemo(() => {
		return games.reduce(
			(acc, game) => {
				const me = game.players.find((p) => p.displayName === user);
				if (!me) return acc;
				return {
					wins: acc.wins + (me.stats.hasWon ? 1 : 0),
					damage: acc.damage + me.stats.damageDealt,
					received: acc.received + me.stats.damageReceived,
					cards: acc.cards + me.stats.cardsPlayed,
					eliminations: acc.eliminations + me.stats.eliminations,
				};
			},
			{ wins: 0, damage: 0, received: 0, cards: 0, eliminations: 0 },
		);
	}, [games, user]);

	return (
		<div className={styles.dossier}>
			{/* ── CABECERA ── */}
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					<h1 className={styles.employeeName}>{user}</h1>
					<p className={styles.headerMeta}>
						{games.length} partidas en el registro
					</p>
				</div>

				{/* Badge de rol de cuenta */}
				<div className={`${styles.roleBadge} ${roleConfig.badgeClass}`}>
					<span className={`${styles.roleDot} ${roleConfig.dotClass}`} />
					{roleConfig.label}
				</div>
			</div>

			{/* ── ESTADÍSTICAS GLOBALES ── */}
			<div className={styles.section}>
				<p className={styles.sectionLabel}>Estadísticas Globales</p>
				<div className={styles.statsGrid}>
					<div className={styles.statCell}>
						<span className={styles.statLabel}>Victorias</span>
						<span
							className={`${styles.statValue} ${styles.statValueHighlight}`}
						>
							{stats.wins}
						</span>
					</div>
					<div className={styles.statCell}>
						<span className={styles.statLabel}>Derrotas</span>
						<span className={styles.statValue}>
							{games.length - stats.wins}
						</span>
					</div>
					<div className={styles.statCell}>
						<span className={styles.statLabel}>Eliminaciones</span>
						<span className={styles.statValue}>{stats.eliminations}</span>
					</div>
					<div className={styles.statCell}>
						<span className={styles.statLabel}>Daño infligido</span>
						<span className={styles.statValue}>{stats.damage}</span>
					</div>
					<div className={styles.statCell}>
						<span className={styles.statLabel}>Daño recibido</span>
						<span className={styles.statValue}>{stats.received}</span>
					</div>
					<div className={styles.statCell}>
						<span className={styles.statLabel}>Cartas jugadas</span>
						<span className={styles.statValue}>{stats.cards}</span>
					</div>
				</div>
			</div>

			{/* ── HISTORIAL ── */}
			<div className={styles.section}>
				<p className={styles.sectionLabel}>Historial de Partidas</p>

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

			{/* ── ACCIONES ── */}
			<div className={styles.section}>
				<p className={styles.sectionLabel}>Gestión de Cuenta</p>

				<button
					className={`${styles.actionBtn} ${styles.actionBtnLogout}`}
					onClick={onLogout}
				>
					Cerrar sesión
				</button>

				{!confirmDelete ? (
					<button
						className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
						onClick={() => setConfirmDelete(true)}
					>
						Solicitar baja de expediente
					</button>
				) : (
					<div className={styles.deleteConfirm}>
						<p className={styles.deleteConfirmText}>
							Esta acción es irreversible. El expediente será destruido
							permanentemente por el comité de sanciones.
						</p>
						<div className={styles.deleteConfirmBtns}>
							<button
								className={styles.confirmCancel}
								onClick={() => setConfirmDelete(false)}
							>
								Cancelar
							</button>
							<button
								className={styles.confirmDelete}
								onClick={onDeleteAccount}
							>
								Confirmar baja
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
