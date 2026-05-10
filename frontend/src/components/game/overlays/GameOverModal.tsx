import { createPortal } from "react-dom";
import styles from "./GameOverModal.module.css";
import { RESULT_CONFIG, ROLE_LABELS } from "../../../data/gameResults.ts";
import type {
	WinnerRole,
	PlayerRole,
	ConfigKey,
} from "../../../data/gameResults.ts";
import { useGameStore } from "../../../store/useGameStore.ts";
import { ACHIEVEMENTS } from "../../../data/achievements.ts";

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
	// Resolver configuración
	const configKey: ConfigKey =
		winnerRole === "canceled" || !winnerRole ? "canceled" : winnerRole;
	const config = RESULT_CONFIG[configKey];

	// Calcular estados
	const iWon = config.winners.includes(myRole);
	const isCancelled = configKey === "canceled";

	// Logros desbloqueados en esta partida (solo del jugador)
	const matchAchievements = useGameStore((s) => s.matchAchievements);
	const achievementItems = matchAchievements
		.map((id) => ACHIEVEMENTS.find((a) => a.id === id))
		.filter(Boolean);

	// Obtener la fecha actual para el periódico
	const today = new Date().toLocaleDateString("es-ES", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return createPortal(
		<div className={styles.overlay}>
			{/* EL PERIÓDICO */}
			<div className={styles.newspaper}>
				{/* Cabecera del Periódico */}
				<div className={styles.masthead}>
					<h1 className={styles.newspaperName}>LA Agencia Preguntas</h1>
				</div>
				<div className={styles.subhead}>
					<span>Edición Especial de Cierre</span>
					<span>{today}</span>
					<span>GRATUITO</span>
				</div>

				{/* Titular Principal */}
				<h2 className={styles.headline}>{config.headline}</h2>

				{/* Gran Imagen Central con Subtítulo */}
				<div className={styles.photoWrapper}>
					<img
						src={config.image}
						alt="Foto del evento"
						className={styles.photoImage}
						onError={(e) => {
							e.currentTarget.style.display = "none";
						}}
					/>
					{/* El pie de foto estilo periódico */}
					{config.subtitle && (
						<p className="text-sm italic text-gray-700 mt-2 mb-4 text-center border-b border-gray-300 pb-2 font-serif">
							{config.subtitle}
						</p>
					)}
				</div>

				{/* Cuerpo de la Noticia */}
				<div className={styles.articleBody}>
					<p>{config.description}</p>

					{!isCancelled && (
						<div className="mt-6 border-t-2 border-black pt-4">
							<strong>FACCIONES VICTORIOSAS:</strong>
							<ul className="list-disc pl-5 mt-2">
								{config.winners.map((role) => (
									<li key={role} className="font-bold">
										{ROLE_LABELS[role]}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				{/* Logros obtenidos en la partida (se muestran siempre si existen) */}
				{achievementItems.length > 0 && (
					<div className={styles.achievementsSection}>
						<h3 className={styles.achievementsTitle}>Logros obtenidos</h3>
						<div className={styles.achievementsGrid}>
							{achievementItems.map((ach) => (
								<div key={ach!.id} className={styles.medalCard}>
									<div className={styles.medalRing}>
										<img
											src={ach!.image}
											alt={ach!.title}
											className={styles.medalImage}
										/>
									</div>
									<div className={styles.medalText}>
										<p className={styles.medalTitle}>{ach!.title}</p>
										<p className={styles.medalDesc}>
											{ach!.technicalDescription}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Resultado Personal */}
				{!isCancelled && (
					<div
						className={`${styles.finalResult} ${iWon ? styles.textWon : styles.textLost}`}
					>
						{iWon ? "¡HAS GANADO!" : "¡HAS PERDIDO!"}
					</div>
				)}

				{/* Botón Inferior para volver */}
				<button onClick={onClose} className={styles.exitButton}>
					Volver al Menú Principal
				</button>
			</div>
		</div>,
		document.body,
	);
}
