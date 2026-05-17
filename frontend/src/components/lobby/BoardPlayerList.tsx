// src/components/lobby/BoardPlayerList.tsx
// Accesibilidad comprobada: SI

import type { RoomPlayer } from "../../types/api";
import styles from "./BoardPlayerList.module.css";

interface BoardPlayerListProps {
	players: RoomPlayer[];
	maxPlayers: number;
	ownerId: string | number;
	currentUserId: string | number | null;
	onKickClick: (playerId: string) => void;
}

export default function BoardPlayerList({
	players,
	maxPlayers,
	ownerId,
	currentUserId,
	onKickClick,
}: BoardPlayerListProps) {
	const amIOwner = String(ownerId) === String(currentUserId);
	const emptySlots = maxPlayers - players.length;

	return (
		<div
			className={styles.playerList}
			role="list"
			aria-label={`Lista de jugadores (${players.length}/${maxPlayers})`}
		>
			{players.map((player) => {
				const isMe = String(player.id) === String(currentUserId);
				const isPlayerTheOwner = String(player.id) === String(ownerId);

				return (
					<div
						key={player.id}
						className={styles.playerRow}
						role="listitem"
						aria-label={`Jugador: ${player.name}${isMe ? " (Tú)" : ""}${isPlayerTheOwner ? ", Líder" : ""}`}
					>
						<div className={`flex items-center ${styles.markerBlack}`}>
							<span
								className={`${styles.magnet} ${styles.magnetGreen}`}
								aria-hidden="true"
							></span>
							<span>{player.name}</span>

							{isMe && (
								<span
									className={`${styles.markerBlue} text-sm ml-3 italic`}
									aria-label="Este eres tú"
								>
									(Tú)
								</span>
							)}

							{isPlayerTheOwner && (
								<span
									className="text-sm ml-3"
									aria-label="Este jugador es el líder de la sala"
								>
									⭐ Líder
								</span>
							)}
						</div>

						{amIOwner && !isMe && (
							<button
								onClick={() => onKickClick(String(player.id))}
								className={styles.btnErase}
								aria-label={`Expulsar a ${player.name} de la sala`}
							>
								Expulsar
							</button>
						)}
					</div>
				);
			})}

			{emptySlots > 0 && (
				<div
					className={`${styles.playerRow} ${styles.markerBlack} opacity-50 italic`}
					role="listitem"
					aria-label={`${emptySlots} slot${emptySlots > 1 ? "s" : ""} disponible${emptySlots > 1 ? "s" : ""} esperando jugadores`}
				>
					<div className="flex items-center">
						<span
							className={`${styles.magnet} ${styles.magnetGray} animate-pulse`}
							aria-hidden="true"
						></span>
						<span>Esperando jugadores...</span>
					</div>
				</div>
			)}
		</div>
	);
}
